import HorizontalRule from '@tiptap/extension-horizontal-rule';

export const HorizontalRuleBlock = HorizontalRule.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      hrThickness: {
        default: '1px',
        parseHTML: element => element.getAttribute('data-hr-thickness') || '1px',
        renderHTML: attributes => {
          if (!attributes.hrThickness) return {};
          return { 'data-hr-thickness': attributes.hrThickness };
        },
      },
      hrStyle: {
        default: 'solid',
        parseHTML: element => element.getAttribute('data-hr-style') || 'solid',
        renderHTML: attributes => {
          if (!attributes.hrStyle) return {};
          return { 'data-hr-style': attributes.hrStyle };
        },
      },
      hrColor: {
        default: '#e5e7eb',
        parseHTML: element => element.getAttribute('data-hr-color') || '#e5e7eb',
        renderHTML: attributes => {
          if (!attributes.hrColor) return {};
          return { 'data-hr-color': attributes.hrColor };
        },
      },
    };
  },

  addNodeView() {
    return ({ node, getPos }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'hr-block';
      wrapper.style.position = 'relative';
      wrapper.style.padding = '12px 0';
      wrapper.style.minHeight = '40px';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';

      // Create HR element first
      const hr = document.createElement('hr');
      hr.style.width = '100%';
      hr.style.margin = '0';
      hr.style.border = '0';

      // Apply block attributes from node
      const applyAttributes = () => {
        const attrs = node.attrs;
        if (attrs.blockTopMargin) {
          wrapper.style.marginTop = attrs.blockTopMargin;
        }
        if (attrs.blockBottomMargin) {
          wrapper.style.marginBottom = attrs.blockBottomMargin;
        }
        if (attrs.blockTopPadding && attrs.blockTopPadding !== '0') {
          wrapper.style.paddingTop = attrs.blockTopPadding;
        }
        if (attrs.blockBottomPadding && attrs.blockBottomPadding !== '0') {
          wrapper.style.paddingBottom = attrs.blockBottomPadding;
        }
        if (attrs.blockBackground) {
          wrapper.style.backgroundColor = attrs.blockBackground;
        }
        
        // Apply HR-specific attributes
        const thickness = attrs.hrThickness || '1px';
        const style = attrs.hrStyle || 'solid';
        const color = attrs.hrColor || '#e5e7eb';
        
        hr.style.borderTop = style === 'none' ? 'none' : `${thickness} ${style} ${color}`;
      };
      applyAttributes();

      const handle = document.createElement('button');
      handle.type = 'button';
      handle.className = 'tiptap-drag-handle tiptap-kebab';
      handle.setAttribute('data-pos', String(getPos()));
      handle.title = 'Drag to reorder';
      handle.draggable = true;
      handle.style.width = '18px';
      handle.style.height = '24px';
      handle.style.border = '1px solid #e5e7eb';
      handle.style.borderRadius = '6px';
      handle.style.background = '#fff';
      handle.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      handle.style.position = 'absolute';
      handle.style.left = '-32px';
      handle.style.top = '50%';
      handle.style.transform = 'translateY(-50%)';
      handle.style.cursor = 'grab';
      handle.style.display = 'flex';
      handle.style.alignItems = 'center';
      handle.style.justifyContent = 'center';
      handle.style.fontSize = '14px';
      handle.style.color = '#6b7280';
      handle.style.opacity = '0';
      handle.style.transition = 'opacity 120ms ease';
      handle.textContent = '⋮';

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

      wrapper.appendChild(handle);
      wrapper.appendChild(hr);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'horizontalRule') return false;
          // Re-apply attributes when node updates
          const attrs = updatedNode.attrs;
          wrapper.style.marginTop = attrs.blockTopMargin || '';
          wrapper.style.marginBottom = attrs.blockBottomMargin || '';
          wrapper.style.paddingTop = (attrs.blockTopPadding && attrs.blockTopPadding !== '0') ? attrs.blockTopPadding : '12px';
          wrapper.style.paddingBottom = (attrs.blockBottomPadding && attrs.blockBottomPadding !== '0') ? attrs.blockBottomPadding : '12px';
          wrapper.style.backgroundColor = attrs.blockBackground || '';
          
          // Update HR-specific attributes
          const thickness = attrs.hrThickness || '1px';
          const style = attrs.hrStyle || 'solid';
          const color = attrs.hrColor || '#e5e7eb';
          hr.style.borderTop = style === 'none' ? 'none' : `${thickness} ${style} ${color}`;
          
          return true;
        },
        ignoreMutation: () => true,
      };
    };
  },
});


