/**
 * MyST-MD JavaScript plugin: image-zoom AST helpers.
 *
 * book-theme escapes raw HTML AST nodes (renders them as text in a <span>),
 * so plugins CANNOT execute JavaScript in the rendered page. The visual
 * zoom effect is therefore done purely with CSS in custom.css, loaded via
 * `site.options.style` in myst.yml.
 *
 * This plugin only tags `image` mdast nodes so the CSS can target them.
 * Notebook output images (matplotlib etc.) are rendered by the theme's
 * `outputs` component and are matched in CSS via their
 * `[data-name="safe-output-image"]` container.
 */
function classList(node) {
  return (node.class || '').split(/\s+/).filter(Boolean);
}
function addClass(node, cls) {
  const list = classList(node);
  if (!list.includes(cls)) list.push(cls);
  node.class = list.join(' ');
}
function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'image' && !classList(node).includes('no-zoom')) {
    addClass(node, 'zoomable-image');
  }
  if (Array.isArray(node.children)) node.children.forEach(walk);
}
const imageZoomTransform = {
  name: 'image-zoom',
  doc: 'Tag image nodes with `zoomable-image` so custom.css can style them.',
  stage: 'document',
  plugin: (_opts, _utils) => (tree) => walk(tree),
};
const plugin = {
  name: 'Image Zoom',
  author: 'meditatio',
  license: 'MIT',
  transforms: [imageZoomTransform],
};
export default plugin;
