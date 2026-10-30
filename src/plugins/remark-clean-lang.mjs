// Remark plugin that moves Gatsby-style line highlighting out of the code
// block language (e.g., "data-weave{2,3}" -> lang "data-weave", meta "{2,3}")
// so Shiki's meta highlight transformer can mark those lines.
import { visit } from 'unist-util-visit';

export default function remarkCleanLang() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (!node.lang) return;
      const match = node.lang.match(/\{[^}]*\}$/);
      if (!match) return;
      node.lang = node.lang.slice(0, match.index).trim();
      node.meta = [match[0], node.meta].filter(Boolean).join(' ');
    });
  };
}
