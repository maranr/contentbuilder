import { useEditor, EditorContent } from '@tiptap/react';
import * as React from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommand } from './extensions/slash-command';
import { DragHandle } from './extensions/drag-handle';
import { HorizontalRuleBlock } from './extensions/horizontal-rule-block';
import type { CSSProperties } from 'react';
import { BubbleFormattingMenu } from './components/bubble-menu';
import { BlockPropsPopover } from './components/block-props-popover';
import { BlockAttributes } from './extensions/block-attributes';

export type RichEditorProps = {
  initialContent?: string;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  onUpdateHtml?: (html: string) => void;
};

export function RichEditor({
  initialContent,
  placeholder = 'Type "/" for commands…',
  className,
  style,
  onUpdateHtml,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
      SlashCommand,
      BlockAttributes,
      DragHandle,
      HorizontalRuleBlock,
    ],
    content: initialContent ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      onUpdateHtml?.(editor.getHTML());
    },
  });

  const handleBackgroundMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editor) return;
    if (e.target !== e.currentTarget) return;
    const endPos = editor.state.doc.content.size;
    editor.chain().focus().setTextSelection(endPos).run();
  };

  return (
    <div className={className} style={style}>
      <EditorWithSidebar editor={editor} onBackgroundMouseDown={handleBackgroundMouseDown} />
    </div>
  );
}

function EditorWithSidebar({ editor, onBackgroundMouseDown }: { editor: any; onBackgroundMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  const [openPos, setOpenPos] = React.useState<number | null>(null);
  const [sidebarTop, setSidebarTop] = React.useState<number>(8);

  // Open/close via kebab and outside clicks; ignore clicks inside sidebar
  React.useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.classList.contains('tiptap-kebab')) {
        const attr = target.getAttribute('data-pos');
        if (attr) setOpenPos(Number(attr));
        e.stopPropagation();
        e.preventDefault();
      } else if (!(target.closest && target.closest('.tiptap-props-sidebar'))) {
        setOpenPos(null);
      }
    };
    document.addEventListener('click', clickHandler, true);
    return () => document.removeEventListener('click', clickHandler, true);
  }, []);

  // Align sidebar vertically with clicked block
  const recomputeTop = React.useCallback(() => {
    const host = editor?.view?.dom as HTMLElement | null;
    if (!host || openPos == null) return;
    const hostRect = host.getBoundingClientRect();
    const kebab = host.querySelector(`.tiptap-kebab[data-pos="${openPos}"]`) as HTMLElement | null;
    if (kebab) {
      const rect = kebab.getBoundingClientRect();
      const top = Math.max(8, rect.top - hostRect.top - 8);
      setSidebarTop(top);
    } else {
      try {
        const coords = editor.view.coordsAtPos(openPos);
        const top = Math.max(8, coords.top - hostRect.top - 8);
        setSidebarTop(top);
      } catch {}
    }
  }, [editor, openPos]);

  React.useLayoutEffect(() => {
    recomputeTop();
  }, [recomputeTop]);

  React.useEffect(() => {
    const onScroll = () => recomputeTop();
    const onResize = () => recomputeTop();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    const currentEditor = editor;
    if (currentEditor && typeof currentEditor.on === 'function') {
      currentEditor.on('transaction', recomputeTop);
    }
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      if (currentEditor && typeof currentEditor.off === 'function') {
        currentEditor.off('transaction', recomputeTop);
      }
    };
  }, [editor, recomputeTop]);

  return (
    <div className="relative">
      {openPos != null && (
        <aside className="tiptap-props-sidebar absolute left-0 w-[280px] border-r bg-white z-40 p-2 overflow-auto max-h-[calc(100vh-16px)]" style={{ top: sidebarTop }}>
          <div className="flex items-center justify-between px-1 py-1">
            <div className="text-xs font-medium text-gray-600">Block properties</div>
            <button type="button" className="text-gray-500" onClick={() => setOpenPos(null)}>×</button>
          </div>
          <BlockPropsPopover editor={editor} targetPos={openPos} onRequestClose={() => setOpenPos(null)} />
        </aside>
      )}
      <div className={`relative min-h-[300px] pr-6 py-2 ${openPos != null ? 'pl-[300px]' : 'pl-8'}`} onMouseDown={onBackgroundMouseDown}>
        {editor && <BubbleFormattingMenu editor={editor} />}
        <div className="mx-auto max-w-[640px]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}


