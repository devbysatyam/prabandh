import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Codebase Hygiene & Brand Integrity', () => {
  it('strictly contains zero occurrences of legacy names in src, docs and api', () => {
    const rootDir = path.resolve(__dirname, '../../');
    const targetDirs = ['src', 'docs', 'api'];
    const forbiddenPatterns = [
      new RegExp(['a', 'a', 'y', 'o', 'j', 'a', 'n'].join(''), 'i'),
      new RegExp(['a', 'y', 'o', 'j', 'a', 'n'].join(''), 'i'),
    ];

    for (const dir of targetDirs) {
      const fullPath = path.join(rootDir, dir);
      if (!fs.existsSync(fullPath)) continue;

      function scan(currentPath: string) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            scan(entryPath);
          } else if (entry.isFile() && /\.(ts|tsx|md|json|html)$/.test(entry.name)) {
            const content = fs.readFileSync(entryPath, 'utf8');
            for (const pattern of forbiddenPatterns) {
              const match = pattern.exec(content);
              expect(
                match,
                `Forbidden legacy term "${match?.[0]}" found in ${entryPath}`,
              ).toBeNull();
            }
          }
        }
      }

      scan(fullPath);
    }
  });

  it('verifies that Prabandh branding is present in core documents', () => {
    const readmePath = path.resolve(__dirname, '../../README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('Prabandh');
    expect(content).toContain('प्रबंध');
  });
});
