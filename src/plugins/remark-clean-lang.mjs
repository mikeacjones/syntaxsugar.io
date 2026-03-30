// Remark plugin that strips Gatsby-style line highlighting syntax
// from code block language identifiers (e.g., "data-weave{2,3}" -> "data-weave")
import { visit } from 'unist-util-visit';

export default function remarkCleanLang() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang) {
        // Strip {2,3} or {diff} or {4,7} suffixes
        node.lang = node.lang.replace(/\{[^}]*\}$/, '').trim();
      }
    });
  };
}
