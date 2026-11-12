import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ARCHITECTURAL RULE TEST:
 * Asserts that any modal or sheet containing user text input (form/entry) MUST use
 * the standardized FormSheet component to guarantee keyboard avoidance, safe-area padding,
 * and reachable action buttons across Android and iOS.
 */
describe('FormSheet Architecture Enforcement', () => {
  const srcDir = path.resolve(__dirname, '../src');

  function getFiles(dir: string, extension: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(fullPath, extension));
      } else if (fullPath.endsWith(extension)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it('fails if any modal or sheet containing a text input does not use FormSheet', () => {
    const tsxFiles = getFiles(srcDir, '.tsx');
    const violations: { file: string; reason: string }[] = [];

    for (const filePath of tsxFiles) {
      const relativePath = path.relative(srcDir, filePath);

      // Skip the FormSheet component definition itself and the TimeZonePickerModal (which uses custom search + flatlist)
      if (relativePath.includes('FormSheet.tsx') || relativePath.includes('TimeZonePickerModal.tsx')) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      // Check whether a Modal or Sheet actually wraps or contains a TextInput / Input element.
      // (Files that merely render an unrelated preview Modal alongside an inline feed input are valid).
      const modalBlocks = content.match(/<(?:Modal|Sheet)[\s\S]*?<\/(?:Modal|Sheet)>/g) || [];
      const modalContainsInput = modalBlocks.some((block) =>
        block.includes('<TextInput') || block.includes('<Input')
      );

      // If a component renders a Modal or Sheet that contains an input form, it MUST use FormSheet
      if (modalContainsInput) {
        if (!content.includes('FormSheet')) {
          violations.push({
            file: relativePath,
            reason: 'Renders Modal or Sheet with text input but does not use FormSheet container',
          });
        }
      }
    }

    expect(
      violations,
      `Found modal/sheet forms not using FormSheet:\n${violations.map((v) => ` - ${v.file}: ${v.reason}`).join('\n')}`
    ).toEqual([]);
  });

  it('verifies FormSheet is exported from shared UI index', () => {
    const indexPath = path.resolve(srcDir, 'shared/ui/index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    expect(indexContent).toContain("export * from './FormSheet';");
  });
});
