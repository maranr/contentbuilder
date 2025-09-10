"use client";
import { useState } from 'react';
import { RichEditor } from '@contentbuider/editor';

const SAMPLE_HTML = `
  <h1>This is some text.</h1>
  <p>Text block</p>
  <h2>Heading 2</h2>
  <p>Paragraph under H2 for testing.</p>
  <ul>
    <li>This is a bulleted list</li>
    <li>This is another bullet</li>
  </ul>
  <ol>
    <li>This is a numbered list</li>
    <li>This is another list</li>
  </ol>
  <blockquote>Blockquote example</blockquote>
  <pre><code>Code block example</code></pre>
  <hr />
  <p>Below the divider</p>
`;

export default function Page() {
  const [contentHtml, setContentHtml] = useState<string>(SAMPLE_HTML);
  const [editorKey, setEditorKey] = useState<number>(0);

  const handleReset = () => {
    setContentHtml(SAMPLE_HTML);
    setEditorKey((k) => k + 1);
  };
  const handleClear = () => {
    setContentHtml('');
    setEditorKey((k) => k + 1);
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Content Builder</h1>
        <div className="flex gap-2">
          <button type="button" className="px-3 py-1 text-sm border rounded" onClick={handleReset}>Reset sample</button>
          <button type="button" className="px-3 py-1 text-sm border rounded" onClick={handleClear}>Clear</button>
        </div>
      </div>
      <div className="rounded border p-4">
        <RichEditor key={editorKey} initialContent={contentHtml} onUpdateHtml={setContentHtml} />
      </div>
    </main>
  );
}



