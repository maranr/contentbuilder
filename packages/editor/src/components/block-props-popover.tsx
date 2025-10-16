import * as React from 'react';
import { Editor } from '@tiptap/react';

const SWATCHES = [
  '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb',
  '#fee2e2', '#fde68a', '#d1fae5', '#bfdbfe', '#ede9fe',
  'transparent',
];

type Props = {
  editor: Editor;
  targetPos: number; // pos of the block node start
  onRequestClose?: () => void;
};

function readAttrs(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return { 
    nodeType: '',
    marginTop: '', 
    marginBottom: '', 
    paddingTop: '', 
    paddingBottom: '', 
    bg: '',
    hrThickness: '1px',
    hrStyle: 'solid',
    hrColor: '#e5e7eb',
  };
  const a = node.attrs as Record<string, unknown>;
  return {
    nodeType: node.type.name,
    marginTop: (a.blockTopMargin as string) ?? '',
    marginBottom: (a.blockBottomMargin as string) ?? '',
    paddingTop: (a.blockTopPadding as string) ?? '',
    paddingBottom: (a.blockBottomPadding as string) ?? '',
    bg: (a.blockBackground as string) ?? '',
    hrThickness: (a.hrThickness as string) ?? '1px',
    hrStyle: (a.hrStyle as string) ?? 'solid',
    hrColor: (a.hrColor as string) ?? '#e5e7eb',
  };
}

function toNumberPx(value: string): number {
  if (!value) return 0;
  if (value === '0') return 0;
  const m = /^(-?\d+)/.exec(value);
  return m ? parseInt(m[1], 10) : 0;
}

function px(n: number): string { return n === 0 ? '0' : `${n}px`; }

type AttrValues = {
  nodeType: string;
  marginTop: string;
  marginBottom: string;
  paddingTop: string;
  paddingBottom: string;
  bg: string;
  hrThickness: string;
  hrStyle: string;
  hrColor: string;
};

export const BlockPropsPopover: React.FC<Props> = ({ editor, targetPos, onRequestClose }: Props) => {
  const [vals, setVals] = React.useState<AttrValues>(() => readAttrs(editor, targetPos));

  React.useEffect(() => {
    setVals(readAttrs(editor, targetPos));
  }, [editor, targetPos]);

  const apply = (partial: Partial<AttrValues>) => {
    const next = { ...vals, ...partial };
    setVals(next);
    const node = editor.state.doc.nodeAt(targetPos);
    if (!node) return;
    const { state, view } = editor;
    const attrs: Record<string, unknown> = {
      ...node.attrs,
      blockTopMargin: next.marginTop || null,
      blockBottomMargin: next.marginBottom || null,
      blockTopPadding: next.paddingTop || null,
      blockBottomPadding: next.paddingBottom || null,
      blockBackground: next.bg || null,
    };
    
    // Add HR-specific attributes if this is a horizontal rule
    if (node.type.name === 'horizontalRule') {
      attrs.hrThickness = next.hrThickness;
      attrs.hrStyle = next.hrStyle;
      attrs.hrColor = next.hrColor;
    }
    
    const tr = state.tr.setNodeMarkup(targetPos, undefined, attrs);
    view.dispatch(tr);
  };

  const marginTopNum = toNumberPx(vals.marginTop);
  const marginBottomNum = toNumberPx(vals.marginBottom);
  const paddingTopNum = toNumberPx(vals.paddingTop);
  const paddingBottomNum = toNumberPx(vals.paddingBottom);
  const isHR = vals.nodeType === 'horizontalRule';
  const hrThicknessNum = toNumberPx(vals.hrThickness);

  return React.createElement(
    'div',
    { className: 'p-2 bg-white border rounded shadow-md w-[260px]' },
    // Top margin slider
    React.createElement('div', { className: 'mb-3' },
      React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Top spacing (margin)'),
      React.createElement('input', {
        type: 'range', min: 0, max: 100, step: 5, value: marginTopNum,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => apply({ marginTop: px(parseInt(e.target.value, 10)) }),
        className: 'w-full',
      }),
      React.createElement('div', { className: 'text-[11px] text-gray-500 mt-1' }, `${marginTopNum}px`),
    ),
    // Bottom margin slider
    React.createElement('div', { className: 'mb-3' },
      React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Bottom spacing (margin)'),
      React.createElement('input', {
        type: 'range', min: 0, max: 100, step: 5, value: marginBottomNum,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => apply({ marginBottom: px(parseInt(e.target.value, 10)) }),
        className: 'w-full',
      }),
      React.createElement('div', { className: 'text-[11px] text-gray-500 mt-1' }, `${marginBottomNum}px`),
    ),
    // Top padding slider
    React.createElement('div', { className: 'mb-3' },
      React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Top padding'),
      React.createElement('input', {
        type: 'range', min: 0, max: 100, step: 5, value: paddingTopNum,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => apply({ paddingTop: px(parseInt(e.target.value, 10)) }),
        className: 'w-full',
      }),
      React.createElement('div', { className: 'text-[11px] text-gray-500 mt-1' }, `${paddingTopNum}px`),
    ),
    // Bottom padding slider
    React.createElement('div', { className: 'mb-3' },
      React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Bottom padding'),
      React.createElement('input', {
        type: 'range', min: 0, max: 100, step: 5, value: paddingBottomNum,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => apply({ paddingBottom: px(parseInt(e.target.value, 10)) }),
        className: 'w-full',
      }),
      React.createElement('div', { className: 'text-[11px] text-gray-500 mt-1' }, `${paddingBottomNum}px`),
    ),
    // HR-specific controls
    ...(isHR ? [
      // Line thickness slider
      React.createElement('div', { className: 'mb-3 border-t pt-3' },
        React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Line thickness'),
        React.createElement('input', {
          type: 'range', min: 0, max: 10, step: 1, value: hrThicknessNum,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => apply({ hrThickness: px(parseInt(e.target.value, 10)) }),
          className: 'w-full',
        }),
        React.createElement('div', { className: 'text-[11px] text-gray-500 mt-1' }, `${hrThicknessNum}px`),
      ),
      // Line style dropdown
      React.createElement('div', { className: 'mb-3' },
        React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Line style'),
        React.createElement('select', {
          value: vals.hrStyle,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => apply({ hrStyle: e.target.value }),
          className: 'w-full border rounded px-2 py-1 text-xs',
        },
          React.createElement('option', { value: 'solid' }, 'Solid'),
          React.createElement('option', { value: 'dashed' }, 'Dashed'),
          React.createElement('option', { value: 'dotted' }, 'Dotted'),
          React.createElement('option', { value: 'double' }, 'Double'),
          React.createElement('option', { value: 'none' }, 'None (Spacer)'),
        ),
      ),
      // Line color input
      React.createElement('div', { className: 'mb-3' },
        React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Line color'),
        React.createElement('input', {
          type: 'text',
          value: vals.hrColor,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => apply({ hrColor: e.target.value }),
          placeholder: 'e.g. #e5e7eb',
          className: 'w-full border rounded px-2 py-1 text-xs',
        }),
      ),
    ] : []),
    // Background swatches in tighter grid
    React.createElement('div', { className: 'mb-3 border-t pt-3' },
      React.createElement('div', { className: 'text-xs text-gray-500 mb-1' }, 'Background'),
      React.createElement(
        'div',
        { className: 'grid grid-cols-6 gap-1.5' },
        ...SWATCHES.map((c) => React.createElement('button', {
          key: c,
          type: 'button',
          onClick: () => apply({ bg: c === 'transparent' ? '' : c }),
          title: c,
          className: 'w-6 h-6 rounded border',
          style: c === 'transparent'
            ? { background: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%, transparent 50%, #e5e7eb 50%, #e5e7eb 75%, transparent 75%, transparent)', backgroundSize: '6px 6px' }
            : { backgroundColor: c },
        }))
      ),
    ),
    React.createElement('div', { className: 'mt-1 flex justify-end' },
      React.createElement('button', { type: 'button', className: 'px-2 py-1 text-xs border rounded', onClick: onRequestClose }, 'Close')
    ),
  );
};

export default BlockPropsPopover;


