import HorizontalRule from '@tiptap/extension-horizontal-rule';

export const HorizontalRuleBlock = HorizontalRule.extend({
  addNodeView() {
    return ({ getPos }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'hr-block';
      wrapper.style.position = 'relative';
      wrapper.style.padding = '8px 0';
      wrapper.style.minHeight = '20px';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';

      const handle = document.createElement('div');
      handle.className = 'tiptap-drag-handle';
      handle.setAttribute('data-pos', String(getPos()));
      handle.title = 'Drag to reorder';
      handle.draggable = true;
      handle.style.width = '14px';
      handle.style.height = '14px';
      handle.style.border = '1px solid #e5e7eb';
      handle.style.borderRadius = '4px';
      handle.style.background = '#fff';
      handle.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      handle.style.position = 'absolute';
      handle.style.left = '-28px';
      handle.style.top = '50%';
      handle.style.transform = 'translateY(-50%)';
      handle.style.cursor = 'grab';
      handle.style.display = 'flex';
      handle.style.alignItems = 'center';
      handle.style.justifyContent = 'center';
      handle.style.fontSize = '10px';
      handle.style.color = '#9ca3af';
      handle.textContent = '≡';

      // Keep position updated when hovering before drag
      handle.addEventListener('mouseenter', () => {
        try {
          handle.setAttribute('data-pos', String(getPos()));
        } catch {}
      });

      // Improve cross-browser drag start reliability
      handle.addEventListener('dragstart', (e) => {
        try { handle.setAttribute('data-pos', String(getPos())); } catch {}
        const dt = (e as DragEvent).dataTransfer;
        if (dt) {
          // Some browsers require data to initiate a drag
          dt.setData('text/plain', 'drag');
          // Use a transparent drag image so the line isn't obscured
          const img = new Image();
          img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          dt.setDragImage(img, 0, 0);
        }
      });

      const hr = document.createElement('hr');
      hr.style.width = '100%';
      hr.style.margin = '0';
      hr.style.border = '0';
      hr.style.borderTop = '1px solid #e5e7eb';

      wrapper.appendChild(handle);
      wrapper.appendChild(hr);

      return {
        dom: wrapper,
        ignoreMutation: () => true,
      };
    };
  },
});


