import { Extension } from '@tiptap/core';

// Adds per-block attributes for spacing and background to common block nodes.
// Attributes:
// - blockTopMargin: CSS length string (e.g., "0", "8px", "1rem")
// - blockBottomMargin: CSS length string
// - blockBackground: CSS color string (e.g., "#ffffff", "rgba(...)" or named colors)
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
    ];

    return [
      {
        types: targetTypes,
        attributes: {
          blockTopMargin: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-mt') || (element.style as CSSStyleDeclaration).paddingTop || null,
            renderHTML: (attributes) => {
              if (!attributes.blockTopMargin) return {};
              return { 'data-mt': String(attributes.blockTopMargin) };
            },
          },
          blockBottomMargin: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-mb') || (element.style as CSSStyleDeclaration).paddingBottom || null,
            renderHTML: (attributes) => {
              if (!attributes.blockBottomMargin) return {};
              return { 'data-mb': String(attributes.blockBottomMargin) };
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
                styleParts.push(`padding-top: ${String(attributes.blockTopMargin)};`);
              }
              if (attributes.blockBottomMargin) {
                styleParts.push(`padding-bottom: ${String(attributes.blockBottomMargin)};`);
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


