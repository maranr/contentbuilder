import React, { useEffect, useMemo, useState } from 'react';
import { Editor, Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { SuggestionKeyDownProps } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';

type CommandItem = {
  title: string;
  description?: string;
  hint?: string;
  section: 'Suggested' | 'Basic blocks';
  icon: React.ReactNode;
  command: (editor: Editor) => void;
};

const Icon = {
  Text: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16"/><path d="M8 6v12"/></svg>
  ),
  H1: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6v12"/><path d="M12 6v12"/><path d="M4 12h8"/><path d="M19 18V6l-2 2"/></svg>
  ),
  H2: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6v12"/><path d="M12 6v12"/><path d="M4 12h8"/><path d="M16 14a3 3 0 1 0 3 4h-4a3 3 0 1 1 3-4z"/></svg>
  ),
  H3: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6v12"/><path d="M12 6v12"/><path d="M4 12h8"/><path d="M16 12h4l-3 3 3 3h-4"/></svg>
  ),
  Bulleted: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/><path d="M9 7h10M9 12h10M9 17h10"/></svg>
  ),
  Numbered: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h1"/><path d="M6 12h1"/><path d="M6 17h1"/><path d="M10 7h8M10 12h8M10 17h8"/></svg>
  ),
  Quote: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6H7a2 2 0 0 0-2 2v4h4V8h4v8h6a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z"/></svg>
  ),
  HR: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/></svg>
  ),
  Code: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
  ),
};

const defaultCommands: CommandItem[] = [
  { title: 'Text', description: 'Start writing with plain text', hint: '', section: 'Basic blocks', icon: Icon.Text, command: (e) => e.chain().focus().setParagraph().run() },
  { title: 'Heading 1', description: 'Big section heading', hint: '#', section: 'Basic blocks', icon: Icon.H1, command: (e) => e.chain().focus().setNode('heading', { level: 1 }).run() },
  { title: 'Heading 2', description: 'Medium section heading', hint: '##', section: 'Basic blocks', icon: Icon.H2, command: (e) => e.chain().focus().setNode('heading', { level: 2 }).run() },
  { title: 'Heading 3', description: 'Small section heading', hint: '###', section: 'Basic blocks', icon: Icon.H3, command: (e) => e.chain().focus().setNode('heading', { level: 3 }).run() },
  { title: 'Bulleted list', description: 'Create a simple bullet list', hint: '-', section: 'Basic blocks', icon: Icon.Bulleted, command: (e) => e.chain().focus().setNode('paragraph').toggleBulletList().run() },
  { title: 'Numbered list', description: 'Create a list with numbering', hint: '1.', section: 'Basic blocks', icon: Icon.Numbered, command: (e) => e.chain().focus().setNode('paragraph').toggleOrderedList().run() },
  { title: 'Quote', description: 'Call out a quote', hint: '"', section: 'Basic blocks', icon: Icon.Quote, command: (e) => e.chain().focus().toggleBlockquote().run() },
  { title: 'Divider', description: 'Insert a horizontal rule', hint: '', section: 'Basic blocks', icon: Icon.HR, command: (e) => e.chain().focus().setHorizontalRule().run() },
  { title: 'Code block', description: 'Capture code', hint: '```', section: 'Basic blocks', icon: Icon.Code, command: (e) => e.chain().focus().toggleCodeBlock().run() },
];

function filterCommands(query: string): CommandItem[] {
  const q = query.toLowerCase();
  return defaultCommands.filter((item) => item.title.toLowerCase().includes(q));
}

function CommandList({ items, command }: { items: CommandItem[]; command: (item: CommandItem) => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const it of items) {
      if (!groups[it.section]) groups[it.section] = [];
      groups[it.section].push(it);
    }
    return groups;
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  useEffect(() => setSelectedIndex(0), [items]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length);
        e.preventDefault();
      } else if (e.key === 'Enter') {
        selectItem(selectedIndex);
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [items, selectedIndex]);

  if (!items.length) return <div className="text-sm text-gray-500 p-3">No results</div>;

  const flat = items; // for index mapping

  const HeaderInput = (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', fontSize: 13, color: '#6b7280',
      }}>Filter…</div>
    </div>
  );

  return (
    <div className="rounded-md border bg-white shadow-lg" style={{ width: 360, overflow: 'hidden' }}>
      {HeaderInput}
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {Object.entries(grouped).map(([section, group]) => (
          <div key={section}>
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-gray-500">{section}</div>
            <div className="flex flex-col">
            {group.map((item) => {
              const i = flat.indexOf(item);
              const active = i === selectedIndex;
              return (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => selectItem(i)}
                  className={`w-full flex items-start gap-3 px-3 py-2 text-sm ${active ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  <div className="mt-0.5 text-gray-600" style={{ width: 18 }}>{item.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.description && <div className="text-gray-500 text-xs">{item.description}</div>}
                  </div>
                  {item.hint && <div className="text-gray-400 text-xs">{item.hint}</div>}
                </button>
              );
            })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const SlashCommand = Extension.create({
  name: 'slash-command',
  addProseMirrorPlugins() {
    return [
      Suggestion<CommandItem>({
        editor: this.editor as unknown as Editor,
        char: '/',
        startOfLine: false,
        allowSpaces: true,
        items: ({ query }) => filterCommands(query),
        render: () => {
          let component: ReactRenderer<CommandList> | null = null;
          let popup: TippyInstance[] = [];

          return {
            onStart: (props) => {
              component = new ReactRenderer(CommandList, {
                props: {
                  items: props.items,
                  command: (item: CommandItem) => {
                    const { editor, range } = props;
                    // Remove the typed "/..." text, then run the item command
                    editor.chain().focus().deleteRange(range).run();
                    item.command(editor);
                    // Close popup after applying
                    popup[0]?.hide();
                  },
                },
                editor: props.editor,
              });
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as any,
                appendTo: () => document.body,
                content: (component.element as unknown as HTMLElement) ?? document.createElement('div'),
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate: (props) => {
              component?.updateProps({
                items: props.items,
                command: (item: CommandItem) => {
                  const { editor, range } = props;
                  editor.chain().focus().deleteRange(range).run();
                  item.command(editor);
                  popup[0]?.hide();
                },
              } as any);
              popup[0]?.setProps({ getReferenceClientRect: props.clientRect as any });
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                popup[0]?.hide();
                return true;
              }
              return false;
            },
            onExit: () => {
              popup[0]?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});



