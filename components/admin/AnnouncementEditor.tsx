"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { copy } from "@/lib/copy";
import styles from "@/app/admin/admin.module.css";

async function uploadEditorFile(
  file: File,
  kind: "image" | "attachment",
  scope: { draftKey?: string; announcementId?: string },
): Promise<{
  url: string;
  file?: { id: string; filename: string; mime: string; size: number };
}> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("kind", kind);
  if (scope.announcementId) {
    formData.set("announcementId", scope.announcementId);
  } else if (scope.draftKey) {
    formData.set("draftKey", scope.draftKey);
  }

  const response = await fetch("/api/announcement-upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    url?: string;
    file?: { id: string; filename: string; mime: string; size: number };
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? copy.admin.announcementUploadFailed);
  }

  return { url: payload.url, file: payload.file };
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.editorToolbarBtn} ${active ? styles.editorToolbarBtnActive : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function AnnouncementEditor({
  initialHtml,
  draftKey,
  announcementId,
  onChange,
  onAttachmentUploaded,
}: {
  initialHtml: string;
  draftKey?: string;
  announcementId?: string;
  onChange: (html: string) => void;
  onAttachmentUploaded?: (file: {
    id: string;
    filename: string;
    mime: string;
    size: number;
  }) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const scope = announcementId ? { announcementId } : { draftKey };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: copy.admin.announcementEditorPlaceholder,
      }),
    ],
    content: initialHtml || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    onChange(editor.getHTML());
  }, [editor, onChange]);

  async function handleImageSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) {
      return;
    }

    try {
      const uploaded = await uploadEditorFile(file, "image", scope);
      editor.chain().focus().setImage({ src: uploaded.url, alt: file.name }).run();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : copy.admin.announcementUploadFailed,
      );
    }
  }

  async function handleAttachmentSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const uploaded = await uploadEditorFile(file, "attachment", scope);
      if (uploaded.file && onAttachmentUploaded) {
        onAttachmentUploaded(uploaded.file);
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : copy.admin.announcementUploadFailed,
      );
    }
  }

  if (!editor) {
    return <div className={styles.editorShell}>{copy.admin.loadingEditor}</div>;
  }

  return (
    <div className={styles.editorShell}>
      <div className={styles.editorToolbar} role="toolbar" aria-label="Edytor">
        <ToolbarButton
          label="B"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarButton
          label="•"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1."
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="🔗"
          active={editor.isActive("link")}
          onClick={() => {
            const previous = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt(copy.admin.announcementLinkPrompt, previous ?? "https://");
            if (url === null) {
              return;
            }
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
        />
        <ToolbarButton
          label="🖼"
          onClick={() => imageInputRef.current?.click()}
        />
        <ToolbarButton
          label="📎"
          onClick={() => attachmentInputRef.current?.click()}
        />
      </div>
      <EditorContent editor={editor} />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => void handleImageSelected(event)}
      />
      <input
        ref={attachmentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={(event) => void handleAttachmentSelected(event)}
      />
    </div>
  );
}
