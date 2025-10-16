import { Extension } from '@tiptap/core';

// Adds per-block attributes for spacing and background to common block nodes.
// Attributes:
// - blockTopMargin: CSS length string (e.g., "0", "8px", "1rem") - spacing above block (between blocks)
// - blockBottomMargin: CSS length string - spacing below block (between blocks)
// - blockTopPadding: CSS length string - internal padding at top edge of block
// - blockBottomPadding: CSS length string - internal padding at bottom edge of block
// - blockBackground: CSS color string (e.g., "#ffffff", "rgba(...)" or named colors)
// Margins control spacing between blocks, padding controls internal spacing at block edges.
// These are serialized to HTML via style and mirrored via data-* attributes for robustness.
export const BlockAttributes = Extension.create({
  name: 'block-attributes',

  addGlobalAttributes() {
    const targetTypes = [
      'paragraph',
      'heading',
      'blockquote',
      'codeBlock',
      'bulletList',
      'orderedList',
      'listItem',
      'horizontalRule',
    ];

    return [
      {
        types: targetTypes,
        attributes: {
          blockTopMargin: {
            default: '10px',
            parseHTML: (element) => element.getAttribute('data-mt') || (element.style as CSSStyleDeclaration).marginTop || null,
            renderHTML: (attributes) => {
              if (!attributes.blockTopMargin) return {};
              return { 'data-mt': String(attributes.blockTopMargin) };
            },
          },
          blockBottomMargin: {
            default: '10px',
            parseHTML: (element) => element.getAttribute('data-mb') || (element.style as CSSStyleDeclaration).marginBottom || null,
            renderHTML: (attributes) => {
              if (!attributes.blockBottomMargin) return {};
              return { 'data-mb': String(attributes.blockBottomMargin) };
            },
          },
          blockTopPadding: {
            default: '0',
            parseHTML: (element) => element.getAttribute('data-pt') || (element.style as CSSStyleDeclaration).paddingTop || null,
            renderHTML: (attributes) => {
              if (!attributes.blockTopPadding || attributes.blockTopPadding === '0') return {};
              return { 'data-pt': String(attributes.blockTopPadding) };
            },
          },
          blockBottomPadding: {
            default: '0',
            parseHTML: (element) => element.getAttribute('data-pb') || (element.style as CSSStyleDeclaration).paddingBottom || null,
            renderHTML: (attributes) => {
              if (!attributes.blockBottomPadding || attributes.blockBottomPadding === '0') return {};
              return { 'data-pb': String(attributes.blockBottomPadding) };
            },
          },
          blockBackground: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-bg') || element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes.blockBackground) return {};
              return { 'data-bg': String(attributes.blockBackground) };
            },
          },
          // Synthesized style writer to combine the three attributes into one style string
          // without clobbering by separate attribute renderers.
          __blockStyleSynth: {
            default: null,
            renderHTML: (attributes) => {
              const styleParts: string[] = [];
              if (attributes.blockTopMargin) {
                styleParts.push(`margin-top: ${String(attributes.blockTopMargin)};`);
              }
              if (attributes.blockBottomMargin) {
                styleParts.push(`margin-bottom: ${String(attributes.blockBottomMargin)};`);
              }
              if (attributes.blockTopPadding && attributes.blockTopPadding !== '0') {
                styleParts.push(`padding-top: ${String(attributes.blockTopPadding)};`);
              }
              if (attributes.blockBottomPadding && attributes.blockBottomPadding !== '0') {
                styleParts.push(`padding-bottom: ${String(attributes.blockBottomPadding)};`);
              }
              if (attributes.blockBackground) {
                styleParts.push(`background-color: ${String(attributes.blockBackground)};`);
              }
              if (styleParts.length === 0) return {};
              return { style: styleParts.join(' ') };
            },
          },
        },
      },
    ];
  },
});

export default BlockAttributes;


