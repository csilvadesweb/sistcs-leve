// @ts-nocheck -- static regression guard for the editor's off-screen open behavior.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/pages/Food.tsx'), 'utf8');

describe('food diary editor visibility', () => {
  it('anchors the editor and scrolls it into view when opening or changing the edited entry', () => {
    expect(source).toMatch(/const foodEditorRef = useRef<HTMLFormElement>\(null\)/);
    expect(source).toMatch(/foodEditorRef\.current\?\.scrollIntoView\?\.\(\{ behavior: 'smooth', block: 'start' \}\)/);
    expect(source).toMatch(/\[foodEditorOpen, editingFood\]/);
    expect(source).toMatch(/<form ref=\{foodEditorRef\} className="ft-editor"/);
  });
});
