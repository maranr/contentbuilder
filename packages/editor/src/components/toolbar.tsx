import React from 'react';
import type { Editor } from '@tiptap/react';

type ToolbarProps = {
  editor: Editor;
  className?: string;
};

function Button({ onClick, disabled, active, label }: { onClick: () => void; disabled?: boolean; active?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-1 text-sm border rounded mr-1 mb-1 ${active ? 'bg-gray-100' : 'bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
    >
      {label}
    </button>
  );
}

export function Toolbar({ editor, className }: ToolbarProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center">
        <Button
          label="B"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        />
        <Button
          label="I"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        />
        <Button
          label="H1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        />
        <Button
          label="H2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        />
        <Button
          label="UL"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        />
        <Button
          label="OL"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        />
        <Button
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={!editor.can().chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        />
        <Button
          label="Code"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        />
        <Button
          label="HR"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <Button
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        />
        <Button
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        />
      </div>
    </div>
  );
}


