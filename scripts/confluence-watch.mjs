#!/usr/bin/env node
// BA workflow kit — confluence-watch (kit design §6). Node >= 20, no dependencies, no AI, no MCP.
// Run by .github/workflows/confluence-watch.yml. Compares the source page (and children, attachments)
// in Confluence with ba-project.yaml; on a difference it saves every new page version as received from
// Confluence REST into $SNAP (the workflow pushes it to the branch watch.snapshot_branch, K-29) and opens
// one issue / Jira task "run /ba-sync" or comments on the open one (watch.notify, K-27), assigned to and
// mentioning the BA (K-28). Never writes to Confluence or to the main branch. Secrets are read from env
// only, never printed.

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const env = process.env;
const summary = (line) => { console.log(line); if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, line + '\n'); };
const cfg = JSON.parse(readFileSync(env.BA_PROJECT_JSON, 'utf8'));
const { site, cloud_id: cloudId } = cfg.atlassian ?? {};
const src = cfg.source ?? {};
const watch = cfg.watch ?? {};
const jiraCfg = cfg.jira ?? {};
const label = watch.issue_label || 'ba-sync';
const errorLabel = 'ba-watch-error';
const notify = new Set(watch.notify === 'both' ? ['github', 'jira'] : [watch.notify || 'github']);
const runUrl = env.GITHUB_RUN_ID ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}` : '';

if (!watch.enabled) { summary('watch.enabled is false in ba-project.yaml — nothing checked.'); process.exit(0); }
if (!env.CONFLUENCE_EMAIL || !env.CONFLUENCE_API_TOKEN) {
  summary('Secrets CONFLUENCE_EMAIL / CONFLUENCE_API_TOKEN are not set — the BA adds them with `gh secret set`.');
  process.exit(1);
}
if (notify.has('jira') && !env.JIRA_API_TOKEN) {
  summary('watch.notify includes jira, but the secret JIRA_API_TOKEN is not set — the BA adds it with `gh secret set`. Jira is skipped.');
  notify.delete('jira'); notify.add('github');
}

const basic = (email, token) => 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
class HttpError extends Error { constructor(status, what) { super(`${what}: HTTP ${status}`); this.status = status; } }
async function http(url, what, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, { method, headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new HttpError(res.status, what);
  return res.status === 204 ? null : res.json().catch(() => null);
}

// ---------- Confluence (read only) ----------
// Scoped API tokens go through the API gateway (needs cloud_id); a classic token can use the site URL.
const cBase = env.CONFLUENCE_API === 'site' ? `https://${site}/wiki` : `https://api.atlassian.com/ex/confluence/${cloudId}/wiki`;
const cAuth = { Authorization: basic(env.CONFLUENCE_EMAIL, env.CONFLUENCE_API_TOKEN) };
const confluence = (path, what) => http(cBase + path, what, { headers: cAuth });
async function all(path, what) {
  const out = []; let next = path;
  while (next) {
    const page = await confluence(next, what);
    out.push(...(page.results ?? []));
    next = page._links?.next ? page._links.next.replace(/^\/wiki/, '') : null;
  }
  return out;
}

// ---------- GitHub ----------
const [owner, repo] = (env.GITHUB_REPOSITORY || '/').split('/');
const assignee = watch.assignee || env.GITHUB_REPOSITORY_OWNER || owner;
const gh = (method, path, body) => http(`https://api.github.com/repos/${owner}/${repo}${path}`, `GitHub ${method} ${path}`,
  { method, body, headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } });
const ensureLabel = (name, color) => gh('POST', '/labels', { name, color }).catch((e) => { if (e.status !== 422) throw e; });
const openIssues = (name) => gh('GET', `/issues?state=open&labels=${encodeURIComponent(name)}&per_page=10`);
const MARK = /<!-- ba-watch state: (.*?) -->/g;

async function createIssue(issue) {
  try { return { ...(await gh('POST', '/issues', { ...issue, assignees: [assignee] })), assigned: true }; }
  catch (e) {   // the owner is an organisation or has no access — open it unassigned
    if (e.status !== 422) throw e;
    summary(`Cannot assign @${assignee} — set watch.assignee to a GitHub login with access to the repository.`);
    return gh('POST', '/issues', issue);
  }
}

// one open issue per label; a comment only when the state differs from the last one reported
async function githubReport({ label, color, title, text, state, again }) {
  await ensureLabel(label, color);
  const open = await openIssues(label);
  const body = `${text}\n\n@${assignee}\n\n<!-- ba-watch state: ${state} -->`;
  if (!open.length) { const issue = await createIssue({ title, labels: [label], body }); return `opened issue #${issue.number}${issue.assigned ? ` (assigned to @${assignee})` : ' (unassigned)'}`; }
  const issue = open[0];
  const comments = await gh('GET', `/issues/${issue.number}/comments?per_page=100`);
  const last = [...[issue.body || '', ...comments.map((c) => c.body || '')].join('\n').matchAll(MARK)].pop()?.[1];
  if (last === state) return `issue #${issue.number} already reports this state — nothing to add`;
  await gh('POST', `/issues/${issue.number}/comments`, { body: `${again}\n\n${body}` });
  return `commented on issue #${issue.number}`;
}

async function githubResolve(label, text) {
  const open = await openIssues(label);
  for (const issue of open) {
    await gh('POST', `/issues/${issue.number}/comments`, { body: text });
    await gh('PATCH', `/issues/${issue.number}`, { state: 'closed' });
  }
  return open.length ? `closed issue ${open.map((i) => '#' + i.number).join(', ')}` : null;
}

// ---------- Jira (K-27; a separate write-scoped token) ----------
const jBase = env.JIRA_API === 'site' ? `https://${site}` : `https://api.atlassian.com/ex/jira/${cloudId}`;
const jAuth = { Authorization: basic(env.JIRA_EMAIL || env.CONFLUENCE_EMAIL, env.JIRA_API_TOKEN || '') };
const jira = (method, path, body) => http(jBase + path, `Jira ${method} ${path.split('?')[0]}`, { method, body, headers: jAuth });
const PROP = 'ba-watch-state';
let jiraAssignee;
async function jiraAccount() {
  jiraAssignee ??= watch.jira_assignee || (await jira('GET', '/rest/api/3/myself')).accountId;
  return jiraAssignee;
}
// Atlassian document format: one paragraph per line, a mention of the assignee at the end
const adf = (text, accountId) => ({
  type: 'doc', version: 1,
  content: [...text.split('\n').filter((l) => l.trim()).map((l) => ({ type: 'paragraph', content: [{ type: 'text', text: l }] })),
    { type: 'paragraph', content: [{ type: 'mention', attrs: { id: accountId } }] }],
});
async function jiraOpen(label) {
  const jql = `project = "${jiraCfg.project_key}" AND labels = "${label}" AND statusCategory != Done ORDER BY created ASC`;
  return (await jira('POST', '/rest/api/3/search/jql', { jql, fields: ['summary'], maxResults: 1 })).issues ?? [];
}
async function jiraReport({ label, title, text, state, again }) {
  const accountId = await jiraAccount();
  const [open] = await jiraOpen(label);
  if (!open) {
    const labels = [label, jiraCfg.labels?.project].filter(Boolean);
    const issue = await jira('POST', '/rest/api/3/issue', { fields: {
      project: { key: jiraCfg.project_key }, issuetype: { id: String(jiraCfg.issue_types?.task) }, summary: title, labels,
      description: adf(text, accountId), assignee: { accountId } } });
    await jira('PUT', `/rest/api/3/issue/${issue.key}/properties/${PROP}`, { state });
    return `created Jira ${issue.key}`;
  }
  const last = await jira('GET', `/rest/api/3/issue/${open.key}/properties/${PROP}`).then((p) => p?.value?.state, () => null);
  if (last === state) return `Jira ${open.key} already reports this state — nothing to add`;
  await jira('POST', `/rest/api/3/issue/${open.key}/comment`, { body: adf(`${again}\n${text}`, accountId) });
  await jira('PUT', `/rest/api/3/issue/${open.key}/properties/${PROP}`, { state });
  return `commented on Jira ${open.key}`;
}
async function jiraResolve(label, text) {
  const open = await jiraOpen(label);
  for (const issue of open) {
    await jira('POST', `/rest/api/3/issue/${issue.key}/comment`, { body: adf(text, await jiraAccount()) });
    const done = jiraCfg.statuses?.done;
    const t = done && (await jira('GET', `/rest/api/3/issue/${issue.key}/transitions`)).transitions?.find((x) => String(x.to?.id) === String(done));
    if (t) await jira('POST', `/rest/api/3/issue/${issue.key}/transitions`, { transition: { id: t.id } });
  }
  return open.length ? `resolved Jira ${open.map((i) => i.key).join(', ')}` : null;
}

// every enabled channel; a failing channel does not stop the others
async function report(msg) {
  for (const ch of notify) {
    try { summary(`${ch}: ${await (ch === 'jira' ? jiraReport(msg) : githubReport(msg))}`); }
    catch (e) { summary(`${ch}: notification failed — ${e.message}`); if (ch === 'github') process.exitCode = 1; }
  }
}
async function resolve(label, text) {
  for (const ch of notify) {
    try { const r = await (ch === 'jira' ? jiraResolve(label, text) : githubResolve(label, text)); if (r) summary(`${ch}: ${r}`); }
    catch (e) { summary(`${ch}: could not close the ${label} item — ${e.message}`); }
  }
}

// ---------- compare ----------
const pageUrl = `https://${site}/wiki/spaces/${src.space_key}/pages/${src.page_id}`;

async function current() {
  const page = await confluence(`/api/v2/pages/${src.page_id}`, 'page');
  const state = { page: page.version?.number ?? null, message: page.version?.message || '', children: [], attachments: [] };
  if (src.include_children) {
    const desc = await all(`/api/v2/pages/${src.page_id}/descendants?limit=250`, 'descendants');
    for (const d of desc.filter((d) => d.type === 'page')) {
      const child = await confluence(`/api/v2/pages/${d.id}`, `child ${d.id}`);
      state.children.push({ id: String(d.id), title: child.title, version: child.version?.number ?? null });
    }
  }
  if (src.include_attachments) {
    const atts = await all(`/api/v2/pages/${src.page_id}/attachments?limit=250`, 'attachments');
    state.attachments = atts.map((a) => ({ id: String(a.id), title: a.title, version: a.version?.number ?? null }));
  }
  return state;
}

function differences(now) {
  const rows = [];
  if (now.page !== src.version) rows.push(['page', src.page_id, `v${src.version}`, `v${now.page}`]);
  const cmp = (kind, known = [], seen = []) => {
    const k = new Map(known.map((x) => [String(x.id), x]));
    const s = new Map(seen.map((x) => [String(x.id), x]));
    for (const [id, x] of s) {
      if (!k.has(id)) rows.push([kind, `${id} "${x.title}"`, '—', `v${x.version} (new)`]);
      else if (k.get(id).version !== x.version) rows.push([kind, `${id} "${x.title}"`, `v${k.get(id).version}`, `v${x.version}`]);
    }
    for (const [id, x] of k) if (!s.has(id)) rows.push([kind, `${id} "${x.title}"`, `v${x.version}`, 'removed']);
  };
  if (src.include_children) cmp('child page', src.children, now.children);
  if (src.include_attachments) cmp('attachment', src.attachments, now.attachments);
  return rows;
}

// ---------- snapshots (K-29) ----------
// Every version from the one in ba-project.yaml (the baseline, so /ba-sync diffs REST against REST) up to
// the current one, each as received: body.storage.value written unchanged + meta.json. Existing folders
// are never rewritten. $SNAP is the checked-out snapshot branch (set by the workflow).
const MAX_VERSIONS = 50;
async function saveSnapshots(now) {
  if (!env.SNAP) return [];
  const saved = [];
  if (!existsSync(join(env.SNAP, '.gitattributes'))) writeFileSync(join(env.SNAP, '.gitattributes'), '* -text\n');   // bytes as received (K-1)
  const want = [{ id: String(src.page_id), from: src.version ?? now.page, to: now.page }];
  const known = new Map((src.children ?? []).map((c) => [String(c.id), c.version]));
  for (const c of now.children) if (known.get(c.id) !== c.version) want.push({ id: c.id, from: known.get(c.id) ?? 1, to: c.version });
  for (const { id, from, to } of want) {
    for (let v = Math.max(1, from, to - MAX_VERSIONS + 1); v <= to; v++) {
      const dir = join(env.SNAP, 'confluence', id, `v${v}`);
      if (existsSync(join(dir, 'meta.json'))) continue;
      const p = await confluence(`/api/v2/pages/${id}?body-format=storage&version=${v}`, `snapshot ${id} v${v}`);
      const body = p.body?.storage?.value ?? '';
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'page.storage.html'), body);
      writeFileSync(join(dir, 'meta.json'), JSON.stringify({
        page_id: id, title: p.title, space_key: src.space_key, version: p.version?.number ?? v, created_at: p.version?.createdAt ?? null,
        version_message: p.version?.message ?? '', author_id: p.version?.authorId ?? null, parent_id: p.parentId ?? null,
        fetched_at: new Date().toISOString(), fetched_via: 'confluence-watch (REST v2, body-format=storage)',
        sha256: { page_storage_html: createHash('sha256').update(body).digest('hex') },
      }, null, 2) + '\n');
      saved.push(`${id} v${v}`);
    }
  }
  return saved;
}

// ---------- errors (K-30) ----------
// With a scoped token through api.atlassian.com, bad credentials are not refused: the request runs as
// anonymous and the page answers 404. One probe of the current user tells the two causes apart.
async function probeAuth() {
  try {
    const me = await confluence('/rest/api/user/current', 'auth probe');
    return me?.type === 'anonymous' || !me?.accountId ? 'anonymous' : 'ok';
  } catch (e) { return e.status === 401 || e.status === 403 ? 'refused' : 'unknown'; }
}
const TOKEN_FIX = 'the BA creates a new token (read scopes, kit design §6) and types `! gh secret set CONFLUENCE_API_TOKEN`; check `CONFLUENCE_EMAIL` is the token owner\'s e-mail';
async function diagnose(err) {
  if (err.status === 401 || err.status === 403) return { what: 'auth failed (token, email or scopes)', fix: [TOKEN_FIX] };
  if (err.status !== 404) return { what: 'request failed', fix: ['check the run log; a 5xx usually passes on the next run'] };
  const probe = await probeAuth();
  if (probe === 'anonymous' || probe === 'refused')
    return { what: 'auth failed (token, email or scopes)', detail: `the auth probe ran ${probe === 'anonymous' ? 'as anonymous' : 'and was refused'} — Confluence answers 404 to a page it hides from an unauthenticated request`, fix: [TOKEN_FIX] };
  if (probe === 'ok')
    return { what: 'page not found or not visible to the token account', detail: 'the token works (auth probe passed)', fix: ['check `source.page_id` in `ba-project.yaml`', 'check that the token owner can open the page (page restrictions, space permission)'] };
  return { what: 'page not found — most likely a bad token', detail: 'the auth probe gave no answer', fix: [TOKEN_FIX, 'if the token is fine: check `source.page_id` and the page restrictions'] };
}
async function reportError(err) {
  const d = await diagnose(err);
  summary(`watch: ${d.what} — ${err.message}${d.detail ? ` (${d.detail})` : ''}`);
  await report({
    label: errorLabel, color: 'd93f0b', title: `watch: ${d.what}`, state: JSON.stringify({ error: d.what, status: err.status }),
    again: 'Still failing, with a different result.',
    text: `The weekday check of ${pageUrl} failed: \`${err.message}\`${d.detail ? ` — ${d.detail}` : ''}.\n\n` +
      d.fix.map((f) => `- ${f}`).join('\n') + `\n\nRun: ${runUrl}\nThe next successful run closes this automatically.`,
  });
}

// ---------- main ----------
let now;
try { now = await current(); }
catch (err) {
  if (!(err instanceof HttpError)) { summary(`watch: ${err.message}`); process.exit(1); }
  await reportError(err);
  process.exit(process.exitCode ?? 0);
}
await resolve(errorLabel, `The check works again (${runUrl || new Date().toISOString()}) — closing.`);

const rows = differences(now);
if (!rows.length) { summary(`No changes: page ${src.page_id} v${now.page} = ba-project.yaml.`); process.exit(process.exitCode ?? 0); }
summary(['| What | Id | In ba-project.yaml | In Confluence |', '|---|---|---|---|', ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n'));

let saved = [], snapNote = '';
try {
  saved = await saveSnapshots(now);
  if (env.SNAP) snapNote = saved.length ? `Snapshots saved on branch \`${env.SNAP_BRANCH}\`: ${saved.join(', ')}.` : `Snapshots: already on branch \`${env.SNAP_BRANCH}\`.`;
} catch (e) { snapNote = `Snapshots NOT saved: ${e.message} — /ba-sync will see only the current version.`; }
if (snapNote) summary(snapNote);

const state = JSON.stringify({ page: now.page, children: now.children.map((c) => [c.id, c.version]), attachments: now.attachments.map((a) => [a.id, a.version]) });
const lines = rows.map(([what, id, was, is]) => `- ${what} ${id}: ${was} → ${is}`).join('\n');
await report({
  label, color: '0e8a16', state, again: 'Changed again since the last report.',
  title: `Confluence page ${src.page_id} changed: v${src.version} → v${now.page} — run /ba-sync`,
  text: `${lines}\n\nPage: ${pageUrl}` + (now.message ? `\nVersion message: "${now.message}"` : '') + (snapNote ? `\n${snapNote}` : '') +
    `\n\nNext: open the project in Claude Code and run /ba-sync. Close this after the sync is committed.`,
});
