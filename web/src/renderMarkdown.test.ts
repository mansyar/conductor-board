import { describe, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';

// A DOM must exist before renderMarkdown loads so DOMPurify can bind to it.
const dom = new JSDOM('');
globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document as Document;

const { renderMarkdown } = await import('./renderMarkdown');

describe('renderMarkdown', () => {
  test('renders markdown to HTML', () => {
    const html = renderMarkdown('# Heading\n\nSome **bold** and *em* text.');
    expect(html).toContain('<h1');
    expect(html).toContain('Heading');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>em</em>');
  });

  test('renders links', () => {
    const html = renderMarkdown('[spec](./spec.md)');
    expect(html).toContain('<a href="./spec.md">spec</a>');
  });

  test('sanitizes embedded scripts', () => {
    const html = renderMarkdown('before\n<script>alert("xss")</script>\nafter');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert');
    expect(html).toContain('before');
    expect(html).toContain('after');
  });

  test('syntax-highlights fenced code blocks', () => {
    const html = renderMarkdown('```ts\nconst x: number = 1;\n```');
    expect(html).toContain('<code');
    expect(html).toContain('hljs');
    expect(html).not.toContain('```');
  });

  test('passes through plain text', () => {
    const html = renderMarkdown('plain line one\nplain line two');
    expect(html).toContain('plain line one');
    expect(html).toContain('plain line two');
  });
});
