'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  X,
  FileText,
  Loader2,
  Plus,
  Mic,
  Pencil,
  Check,
} from 'lucide-react';
import { MessageEntity, MessageType } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import { useUploadMedia } from '../../hooks/use-upload-media';
import { createPreviewUrl, revokePreviewUrl } from '../../lib/image-optimizer';
import { Emoji } from '../ui/Emoji';
import { FullEmojiPickerModal } from '../ui/FullEmojiPickerModal';

interface ChatComposerProps {
  channelId: string;
  channelName: string;
  members?: any[];
  replyingMessage: MessageEntity | null;
  onCancelReply: () => void;
  editingMessage?: MessageEntity | null;
  onCancelEdit?: () => void;
  onSaveEdit?: (messageId: string, content: string) => Promise<void>;
  onSendMessage: (data: {
    content?: string;
    type: MessageType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
  }) => Promise<void>;
  reportTyping: (isTyping: boolean) => void;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🔥', '✨', '👏', '😍', '🚀', '💡', '💯', '🙌'];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ChatComposer: React.FC<ChatComposerProps> = ({
  channelName,
  members = [],
  replyingMessage,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onSaveEdit,
  onSendMessage,
  reportTyping,
}) => {
  const t = useLanguageStore((s) => s.t);
  const uiStyle = useThemeStore((s) => s.uiStyle);
  const isGlass = uiStyle === 'glass';
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    previewUrl: string;
    isImage: boolean;
  } | null>(null);

  const { uploadMedia, isUploading, progress } = useUploadMedia();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Focus textarea when replying or editing
  useEffect(() => {
    if (replyingMessage && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingMessage]);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content || '');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [editingMessage]);

  // Cleanup object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (attachedFile?.previewUrl) {
        revokePreviewUrl(attachedFile.previewUrl);
      }
    };
  }, [attachedFile?.previewUrl]);

  const handleClearAttachment = useCallback(() => {
    if (attachedFile?.previewUrl) {
      revokePreviewUrl(attachedFile.previewUrl);
    }
    setAttachedFile(null);
  }, [attachedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImageOnly = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(t.chat.fileSizeLimit);
      e.target.value = '';
      return;
    }

    if (attachedFile?.previewUrl) {
      revokePreviewUrl(attachedFile.previewUrl);
    }

    const previewUrl = createPreviewUrl(file);
    const isImage = file.type.startsWith('image/');

    setAttachedFile({
      file,
      previewUrl,
      isImage,
    });
    e.target.value = '';
  };

  // Mention candidates computation
  const mentionCandidates = React.useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const list: string[] = [];
    if ('all'.includes(q) || 'mọi người'.includes(q)) {
      list.push('all');
    }
    const names: string[] = [];
    members?.forEach((m: any) => {
      const name = m.nickname || m.user?.profile?.displayName || m.user?.email?.split('@')[0];
      if (name && !names.includes(name)) {
        names.push(name);
      }
    });
    const filtered = names.filter((n) => n.toLowerCase().includes(q));
    return [...list, ...filtered].slice(0, 8);
  }, [mentionQuery, members]);

  useEffect(() => {
    setMentionSelectedIndex(0);
  }, [mentionQuery]);

  const handleSelectMention = (name: string) => {
    if (mentionStartIndex === null) return;
    const cursorPos = textareaRef.current ? textareaRef.current.selectionStart : content.length;
    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(cursorPos);
    const newContent = `${before}@${name} ${after}`;
    setContent(newContent);
    setMentionQuery(null);
    setMentionStartIndex(null);

    // Restore focus and cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const nextPos = before.length + name.length + 2; // '@' + name + ' '
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (val.length > 0) {
      reportTyping(true);
    } else {
      reportTyping(false);
    }

    // Detect mention trigger (@name query)
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\.\u00C0-\u024F\u1EA0-\u1EF9]*)$/);

    if (match) {
      const query = match[1];
      const atIndex = textBeforeCursor.lastIndexOf('@');
      setMentionQuery(query);
      setMentionStartIndex(atIndex);
    } else {
      setMentionQuery(null);
      setMentionStartIndex(null);
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && !attachedFile) return;
    if (isSubmitting || isUploading) return;

    setIsSubmitting(true);
    try {
      if (editingMessage) {
        if (onSaveEdit) {
          await onSaveEdit(editingMessage.id, trimmed);
        }
        setContent('');
        onCancelEdit?.();
        reportTyping(false);
        setShowEmojiPicker(false);
        setMentionQuery(null);
        setMentionStartIndex(null);
        return;
      }

      if (attachedFile) {
        // Upload to Cloudflare R2 / Storage first (with automatic client-side optimization)
        const uploadRes = await uploadMedia({
          folder: 'attachments',
          file: attachedFile.file,
          fileName: attachedFile.file.name,
        });

        await onSendMessage({
          content: trimmed || undefined,
          type: MessageType.FILE,
          fileUrl: uploadRes.publicUrl,
          fileName: attachedFile.file.name,
          fileSize: attachedFile.file.size,
          replyToId: replyingMessage?.id,
        });

        revokePreviewUrl(attachedFile.previewUrl);
        setAttachedFile(null);
      } else {
        await onSendMessage({
          content: trimmed,
          type: MessageType.TEXT,
          replyToId: replyingMessage?.id,
        });
      }

      setContent('');
      onCancelReply();
      reportTyping(false);
      setShowEmojiPicker(false);
      setMentionQuery(null);
      setMentionStartIndex(null);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionSelectedIndex((prev) => (prev + 1) % mentionCandidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionSelectedIndex((prev) => (prev - 1 + mentionCandidates.length) % mentionCandidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(mentionCandidates[mentionSelectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        setMentionStartIndex(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 shrink-0 bg-white dark:bg-circle-dark-surface p-3 transition-colors">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileChange(e, false)}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, true)}
      />

      {/* Reply Quote Banner */}
      {replyingMessage && (
        <div className="mb-2 flex items-center justify-between rounded-xl chat-composer-reply-banner px-3 py-1.5 text-xs border animate-in fade-in duration-150">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold chat-composer-reply-author">
              {t.chat.replyingTo.replace(
                '{name}',
                replyingMessage.sender?.nickname ||
                  replyingMessage.sender?.user?.profile?.displayName ||
                  t.auth.guest,
              )}
            </span>
            <span className="text-circle-slate dark:text-circle-dark-muted truncate opacity-85">
              {replyingMessage.type === MessageType.FILE
                ? `[${t.chat.fileDownload}]`
                : replyingMessage.content}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="flex h-5 w-5 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-hairline hover:text-circle-charcoal transition-colors ml-2 shrink-0"
            title={t.chat.cancelReply}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Editing Message Banner (CHT-09) */}
      {editingMessage && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 truncate text-amber-700 dark:text-amber-300">
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold">{t.chat.editingMessage}:</span>
            <span className="text-circle-slate dark:text-circle-dark-muted truncate opacity-85">
              {editingMessage.content}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex h-5 w-5 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-hairline hover:text-circle-charcoal transition-colors ml-2 shrink-0"
            title={t.chat.cancelEdit}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attached File Preview */}
      {attachedFile && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 p-2 pr-3 text-xs shadow-sm animate-in fade-in duration-100">
          {attachedFile.isImage ? (
            <img
              src={attachedFile.previewUrl}
              alt="preview"
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-circle-primary/10 text-circle-sage">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <div className="max-w-xs truncate">
            <p className="font-medium text-circle-charcoal dark:text-circle-dark-text truncate">
              {attachedFile.file.name}
            </p>
            <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
              {(attachedFile.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAttachment}
            className="ml-2 flex h-5 w-5 items-center justify-center rounded-full text-circle-slate hover:bg-circle-hairline hover:text-circle-charcoal transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Comprehensive Full Emoji Picker Modal */}
      <FullEmojiPickerModal
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={(emoji) => handleAddEmoji(emoji)}
      />

      {/* Mention Autocomplete Popup (Minimalism: Name only) */}
      {mentionCandidates.length > 0 && (
        <div className="absolute bottom-full mb-2 left-4 z-30 w-52 max-h-48 overflow-y-auto rounded-xl border border-circle-hairline bg-white/95 dark:bg-circle-dark-surface/95 dark:border-circle-dark-hairline backdrop-blur-md shadow-lg py-1 animate-in fade-in duration-100">
          {mentionCandidates.map((name, idx) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectMention(name);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs truncate transition-colors ${
                idx === mentionSelectedIndex
                  ? 'bg-circle-wash dark:bg-circle-dark-wash text-circle-primary font-semibold'
                  : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas'
              }`}
            >
              @{name}
            </button>
          ))}
        </div>
      )}

      {/* Apple-Style Separated Input Bar: Left Input Capsule + Right Standalone Action Button */}
      <div className="flex items-center gap-2.5 w-full">
        {/* Left Input Capsule: (+) icon, Image icon, Text field, and Sticker/Emoji on far right */}
        <div
          className={`flex-1 flex items-center gap-2 rounded-full border px-3 py-1.5 min-h-[48px] transition-all ${
            isGlass
              ? 'backdrop-blur-md bg-white/80 dark:bg-circle-dark-surface/80 border-white/60 dark:border-white/10 shadow-xs'
              : 'bg-white dark:bg-circle-dark-surface border-circle-hairline dark:border-circle-dark-hairline shadow-2xs'
          }`}
        >
          {/* Action 1: (+) Outline Neutral Plus Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-circle-slate/35 dark:border-circle-dark-hairline text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:border-circle-charcoal/50 hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-all shrink-0 active:scale-95"
            title={t.chat.attachFile}
          >
            <Plus className="h-4 w-4 stroke-[2.2]" />
          </button>

          {/* Action 2: Image / Photo Icon */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors shrink-0 active:scale-95"
            title={t.chat.attachImage}
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {/* Text Area (Flex-1) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.composerPlaceholder.replace('{channel}', channelName)}
            className="flex-1 max-h-28 resize-none bg-transparent py-1.5 text-xs sm:text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:outline-none leading-relaxed"
          />

          {/* Action 3: Emoji / Sticker Button (Far right inside capsule) */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex h-7 w-7 items-center justify-center transition-colors shrink-0 active:scale-95 ${
              showEmojiPicker
                ? 'text-circle-primary font-bold'
                : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
            }`}
            title={t.chat.reactAction}
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        {/* Right Standalone Action Button: Save (when editing) vs Mic (when empty) vs Send (when typing) */}
        <button
          type="button"
          onClick={
            content.trim() || attachedFile
              ? handleSend
              : () => alert('Tính năng ghi âm tin nhắn thoại (Voice Message) đang sẵn sàng trong bản cập nhật kế tiếp.')
          }
          disabled={(content.trim() || attachedFile) ? (isSubmitting || isUploading) : false}
          className={`flex h-12 w-12 items-center justify-center rounded-full shrink-0 transition-all active:scale-95 ${
            editingMessage
              ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600'
              : content.trim() || attachedFile
              ? 'chat-composer-send-btn-active shadow-sm'
              : isGlass
              ? 'backdrop-blur-md bg-white/80 dark:bg-circle-dark-surface/80 border border-white/60 dark:border-white/10 shadow-xs text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-white dark:hover:bg-circle-dark-surface'
              : 'bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-2xs text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas'
          }`}
          title={editingMessage ? t.chat.saveEdit : (content.trim() || attachedFile) ? t.chat.sendBtn : 'Ghi âm tin nhắn thoại'}
        >
          {editingMessage ? (
            isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Check className="h-5 w-5 text-white" />
            )
          ) : content.trim() || attachedFile ? (
            isSubmitting || isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-circle-charcoal" />
            ) : (
              <Send className="h-5 w-5" />
            )
          ) : (
            <Mic className="h-5 w-5 text-circle-slate dark:text-circle-dark-muted" />
          )}
        </button>
      </div>
    </div>
  );
};

