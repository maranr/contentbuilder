import React, { useEffect, useMemo, useState } from 'react';
import { Editor, Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { SuggestionKeyDownProps } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote as QuoteIcon, 
  Minus, 
  Code 
} from 'lucide-react';

type CommandItem = {
  title: string;
  description: string;
  section: 'Basic' | 'Lists' | 'Advanced';
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  preview: string;
  command: (editor: Editor) => void;
};

const defaultCommands: CommandItem[] = [
  { 
    title: 'Text', 
    description: 'Start writing with plain text', 
    section: 'Basic', 
    icon: Type, 
    preview: 'Just start typing with plain text.',
    command: (e) => e.chain().focus().setParagraph().run() 
  },
  { 
    title: 'Heading 1', 
    description: 'Big section heading', 
    section: 'Basic', 
    icon: Heading1, 
    preview: '<h1>Big heading</h1>',
    command: (e) => e.chain().focus().setNode('heading', { level: 1 }).run() 
  },
  { 
    title: 'Heading 2', 
    description: 'Medium section heading', 
    section: 'Basic', 
    icon: Heading2, 
    preview: '<h2>Medium heading</h2>',
    command: (e) => e.chain().focus().setNode('heading', { level: 2 }).run() 
  },
  { 
    title: 'Heading 3', 
    description: 'Small section heading', 
    section: 'Basic', 
    icon: Heading3, 
    preview: '<h3>Small heading</h3>',
    command: (e) => e.chain().focus().setNode('heading', { level: 3 }).run() 
  },
  { 
    title: 'Bulleted list', 
    description: 'Create a simple bullet list', 
    section: 'Lists', 
    icon: List, 
    preview: '<ul>• Item 1\n• Item 2\n• Item 3</ul>',
    command: (e) => e.chain().focus().setNode('paragraph').toggleBulletList().run() 
  },
  { 
    title: 'Numbered list', 
    description: 'Create a list with numbering', 
    section: 'Lists', 
    icon: ListOrdered, 
    preview: '<ol>1. First item\n2. Second item\n3. Third item</ol>',
    command: (e) => e.chain().focus().setNode('paragraph').toggleOrderedList().run() 
  },
  { 
    title: 'Quote', 
    description: 'Capture a quote or citation', 
    section: 'Advanced', 
    icon: QuoteIcon, 
    preview: '<quote>"A quote or citation."</quote>',
    command: (e) => e.chain().focus().toggleBlockquote().run() 
  },
  { 
    title: 'Divider', 
    description: 'Visually divide blocks', 
    section: 'Advanced', 
    icon: Minus, 
    preview: '<hr>',
    command: (e) => e.chain().focus().setHorizontalRule().run() 
  },
  { 
    title: 'Code block', 
    description: 'Capture a code snippet', 
    section: 'Advanced', 
    icon: Code, 
    preview: '<code>const hello = "world";</code>',
    command: (e) => e.chain().focus().toggleCodeBlock().run() 
  },
];

function filterCommands(query: string): CommandItem[] {
  const q = query.toLowerCase();
  return defaultCommands.filter((item) => item.title.toLowerCase().includes(q));
}

function PreviewBlock({ preview }: { preview: string }) {
  // Parse the preview format: <type>content</type>
  const match = preview.match(/^<(\w+)>(.*)<\/\1>$/s);
  
  if (!match) {
    // Plain text preview
    return (
      <div 
        className="text-sm text-gray-700 bg-white rounded-md p-3 border border-gray-200 shadow-sm"
        style={{ minHeight: 80, lineHeight: 1.6 }}
      >
        {preview}
      </div>
    );
  }

  const [, type, content] = match;

  // Render based on type
  if (type === 'h1') {
    return (
      <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm" style={{ minHeight: 80 }}>
        <div style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.2, color: '#111827' }}>
          {content}
        </div>
      </div>
    );
  }

  if (type === 'h2') {
    return (
      <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm" style={{ minHeight: 80 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3, color: '#111827' }}>
          {content}
        </div>
      </div>
    );
  }

  if (type === 'h3') {
    return (
      <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm" style={{ minHeight: 80 }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4, color: '#111827' }}>
          {content}
        </div>
      </div>
    );
  }

  if (type === 'ul') {
    return (
      <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm" style={{ minHeight: 80 }}>
        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </div>
    );
  }

  if (type === 'ol') {
    return (
      <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm" style={{ minHeight: 80 }}>
        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
      </div>
    );
  }

  if (type === 'quote') {
    return (
      <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm" style={{ minHeight: 80 }}>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280', 
          fontStyle: 'italic',
          borderLeft: '3px solid #d1d5db',
          paddingLeft: '12px',
          lineHeight: 1.6
        }}>
          {content}
        </div>
      </div>
    );
  }

  if (type === 'hr') {
    return (
      <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm flex items-center" style={{ minHeight: 80 }}>
        <div style={{ width: '100%', height: '1px', backgroundColor: '#d1d5db' }} />
      </div>
    );
  }

  if (type === 'code') {
    return (
      <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm" style={{ minHeight: 80 }}>
        <div style={{ 
          fontSize: '0.813rem', 
          color: '#1f2937',
          fontFamily: 'monospace',
          backgroundColor: '#f3f4f6',
          padding: '8px',
          borderRadius: '4px',
          lineHeight: 1.5
        }}>
          {content}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div 
      className="text-sm text-gray-700 bg-white rounded-md p-3 border border-gray-200 shadow-sm"
      style={{ minHeight: 80, lineHeight: 1.6 }}
    >
      {content}
    </div>
  );
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

  if (!items.length) {
    return (
      <div 
        className="rounded-lg border border-gray-200 bg-white shadow-xl" 
        style={{ width: 540, overflow: 'hidden' }}
      >
        <div className="text-sm text-gray-500 p-4 text-center">No results</div>
      </div>
    );
  }

  const flat = items;
  const selectedItem = items[selectedIndex];

  return (
    <div 
      className="rounded-lg border border-gray-200 bg-white shadow-xl" 
      style={{ width: 540, overflow: 'hidden', display: 'flex' }}
    >
      {/* Left panel - Commands list */}
      <div style={{ width: 320, borderRight: '1px solid #e5e7eb' }}>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {Object.entries(grouped).map(([section, group]) => (
            <div key={section}>
              <div className="px-3 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {section}
              </div>
              <div className="flex flex-col pb-2">
                {group.map((item) => {
                  const i = flat.indexOf(item);
                  const active = i === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.title}
                      onClick={() => selectItem(i)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                        active ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <Icon 
                        size={18} 
                        strokeWidth={2} 
                        className={active ? 'text-blue-600' : 'text-gray-500'}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className={`text-xs ${active ? 'text-blue-700' : 'text-gray-500'}`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Preview */}
      <div style={{ width: 220, backgroundColor: '#fafafa', padding: '16px' }}>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Preview
        </div>
        {selectedItem && (
          <div>
            <PreviewBlock preview={selectedItem.preview} />
            <div className="mt-3 text-xs text-gray-500">
              Click or press <kbd className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono text-gray-700">Enter</kbd> to insert
            </div>
          </div>
        )}
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



