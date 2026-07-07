// A second post-processing rehype step, run after the engine's renderMarkdown, the same seam
// table-scroll.ts uses (see that file's own header for why a site adds behavior at the HTML-string
// boundary rather than inside the engine's closed pipeline).
//
// The `cta` directive (markdown/components.ts) renders Waymark's shape verbatim: a bare
// `<p class="cta">`, no surrounding chrome. Real ECXC content always leads into that button with a
// heading and a line or two of copy ("### Getting started", then a sentence, then the button), and
// the framed-neutral-CTA-cards pick frames that whole moment, heading, copy, and button, as one
// resting card, color reserved for the button alone. Doing this in CSS alone would mean fusing three
// separate boxes into one apparent frame with sibling combinators and negative margins, which cannot
// generalize to a heading followed by a variable number of paragraphs (ECXC's own pages use one or
// two); wrapping the run in a real element after render is the same trade table-scroll already made
// for a markdown table with no wrapper.
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { visit, SKIP } from 'unist-util-visit';
import type { Root, RootContent, Element, ElementContent, Text } from 'hast';

// h2 and h3 are the two prose.css gives a distinct heading treatment (chassis/prose.css has no h4
// rule at all); a CTA moment only ever leads in with one of those two in current content.
const HEADING_TAGS = new Set(['h2', 'h3']);

// Typed over RootContent, not the narrower ElementContent: a heading collected here is always a
// direct child of the parsed fragment's Root, whose own children type admits a Doctype no real
// fragment ever produces. Narrowing to Text or Element here is also what lets each accepted
// sibling flow into the new panel's ElementContent[] children with no unsafe cast.
function isWhitespaceText(node: RootContent): node is Text {
  return node.type === 'text' && node.value.trim() === '';
}

function isCta(node: RootContent): node is Element {
  if (node.type !== 'element' || node.tagName !== 'p') return false;
  const className = node.properties?.className;
  return Array.isArray(className) && className.includes('cta');
}

function isPlainParagraph(node: RootContent): node is Element {
  return node.type === 'element' && node.tagName === 'p';
}

/**
 * Group a heading with the plain paragraphs that lead straight into a `.cta` button. Starting
 *  just after the heading, only bare `<p>` siblings (and whitespace text between them) are
 *  collected; hitting anything else, another heading, a list, a different component, ends the
 *  page's own content. Only a run that reaches a `.cta` button, with nothing else standing between
 *  the heading and it, is a real CTA moment.
 */
export function rehypeCtaPanel() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined || !HEADING_TAGS.has(node.tagName)) return;

      const collected: ElementContent[] = [];
      let cursor = index + 1;
      let foundCta = false;
      while (cursor < parent.children.length) {
        const sibling = parent.children[cursor];
        if (isWhitespaceText(sibling)) {
          collected.push(sibling);
          cursor++;
          continue;
        }
        if (isCta(sibling)) {
          collected.push(sibling);
          cursor++;
          foundCta = true;
          break;
        }
        if (!isPlainParagraph(sibling)) break;
        collected.push(sibling);
        cursor++;
      }
      if (!foundCta) return;

      const panel: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['cta-panel'] },
        children: [node, ...collected],
      };
      parent.children.splice(index, cursor - index, panel);
      // Plain SKIP, not `[SKIP, index]`: the panel now sits at this same index, and re-stating the
      // unchanged index would send the traversal back into it, rediscover the heading inside, and
      // wrap it again. Plain SKIP advances past this index instead (table-scroll.ts's own device).
      return SKIP;
    });
  };
}

const processor = unified().use(rehypeParse, { fragment: true }).use(rehypeCtaPanel).use(rehypeStringify);

/**
 * Post-process rendered HTML so a heading and its lead-in copy that end in a `.cta` button are
 *  grouped into one `.cta-panel`, the frame ecxc-theme.css cards. Called from the site's
 *  `rendering.render` after `renderMarkdown` (and after `wrapScrollableTables`), so it applies to
 *  the public build, the feed, and the editor preview alike.
 */
export async function wrapCtaPanels(html: string): Promise<string> {
  const file = await processor.process(html);
  return String(file);
}
