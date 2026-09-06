import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('remote import boundaries', () => {
  it('People does not import Delivery app or package paths', () => {
    const peopleRoot = join(process.cwd(), 'apps/people/src');
    const files = [
      'App.tsx',
      'hooks/usePeopleData.ts',
      'bootstrapPeople.ts',
      'components/RateHistory.tsx',
    ];
    for (const file of files) {
      const source = readFileSync(join(peopleRoot, file), 'utf8');
      expect(source).not.toMatch(/from ['"]@bps\/delivery/);
      expect(source).not.toMatch(/from ['"].*apps\/delivery/);
      expect(source).not.toMatch(/import\(['"]delivery\//);
    }
  });
});
