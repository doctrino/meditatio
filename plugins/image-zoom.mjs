/**
 * MyST-MD JavaScript plugin: image-zoom AST helpers.
 *
 * Note: book-theme does NOT allow injecting <script> tags via raw HTML nodes
 * (React's dangerouslySetInnerHTML never executes <script>). So the actual
 * "click to zoom" visual is done via CSS, loaded through
 * `site.options.style` (see custom.css in the project root).
 *
 * What this plugin does:
 *   1. Adds the class `zoomable-image` to every `image` AST node.
 *   2. Wraps user-authored `image` nodes in a `link` to the image's own URL
 *      so clicking opens the full-resolution image in a new tab. (Notebook
 *      output images are rendered by the theme's `outputs` component, not
 *      from an `image` mdast node, so they cannot be wrapped this way; the
 *      CSS still gives them hover/click zoom.)
 *   3. Skips images already inside a link, or opted-out via class `no-zoom`.
 *
 * Docs: https://mystmd.org/guide/javascript-plugins
 */
function classList(node) {
  return (node.class || '').split(/\s+/).filter(Boolean);
}
function addClass(node, cls) {
  const list = classList(node);
  if (!list.includes(cls)) list.push(cls);
  node.class = list.join(' ');
}
function transform(parent) {
  if (!parent || !Array.isArray(parent.children)) return;
  const newChildren = [];
  for (const child of parent.children) {
    if (
      child &&
      child.type === 'image' &&
      parent.type !== 'link' &&
      !classList(child).includes('no-zoom')
    ) {
      addClass(child, 'zoomable-image');
      if (child.url) {
        newChildren.push({
          type: 'link',
          url: child.url,
          class: 'image-zoom-link',
          children: [child],
        });
        continue;
      }
    }
    transform(child);
    newChildren.push(child);
  }
  parent.children = newChildren;
}
const imageZoomTransform = {
  name: 'image-zoom',
  doc: 'Tag image nodes with `zoomable-image` and wrap them in an "open original" link.',
  stage: 'document',
  plugin: (_opts, _utils) => (tree) => transform(tree),
};
const plugin = {
  name: 'Image Zoom',
  author: 'meditatio',
  license: 'MIT',
  transforms: [imageZoomTransform],
};
export default plugin;
