import React from 'react';
import { Editor } from '@tiptap/react';

type Props = {
  editor: Editor;
  className?: string;
};

function getActiveBlockAttrs(editor: Editor): {
  nodeType: string | null;
  blockTopMargin: string | null;
  blockBottomMargin: string | null;
  blockBackground: string | null;
} {
  const state = editor.state;
  const { from } = state.selection;
  const resolved = state.doc.resolve(from);
  // Find nearest block node containing the selection
  for (let depth = resolved.depth; depth >= 0; depth--) {
    const node = resolved.node(depth);
    if (node && node.isBlock) {
      const attrs = node.attrs as Record<string, unknown>;
      return {
        nodeType: node.type.name,
        blockTopMargin: (attrs.blockTopMargin as string) ?? null,
        blockBottomMargin: (attrs.blockBottomMargin as string) ?? null,
        blockBackground: (attrs.blockBackground as string) ?? null,
      };
    }
  }
  return { nodeType: null, blockTopMargin: null, blockBottomMargin: null, blockBackground: null };
}

export function BlockProperties({ editor, className }: Props) {
  const [top, setTop] = React.useState<string>('');
  const [bottom, setBottom] = React.useState<string>('');
  const [bg, setBg] = React.useState<string>('');
  const [editorFocused, setEditorFocused] = React.useState<boolean>(false);
  const [panelActive, setPanelActive] = React.useState<boolean>(false);
  const blurTimerRef = React.useRef<number | null>(null);

  const normalizeLength = (value: string): string => {
    const trimmed = value.trim();
    if (trimmed === '') return '';
    if (trimmed === '0') return '0';
    // If it's a plain number, default to px
    if (/^\d+$/.test(trimmed)) return `${trimmed}px`;
    return trimmed;
  };

  const syncFromEditor = React.useCallback(() => {
    const attrs = getActiveBlockAttrs(editor);
    setTop(attrs.blockTopMargin ?? '');
    setBottom(attrs.blockBottomMargin ?? '');
    setBg(attrs.blockBackground ?? '');
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;
    syncFromEditor();
    const updateHandler = () => syncFromEditor();
    const onFocus = () => {
      if (blurTimerRef.current) {
        window.clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      setEditorFocused(true);
    };
    const onBlur = () => {
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
      blurTimerRef.current = window.setTimeout(() => {
        setEditorFocused(false);
      }, 150);
    };
    editor.on('selectionUpdate', updateHandler);
    editor.on('transaction', updateHandler);
    editor.on('focus', onFocus);
    editor.on('blur', onBlur);
    return () => {
      editor.off('selectionUpdate', updateHandler);
      editor.off('transaction', updateHandler);
      editor.off('focus', onFocus);
      editor.off('blur', onBlur);
      if (blurTimerRef.current) {
        window.clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };
  }, [editor, syncFromEditor]);

  const applyAttr = (key: 'blockTopMargin' | 'blockBottomMargin' | 'blockBackground', value: string) => {
    const { state, view } = editor;
    const { from } = state.selection;
    const resolved = state.doc.resolve(from);
    for (let depth = resolved.depth; depth >= 0; depth--) {
      const posBefore = resolved.before(depth);
      const node = resolved.node(depth);
      if (!node || !node.isBlock) continue;
      const tr = state.tr.setNodeMarkup(posBefore, undefined, {
        ...node.attrs,
        [key]: value || null,
      });
      view.dispatch(tr);
      break;
    }
  };

  const isVisible = editorFocused || panelActive;
  if (!isVisible) return null;

  const handleKeyDown = (key: 'blockTopMargin' | 'blockBottomMargin' | 'blockBackground') => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const val = key === 'blockBackground' ? target.value : normalizeLength(target.value);
      applyAttr(key, val);
    }
  };

  return (
    <div
      className={className}
      onMouseEnter={() => setPanelActive(true)}
      onMouseLeave={() => setPanelActive(false)}
      onFocusCapture={() => setPanelActive(true)}
      onBlurCapture={(e) => {
        const current = e.currentTarget as HTMLElement;
        const next = e.relatedTarget as Node | null;
        if (!next || !current.contains(next)) setPanelActive(false);
      }}
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Top space</label>
          <input
            type="text"
            placeholder="e.g. 0, 8px, 1rem"
            value={top}
            onChange={(e) => {
              setTop(e.target.value);
            }}
            onBlur={(e) => applyAttr('blockTopMargin', normalizeLength(e.target.value))}
            onKeyDown={handleKeyDown('blockTopMargin')}
            className="border rounded px-2 py-1 text-sm w-28"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Bottom space</label>
          <input
            type="text"
            placeholder="e.g. 0, 8px, 1rem"
            value={bottom}
            onChange={(e) => {
              setBottom(e.target.value);
            }}
            onBlur={(e) => applyAttr('blockBottomMargin', normalizeLength(e.target.value))}
            onKeyDown={handleKeyDown('blockBottomMargin')}
            className="border rounded px-2 py-1 text-sm w-28"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Background</label>
          <input
            type="text"
            placeholder="e.g. #f9fafb"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            onBlur={(e) => applyAttr('blockBackground', e.target.value)}
            onKeyDown={handleKeyDown('blockBackground')}
            className="border rounded px-2 py-1 text-sm w-36"
          />
        </div>
      </div>
    </div>
  );
}

export default BlockProperties;


