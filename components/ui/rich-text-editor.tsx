"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Table as TiptapTable } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Heading2, Heading3, Pilcrow, Table, Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface RichTextEditorProps {
  content:     string;
  onChange:    (html: string) => void;
  placeholder?: string;
  minHeight?:  string;
  className?:  string;
}

function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-primary text-white"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  content, onChange, placeholder, minHeight = "180px", className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapTable.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder ?? "Tulis isi surat di sini...",
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  // Sync external content changes (e.g. when template is loaded)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  const e = editor;

  return (
    <div className={cn(
      "border border-gray-200 rounded-lg overflow-hidden",
      "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary",
      className,
    )}>
      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
        <ToolbarBtn onClick={() => e.chain().focus().toggleBold().run()}
          active={e.isActive("bold")} title="Bold (Ctrl+B)">
          <Bold size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleItalic().run()}
          active={e.isActive("italic")} title="Italic (Ctrl+I)">
          <Italic size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleUnderline().run()}
          active={e.isActive("underline")} title="Underline (Ctrl+U)">
          <UnderlineIcon size={13} />
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()}
          active={e.isActive("heading", { level: 2 })} title="Heading">
          <Heading2 size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 3 }).run()}
          active={e.isActive("heading", { level: 3 })} title="Sub-heading">
          <Heading3 size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().setParagraph().run()}
          active={e.isActive("paragraph")} title="Paragraph">
          <Pilcrow size={13} />
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn onClick={() => e.chain().focus().toggleBulletList().run()}
          active={e.isActive("bulletList")} title="Bullet list">
          <List size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleOrderedList().run()}
          active={e.isActive("orderedList")} title="Numbered list">
          <ListOrdered size={13} />
        </ToolbarBtn>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <ToolbarBtn
          onClick={() => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert table"
        >
          <Table size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => e.chain().focus().insertContent(`
            <table>
              <tbody>
                <tr>
                  <th>No</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Team Rate / Day<br>(IDR)</th>
                  <th>Total Price - 14 Days (IDR)</th>
                </tr>
                <tr>
                  <td>1</td>
                  <td>Helper</td>
                  <td>3</td>
                  <td>Person</td>
                  <td rowspan="4"><strong>Rp. 10.500.000</strong></td>
                  <td rowspan="4"><strong>Rp. 147.000.000</strong></td>
                </tr>
                <tr><td>2</td><td>Operator Crane</td><td>1</td><td>Person</td></tr>
                <tr><td>3</td><td>Rigger</td><td>1</td><td>Person</td></tr>
                <tr><td>4</td><td>Mechanic</td><td>2</td><td>Person</td></tr>
                <tr>
                  <td colspan="5"><strong>Grand Total (14 Days)</strong></td>
                  <td><strong>Rp. 147.000.000</strong></td>
                </tr>
              </tbody>
            </table>
          `).run()}
          title="Insert pricing table"
        >
          <Grid3X3 size={13} />
        </ToolbarBtn>
      </div>

      {/* ── Editor area ─────────────────────────────────────────────────── */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className={cn(
          "prose prose-sm max-w-none px-3 py-2.5",
          "[&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5",
          "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5",
          "[&_.ProseMirror_li]:my-0.5",
          "[&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:my-2",
          "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:bg-gray-50 [&_.ProseMirror_th]:px-2 [&_.ProseMirror_th]:py-1",
          "[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:px-2 [&_.ProseMirror_td]:py-1",
          "[&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mt-2 [&_.ProseMirror_h2]:mb-1",
          "[&_.ProseMirror_h3]:text-sm [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mt-2 [&_.ProseMirror_h3]:mb-0.5",
          "[&_.ProseMirror_p]:my-1 [&_.ProseMirror_p]:leading-relaxed",
        )}
      />
    </div>
  );
}
