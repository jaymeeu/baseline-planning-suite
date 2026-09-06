import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** TypeScript `any` usages (not the English word in prose). */
const ANY_TYPE_PATTERN =
  /\bas\s+any\b|:\s*any\b|<\s*any\s*>|Promise\s*<\s*any\s*>/;

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      collectSourceFiles(full, out);
      continue;
    }
    if (entry.endsWith('.d.ts')) continue;
    if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

describe('no TypeScript any', () => {
  it('apps and packages src avoid any types', () => {
    const roots = [
      join(process.cwd(), 'apps'),
      join(process.cwd(), 'packages'),
    ];
    const offenders: string[] = [];

    for (const root of roots) {
      for (const appOrPkg of readdirSync(root)) {
        const src = join(root, appOrPkg, 'src');
        for (const file of collectSourceFiles(src)) {
          const source = readFileSync(file, 'utf8');
          if (ANY_TYPE_PATTERN.test(source)) {
            offenders.push(file.replace(process.cwd() + '/', ''));
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
