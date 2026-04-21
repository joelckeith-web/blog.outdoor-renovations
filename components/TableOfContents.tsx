/**
 * TableOfContents — auto-extracts H2 headings from post markdown content
 * and renders them as an anchored list. Slug function matches github-slugger /
 * rehype-slug behavior for common English headings without special characters.
 */

interface Props {
  content: string;
}

/**
 * Slugify text to match rehype-slug / github-slugger output for common cases.
 * Lowercases, strips punctuation except hyphens, collapses whitespace to hyphens.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractH2s(markdown: string): { text: string; slug: string }[] {
  const headings: { text: string; slug: string }[] = [];
  const lines = markdown.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^##\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    // Strip inline markdown from heading text for display
    const text = match[1]
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .trim();

    headings.push({ text, slug: slugify(text) });
  }

  return headings;
}

export default function TableOfContents({ content }: Props) {
  const items = extractH2s(content);
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="my-8 rounded-lg border border-brand-accent/20 bg-brand-light p-6"
    >
      <h2 className="mb-3 text-lg font-bold text-brand-dark">In This Article</h2>
      <ol className="space-y-2 list-decimal list-inside marker:text-brand-accent marker:font-semibold">
        {items.map((item) => (
          <li key={item.slug} className="text-brand-text">
            <a
              href={`#${item.slug}`}
              className="text-brand-accent underline decoration-brand-accent/30 hover:decoration-brand-accent transition-colors"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
