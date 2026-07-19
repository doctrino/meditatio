/**
 * MyST-MD JavaScript plugin: click-to-zoom lightbox for figures & images.
 *
 * What it does:
 *   1. Walks the MDAST/MyST AST and tags every `image` node with the CSS class
 *      `zoomable-image` so the theme renders `<img class="... zoomable-image">`.
 *   2. Appends a single raw-HTML block per page that contains the CSS and a
 *      tiny vanilla-JS click handler which opens the clicked image in a
 *      full-screen modal (dismiss with click or Escape).
 *
 * Docs: https://mystmd.org/guide/javascript-plugins
 */

const ZOOM_ASSETS = `
<style>
  .zoomable-image, figure img, .figure img { cursor: zoom-in; }
  .myst-zoom-modal {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.88);
    display: flex; align-items: center; justify-content: center;
    z-index: 99999; cursor: zoom-out;
    opacity: 0; transition: opacity 0.18s ease-out;
  }
  .myst-zoom-modal.active { opacity: 1; }
  .myst-zoom-modal img {
    max-width: 95vw; max-height: 95vh;
    object-fit: contain;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    background: white;
  }
  .myst-zoom-modal-close {
    position: absolute; top: 16px; right: 24px;
    color: white; font-size: 40px; line-height: 1;
    background: none; border: none; cursor: pointer;
  }
  body.myst-zoom-open { overflow: hidden; }
</style>
<script>
(function () {
  if (window.__mystImageZoomInit) return;
  window.__mystImageZoomInit = true;

  function isZoomable(img) {
    if (!img || img.tagName !== 'IMG') return false;
    if (img.closest('.myst-zoom-modal')) return false;
    if (img.closest('a')) return false; // don't hijack linked images
    if (img.classList.contains('no-zoom')) return false;
    return (
      img.classList.contains('zoomable-image') ||
      !!img.closest('figure, .figure')
    );
  }

  function openModal(src, alt) {
    var modal = document.createElement('div');
    modal.className = 'myst-zoom-modal';

    var big = document.createElement('img');
    big.src = src;
    big.alt = alt || '';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'myst-zoom-modal-close';
    close.setAttribute('aria-label', 'Close image');
    close.innerHTML = '&times;';

    modal.appendChild(big);
    modal.appendChild(close);
    document.body.appendChild(modal);
    document.body.classList.add('myst-zoom-open');
    requestAnimationFrame(function () { modal.classList.add('active'); });

    function dismiss() {
      modal.classList.remove('active');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () {
        modal.remove();
        document.body.classList.remove('myst-zoom-open');
      }, 180);
    }
    function onKey(ev) { if (ev.key === 'Escape') dismiss(); }

    modal.addEventListener('click', dismiss);
    document.addEventListener('keydown', onKey);
  }

  document.addEventListener('click', function (e) {
    var img = e.target && e.target.closest && e.target.closest('img');
    if (!isZoomable(img)) return;
    e.preventDefault();
    openModal(img.currentSrc || img.src, img.alt);
  });
})();
</script>
`;

function walk(node, visitor) {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) walk(child, visitor);
  }
}

const imageZoomTransform = {
  name: 'image-zoom',
  doc: 'Tags image nodes as zoomable and injects a lightbox script.',
  stage: 'document',
  plugin: (_opts, _utils) => (tree) => {
    let hasImage = false;
    walk(tree, (node) => {
      if (node.type === 'image') {
        hasImage = true;
        const existing = node.class || '';
        if (!existing.split(/\s+/).includes('zoomable-image')) {
          node.class = (existing ? existing + ' ' : '') + 'zoomable-image';
        }
      }
    });

    if (hasImage && Array.isArray(tree.children)) {
      tree.children.push({ type: 'html', value: ZOOM_ASSETS });
    }
  },
};

const plugin = {
  name: 'Image Zoom',
  author: 'meditatio',
  license: 'MIT',
  transforms: [imageZoomTransform],
};

export default plugin;

