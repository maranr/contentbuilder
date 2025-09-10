import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

const DragHandlePluginKey = new PluginKey('drag-handle');

function findTopLevelPosFromCoords(view: EditorView, _clientX: number, clientY: number): { start: number; end: number } | null {
  const root = view.dom as HTMLElement;
  const rect = root.getBoundingClientRect();
  // Sample X at the center of the editor so dropping works across the entire width
  const sampleX = rect.left + rect.width / 2;
  // Clamp Y inside the editor bounds to always get a position
  const clampedY = Math.max(rect.top + 1, Math.min(clientY, rect.bottom - 1));
  const pos = view.posAtCoords({ left: sampleX, top: clampedY });
  if (!pos) return null;
  const $pos = view.state.doc.resolve(pos.pos);
  if ($pos.depth < 1) return null;
  const start = $pos.before(1);
  const end = start + $pos.node(1).nodeSize;
  return { start, end };
}

export const DragHandle = Extension.create({
  name: 'drag-handle',
  addProseMirrorPlugins() {
    return [
      new Plugin<{ decorations: DecorationSet | null }>({
        key: DragHandlePluginKey,
        // local plugin instance state for UI elements
        view: (view) => {
          let indicatorEl: HTMLDivElement | null = null;
          const ensureIndicator = () => {
            if (!indicatorEl) {
              indicatorEl = document.createElement('div');
              indicatorEl.className = 'tiptap-drop-indicator';
              indicatorEl.style.position = 'absolute';
              indicatorEl.style.left = '0';
              indicatorEl.style.right = '0';
              indicatorEl.style.height = '2px';
              indicatorEl.style.background = '#3b82f6';
              indicatorEl.style.boxShadow = '0 0 0 1px rgba(59,130,246,0.15)';
              indicatorEl.style.pointerEvents = 'none';
              indicatorEl.style.display = 'none';
              (view.dom as HTMLElement).appendChild(indicatorEl);
            }
            return indicatorEl;
          };
          const hideIndicator = () => {
            if (indicatorEl) indicatorEl.style.display = 'none';
          };
          return {
            update: () => {/* no-op */},
            destroy: () => { if (indicatorEl && indicatorEl.parentNode) indicatorEl.parentNode.removeChild(indicatorEl); indicatorEl = null; },
          };
        },
        state: {
          init: (_, { doc }) => {
            return { decorations: createDecorations(doc) };
          },
          apply: (tr, prev) => {
            if (!tr.docChanged) return prev;
            return { decorations: createDecorations(tr.doc) };
          },
        },
        props: {
          decorations: (state) => DragHandlePluginKey.getState(state)?.decorations || null,
          handleDOMEvents: {
            // Keep drag range in memory for browsers that strip custom types (e.g., Edge)
            // We capture it on dragstart and reuse on drop if DataTransfer lacks our custom payload.
            // Using a closure variable inside props keeps it plugin-instance scoped.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(function(){ let currentDragRange: { from: number; to: number } | null = null; return {
            mousedown: (view, event) => {
              const target = event.target as HTMLElement;
              if (!target || !target.classList.contains('tiptap-drag-handle')) return false;
              const attr = target.getAttribute('data-pos');
              if (!attr) return false;
              // Mark press so bubble menu won't appear before dragstart
              (view.dom as HTMLElement).setAttribute('data-handle-press', 'true');
              setTimeout(() => (view.dom as HTMLElement).removeAttribute('data-handle-press'), 200);
              // Stop propagation so the editor doesn't interpret this as content click
              event.stopPropagation();
              return true;
            },
            dragstart: (view, event) => {
              const target = event.target as HTMLElement;
              if (!target || !target.classList.contains('tiptap-drag-handle')) return false;
              const attr = target.getAttribute('data-pos');
              if (!attr) return false;
              const pos = Number(attr);
              // Encode dragged block range in dataTransfer
              const node = view.state.doc.nodeAt(pos);
              if (!node) return false;
              const from = pos;
              const to = pos + node.nodeSize;
              currentDragRange = { from, to };
              // Ensure the browser starts a drag (some require data and an image)
              const dt = (event as DragEvent).dataTransfer;
              if (dt) {
                dt.setData('text/plain', 'drag');
                dt.setData('application/x-prosemirror-range', `${from}:${to}`);
                const img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                dt.setDragImage(img, 0, 0);
              }
              // Mark dragging to hide contextual menus during drag
              (view.dom as HTMLElement).setAttribute('data-dragging', 'true');
              // We've handled the dragstart; prevent ProseMirror's default drag behavior
              return true;
            },
            dragover: (view, event) => {
              if (!event) return false;
              event.preventDefault();
              if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
              // Show indicator at computed insertion line
              // compute bounds and y
              const dragEvent = event as DragEvent;
              const bounds = findTopLevelPosFromCoords(view, dragEvent.clientX, dragEvent.clientY);
              const rootRect = (view.dom as HTMLElement).getBoundingClientRect();
              let y: number | null = null;
              if (!bounds) {
                const endCoords = view.coordsAtPos(view.state.doc.content.size);
                y = endCoords.bottom - rootRect.top;
              } else {
                const nodeEl = (view.nodeDOM(bounds.start) as HTMLElement) || null;
                let rectTop: number;
                let rectBottom: number;
                if (nodeEl) {
                  const r = nodeEl.getBoundingClientRect();
                  rectTop = r.top;
                  rectBottom = r.bottom;
                } else {
                  const sc = view.coordsAtPos(bounds.start);
                  const ec = view.coordsAtPos(bounds.end);
                  rectTop = sc.top; rectBottom = ec.bottom;
                }
                const rectHeight = Math.max(1, rectBottom - rectTop);
                const edgeSnapPx = 12;
                let dropBefore: boolean;
                if (dragEvent.clientY <= rectTop + edgeSnapPx) dropBefore = true;
                else if (dragEvent.clientY >= rectBottom - edgeSnapPx) dropBefore = false;
                else dropBefore = dragEvent.clientY < rectTop + rectHeight * 0.5;
                y = (dropBefore ? rectTop : rectBottom) - rootRect.top;
              }
              const host = view.dom as HTMLElement;
              let bar = host.querySelector('.tiptap-drop-indicator') as HTMLDivElement | null;
              if (!bar) {
                bar = document.createElement('div');
                bar.className = 'tiptap-drop-indicator';
                bar.style.position = 'absolute';
                bar.style.left = '0';
                bar.style.right = '0';
                bar.style.height = '2px';
                bar.style.background = '#3b82f6';
                bar.style.boxShadow = '0 0 0 1px rgba(59,130,246,0.15)';
                bar.style.pointerEvents = 'none';
                bar.style.display = 'none';
                host.appendChild(bar);
              }
              if (y !== null && bar) {
                bar.style.top = `${y}px`;
                bar.style.display = 'block';
              }
              return true;
            },
            drop: (view, event) => {
              if (!event) return false;
              event.preventDefault();
              const host = view.dom as HTMLElement;
              const bar = host.querySelector('.tiptap-drop-indicator') as HTMLDivElement | null;
              if (bar) bar.style.display = 'none';
              host.removeAttribute('data-dragging');
              // Use encoded range from dragstart
              const dt = (event as DragEvent).dataTransfer;
              const encoded = dt?.getData('application/x-prosemirror-range');
              let from: number; let to: number;
              if (encoded && encoded.includes(':')) {
                const [fromStr, toStr] = encoded.split(':');
                from = Number(fromStr);
                to = Number(toStr);
              } else if (currentDragRange) {
                from = currentDragRange.from;
                to = currentDragRange.to;
              } else {
                return false;
              }
              if (Number.isNaN(from) || Number.isNaN(to) || from >= to) return false;
              const dragEvent = event as DragEvent;
              const bounds = findTopLevelPosFromCoords(view, dragEvent.clientX, dragEvent.clientY);
              let insertPos: number;
              if (!bounds) {
                // Could not determine a valid target (e.g., pointer outside editor). Cancel move.
                return true;
              } else {
                // Prefer the DOM node's actual element if available (improves HR accuracy)
                const nodeEl = view.nodeDOM(bounds.start) as HTMLElement | null;
                let rectTop: number;
                let rectBottom: number;
                if (nodeEl) {
                  const rect = nodeEl.getBoundingClientRect();
                  rectTop = rect.top;
                  rectBottom = rect.bottom;
                } else {
                  const startCoords = view.coordsAtPos(bounds.start);
                  const endCoords = view.coordsAtPos(bounds.end);
                  rectTop = startCoords.top;
                  rectBottom = endCoords.bottom;
                }
                const rectHeight = Math.max(1, rectBottom - rectTop);
                // Edge snapping makes dropping above/below more reliable
                const edgeSnapPx = 12; // snap if pointer is within 12px of top/bottom edge
                let dropBefore: boolean;
                if (dragEvent.clientY <= rectTop + edgeSnapPx) {
                  dropBefore = true;
                } else if (dragEvent.clientY >= rectBottom - edgeSnapPx) {
                  dropBefore = false;
                } else {
                  // Balanced threshold in the middle when not near edges
                  const threshold = rectTop + rectHeight * 0.5;
                  dropBefore = dragEvent.clientY < threshold;
                }
                insertPos = dropBefore ? bounds.start : bounds.end;
              }

              // Build transaction to move dragged block by range
              const slice = view.state.doc.slice(from, to);
              let tr = view.state.tr.delete(from, to);
              // Adjust insert position if it was after the deleted content
              if (insertPos > from) insertPos -= (to - from);
              if (insertPos === from) insertPos = to; // no-op guard
              tr = tr.insert(insertPos, slice.content);
              view.dispatch(tr.scrollIntoView());
              currentDragRange = null;
              return true;
            },
            dragleave: (view) => {
              const host = view.dom as HTMLElement;
              const bar = host.querySelector('.tiptap-drop-indicator') as HTMLDivElement | null;
              if (bar) bar.style.display = 'none';
              host.removeAttribute('data-dragging');
              return false;
            },
            dragend: (view) => {
              (view.dom as HTMLElement).removeAttribute('data-dragging');
              return false;
            }, }; })(),
          },
        },
      }),
    ];
  },
});

// helper to create widget decorations for every top-level block
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDecorations(doc: any): DecorationSet {
  const decorations: Decoration[] = [];
  // Iterate top-level children only
  // parent === doc implies depth === 1
  doc.descendants((node: any, pos: number, parent: any) => {
    if (parent !== doc) return false;
    if (!node.isBlock) return false;
    if (node.type && node.type.name === 'horizontalRule') return false;
    const deco = Decoration.widget(pos + 1, () => {
      const kebab = document.createElement('button');
      kebab.type = 'button';
      kebab.className = 'tiptap-drag-handle tiptap-kebab';
      kebab.setAttribute('data-pos', String(pos));
      kebab.title = 'Drag to reorder / Click for menu';
      kebab.draggable = true;
      kebab.style.width = '18px';
      kebab.style.height = '24px';
      kebab.style.border = '1px solid #e5e7eb';
      kebab.style.borderRadius = '6px';
      kebab.style.background = '#fff';
      kebab.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      kebab.style.position = 'absolute';
      kebab.style.left = '-32px';
      kebab.style.top = '4px';
      kebab.style.cursor = 'grab';
      kebab.style.display = 'flex';
      kebab.style.alignItems = 'center';
      kebab.style.justifyContent = 'center';
      kebab.style.fontSize = '14px';
      kebab.style.color = '#6b7280';
      kebab.style.opacity = '0';
      kebab.style.transition = 'opacity 120ms ease';
      kebab.textContent = '⋮';
      return kebab;
    }, { side: -1 });
    decorations.push(deco);
    return false;
  });
  return DecorationSet.create(doc, decorations);
}


