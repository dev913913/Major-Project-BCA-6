import { describe, expect, it } from 'vitest';
import { badgeClass, mapCodeSnippetsToTextarea, mapTextareaToCodeSnippets } from './lessonFormUtils';

describe('mapCodeSnippetsToTextarea', () => {
  it('returns an empty string for non-array input', () => {
    expect(mapCodeSnippetsToTextarea(undefined)).toBe('');
    expect(mapCodeSnippetsToTextarea(null)).toBe('');
    expect(mapCodeSnippetsToTextarea('not an array')).toBe('');
  });

  it('returns an empty string for an empty array', () => {
    expect(mapCodeSnippetsToTextarea([])).toBe('');
  });

  it('joins plain string snippets with the --- delimiter', () => {
    expect(mapCodeSnippetsToTextarea(['const a = 1;', 'const b = 2;'])).toBe(
      'const a = 1;\n\n---\n\nconst b = 2;'
    );
  });

  it('extracts code from snippet objects using the code field', () => {
    expect(mapCodeSnippetsToTextarea([{ code: 'console.log(1);' }])).toBe('console.log(1);');
  });

  it('falls back to the content field when code is missing', () => {
    expect(mapCodeSnippetsToTextarea([{ content: 'console.log(2);' }])).toBe('console.log(2);');
  });

  it('filters out empty or falsy snippets', () => {
    expect(mapCodeSnippetsToTextarea(['', null, 'valid snippet', {}])).toBe('valid snippet');
  });
});

describe('mapTextareaToCodeSnippets', () => {
  it('returns an empty array for blank input', () => {
    expect(mapTextareaToCodeSnippets('')).toEqual([]);
    expect(mapTextareaToCodeSnippets('   \n  ')).toEqual([]);
  });

  it('returns a single snippet when there is no delimiter', () => {
    expect(mapTextareaToCodeSnippets('console.log("hi");')).toEqual(['console.log("hi");']);
  });

  it('splits multiple snippets on the --- delimiter line', () => {
    const input = 'const a = 1;\n\n---\n\nconst b = 2;';
    expect(mapTextareaToCodeSnippets(input)).toEqual(['const a = 1;', 'const b = 2;']);
  });

  it('trims leading and trailing whitespace from each snippet', () => {
    const input = '  const a = 1;  \n\n---\n\nconst b = 2;  ';
    expect(mapTextareaToCodeSnippets(input)).toEqual(['const a = 1;', 'const b = 2;']);
  });
});

describe('badgeClass', () => {
  it('returns the emerald classes for published status', () => {
    expect(badgeClass('published')).toContain('emerald');
  });

  it('returns the slate classes for archived status', () => {
    expect(badgeClass('archived')).toContain('slate');
  });

  it('returns the amber classes for draft or unknown status', () => {
    expect(badgeClass('draft')).toContain('amber');
    expect(badgeClass('something-else')).toContain('amber');
  });
});