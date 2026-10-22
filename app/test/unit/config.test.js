import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// config.md: no literal of the config table appears outside config.js.
const DIR = fileURLToPath(new URL('../../public/js/', import.meta.url));
const LITERALS = [
  /deskshare-kit:v1/, /UTC\+5/, /['"`]10:00['"`]/, /['"`]09:30['"`]/, /['"`]23:59['"`]/,
  /reset-demo/, /localhost/, /127\.0\.0\.1/, /\b300\b/, /['"`]F[12]['"`]/,
];

describe('config literals live only in config.js', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== 'config.js');
  for (const f of files) {
    it(f, () => {
      const src = readFileSync(join(DIR, f), 'utf8');
      for (const re of LITERALS) expect(src, `${f} contains ${re}`).not.toMatch(re);
    });
  }
});
