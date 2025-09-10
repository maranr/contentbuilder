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
  if (!node) return { top: '', bottom: '', bg: '' };
  const a = node.attrs as Record<string, unknown>;
  return {
    top: (a.blockTopMargin as string) ?? '',
    bottom: (a.blockBottomMargin as string) ?? '',
    bg: (a.blockBackground as string) ?? '',
  };
}

function toNumberPx(value: string): number {
  if (!value) return 0;
  if (value === '0') return 0;
  const m = /^(-?\d+)/.exec(value);
  return m ? parseInt(m[1], 10) : 0;
}

function px(n: number): string { return n === 0 ? '0' : `${n}px`; }

export const BlockPropsPopover: React.FC<Props> = ({ editor, targetPos, onRequestClose }: Props) => {
  const [vals, setVals] = React.useState<{ top: string; bottom: string; bg: string }>(() => readAttrs(editor, targetPos));

  React.useEffect(() => {
    setVals(readAttrs(editor, targetPos));
  }, [editor, targetPos]);

  const apply = (partial: Partial<{ top: string; bottom: string; bg: string }>) => {
    const next = { ...vals, ...partial };
    setVals(next);
    const node = editor.state.doc.nodeAt(targetPos);
    if (!node) return;
    const { state, view } = editor;
    const tr = state.tr.setNodeMarkup(targetPos, undefined, {
      ...node.attrs,
      blockTopMargin: next.top || null,
      blockBottomMargin: next.bottom || null,
      blockBackground: next.bg || null,
    });
    view.dispatch(tr);
  };

  const topNum = toNumberPx(vals.top);
  const bottomNum = toNumberPx(vals.bottom);

  return React.createElement(
    'div',
    { className: 'p-2 bg-white border rounded shadow-md w-[260px]' },
    // Top padding slider
    React.createElement('div', { className: 'mb-3' },
      React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Top padding'),
      React.createElement('input', {
        type: 'range', min: 0, max: 200, step: 5, value: topNum,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => apply({ top: px(parseInt(e.target.value, 10)) }),
        className: 'w-full',
      }),
      React.createElement('div', { className: 'text-[11px] text-gray-500 mt-1' }, `${topNum}px`),
    ),
    // Bottom padding slider
    React.createElement('div', { className: 'mb-3' },
      React.createElement('label', { className: 'block text-xs text-gray-500 mb-1' }, 'Bottom padding'),
      React.createElement('input', {
        type: 'range', min: 0, max: 200, step: 5, value: bottomNum,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => apply({ bottom: px(parseInt(e.target.value, 10)) }),
        className: 'w-full',
      }),
      React.createElement('div', { className: 'text-[11px] text-gray-500 mt-1' }, `${bottomNum}px`),
    ),
    // Background swatches in tighter grid
    React.createElement('div', { className: 'mb-3' },
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


