import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

const DragHandlePluginKey = new PluginKey('drag-handle');

function findTopLevelPosFromCoords(view: EditorView, _clientX: number, clientY: number): { start: number; end: number } | null {
  const root = view.dom as HTMLElement;
  const rect = root.getBoundingClientRect();
  
  // NEW APPROACH: Find which top-level block we're over by checking DOM elements directly
  // This fixes the "gap" problem where hovering between blocks gave inconsistent results
  
  // Get all top-level DOM elements (direct children of .ProseMirror)
  const topLevelElements = Array.from(root.children) as HTMLElement[];
  
  // Find which block the mouse Y is closest to
  let closestBlock: { element: HTMLElement; distance: number; isAbove: boolean } | null = null;
  
  for (const el of topLevelElements) {
    // Skip if not a block element (e.g., skip widgets)
    if (!el.matches('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, hr, div.hr-block')) continue;
    
    const elRect = el.getBoundingClientRect();
    
    // Check if mouse is within this element's vertical bounds
    if (clientY >= elRect.top && clientY <= elRect.bottom) {
      // Mouse is directly over this element
      closestBlock = { element: el, distance: 0, isAbove: false };
      break;
    }
    
    // Check if mouse is above this element
    if (clientY < elRect.top) {
      const distance = elRect.top - clientY;
      if (!closestBlock || distance < closestBlock.distance) {
        closestBlock = { element: el, distance, isAbove: true };
      }
    }
    
    // Check if mouse is below this element  
    if (clientY > elRect.bottom) {
      const distance = clientY - elRect.bottom;
      if (!closestBlock || distance < closestBlock.distance) {
        closestBlock = { element: el, distance, isAbove: false };
      }
    }
  }
  
  if (!closestBlock) return null;
  
  // Find the ProseMirror position for this DOM element
  const domPos = view.posAtDOM(closestBlock.element, 0);
  if (domPos == null) return null;
  
  const $pos = view.state.doc.resolve(domPos);
  if ($pos.depth < 1) return null;
  
  // Get the top-level block bounds
  const start = $pos.before(1);
  const node = $pos.node(1);
  const end = start + node.nodeSize;
  
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
              const dragEvent = event as DragEvent;
              const bounds = findTopLevelPosFromCoords(view, dragEvent.clientX, dragEvent.clientY);
              const rootRect = (view.dom as HTMLElement).getBoundingClientRect();
              let y: number | null = null;
              if (!bounds) {
                const endCoords = view.coordsAtPos(view.state.doc.content.size);
                y = endCoords.bottom - rootRect.top;
              } else {
                // CRITICAL: Get the top-level DOM element directly
                // nodeDOM might return nested elements, so we traverse up to find the direct child of .ProseMirror
                let nodeEl = view.nodeDOM(bounds.start) as HTMLElement | null;
                if (nodeEl) {
                  // Traverse up to find the direct child of .ProseMirror
                  const prosemirror = view.dom as HTMLElement;
                  while (nodeEl && nodeEl.parentElement !== prosemirror) {
                    nodeEl = nodeEl.parentElement;
                  }
                }
                
                let rectTop: number;
                let rectBottom: number;
                if (nodeEl) {
                  const r = nodeEl.getBoundingClientRect();
                  rectTop = r.top;
                  rectBottom = r.bottom;
                } else {
                  // Fallback to coordinate calculation
                  const sc = view.coordsAtPos(bounds.start);
                  const ec = view.coordsAtPos(bounds.end);
                  rectTop = sc.top; rectBottom = ec.bottom;
                }
                const rectHeight = Math.max(1, rectBottom - rectTop);
                // Adaptive edge snap: use 1/4 of block height, min 6px, max 16px
                // This prevents overlap on small blocks while keeping good UX on large blocks
                const edgeSnapPx = Math.min(16, Math.max(6, rectHeight * 0.25));
                let dropBefore: boolean;
                if (dragEvent.clientY <= rectTop + edgeSnapPx) {
                  dropBefore = true;
                } else if (dragEvent.clientY >= rectBottom - edgeSnapPx) {
                  dropBefore = false;
                } else {
                  // In the middle zone, use 50% threshold
                  dropBefore = dragEvent.clientY < rectTop + rectHeight * 0.5;
                }
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
                bar.style.height = '3px';
                bar.style.background = '#3b82f6';
                bar.style.boxShadow = '0 1px 3px rgba(59,130,246,0.4)';
                bar.style.borderRadius = '2px';
                bar.style.pointerEvents = 'none';
                bar.style.display = 'none';
                bar.style.zIndex = '100';
                host.appendChild(bar);
              }
              if (y !== null && bar) {
                // Offset indicator by -1px so it's visually centered on the drop line
                bar.style.top = `${y - 1}px`;
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
                // CRITICAL: Get the top-level DOM element directly (same as dragover)
                // nodeDOM might return nested elements, so we traverse up to find the direct child of .ProseMirror
                let nodeEl = view.nodeDOM(bounds.start) as HTMLElement | null;
                if (nodeEl) {
                  // Traverse up to find the direct child of .ProseMirror
                  const prosemirror = view.dom as HTMLElement;
                  while (nodeEl && nodeEl.parentElement !== prosemirror) {
                    nodeEl = nodeEl.parentElement;
                  }
                }
                
                let rectTop: number;
                let rectBottom: number;
                if (nodeEl) {
                  const rect = nodeEl.getBoundingClientRect();
                  rectTop = rect.top;
                  rectBottom = rect.bottom;
                } else {
                  // Fallback to coordinate calculation
                  const startCoords = view.coordsAtPos(bounds.start);
                  const endCoords = view.coordsAtPos(bounds.end);
                  rectTop = startCoords.top;
                  rectBottom = endCoords.bottom;
                }
                const rectHeight = Math.max(1, rectBottom - rectTop);
                // Use same adaptive edge snap as dragover for consistency
                const edgeSnapPx = Math.min(16, Math.max(6, rectHeight * 0.25));
                let dropBefore: boolean;
                if (dragEvent.clientY <= rectTop + edgeSnapPx) {
                  dropBefore = true;
                } else if (dragEvent.clientY >= rectBottom - edgeSnapPx) {
                  dropBefore = false;
                } else {
                  // In the middle zone, use 50% threshold
                  dropBefore = dragEvent.clientY < rectTop + rectHeight * 0.5;
                }
                insertPos = dropBefore ? bounds.start : bounds.end;
              }

              // Build transaction to move dragged block by range
              // Check for no-op (trying to drop in the same position)
              if (insertPos >= from && insertPos <= to) {
                // Dropping within the same block - no operation needed
                return true;
              }
              
              const slice = view.state.doc.slice(from, to);
              let tr = view.state.tr.delete(from, to);
              
              // Adjust insert position if it was after the deleted content
              let adjustedInsertPos = insertPos;
              if (adjustedInsertPos > to) {
                // insertPos is after the deleted block, subtract the deleted size
                adjustedInsertPos -= (to - from);
              } else if (adjustedInsertPos > from) {
                // insertPos is between from and to (shouldn't happen due to no-op check above)
                adjustedInsertPos = from;
              }
              
              tr = tr.insert(adjustedInsertPos, slice.content);
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


