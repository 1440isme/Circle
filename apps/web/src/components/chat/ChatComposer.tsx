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
} from 'lucide-react';
import { MessageEntity, MessageType } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { useUploadMedia } from '../../hooks/use-upload-media';
import { createPreviewUrl, revokePreviewUrl } from '../../lib/image-optimizer';

interface ChatComposerProps {
  channelId: string;
  channelName: string;
  replyingMessage: MessageEntity | null;
  onCancelReply: () => void;
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
  replyingMessage,
  onCancelReply,
  onSendMessage,
  reportTyping,
}) => {
  const t = useLanguageStore((s) => s.t);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  // Focus textarea when replying
  useEffect(() => {
    if (replyingMessage && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingMessage]);

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (e.target.value.length > 0) {
      reportTyping(true);
    } else {
      reportTyping(false);
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && !attachedFile) return;
    if (isSubmitting || isUploading) return;

    setIsSubmitting(true);
    try {
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
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="sticky bottom-0 z-20 border-t border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 backdrop-blur-md p-3 transition-colors">
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
        <div className="mb-2 flex items-center justify-between rounded-xl bg-circle-canvas dark:bg-circle-dark-elevated px-3 py-1.5 text-xs border border-circle-hairline dark:border-circle-dark-hairline animate-in fade-in duration-150">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-circle-sage dark:text-circle-primary">
              {t.chat.replyingTo.replace(
                '{name}',
                replyingMessage.sender?.nickname ||
                  replyingMessage.sender?.user?.profile?.displayName ||
                  t.auth.guest,
              )}
            </span>
            <span className="text-circle-slate dark:text-circle-dark-muted truncate">
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

      {/* Emoji Quick Drawer */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-4 z-30 flex flex-wrap gap-1.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-2 shadow-circle-modal max-w-xs animate-in zoom-in-95 duration-100">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-base transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Composer Input Area */}
      <div className="flex items-end gap-2 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-2 focus-within:border-circle-sage/80 dark:focus-within:border-circle-primary/80 transition-all">
        {/* Attachment Buttons */}
        <div className="flex items-center gap-0.5 pb-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-sage dark:hover:text-circle-primary transition-colors"
            title={t.chat.attachFile}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-sage dark:hover:text-circle-primary transition-colors"
            title={t.chat.attachImage}
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={t.chat.composerPlaceholder.replace('{channel}', channelName)}
          className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent py-1.5 text-xs sm:text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:outline-none leading-relaxed"
        />

        {/* Emoji Button */}
        <div className="flex items-center gap-1 pb-1">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              showEmojiPicker
                ? 'bg-circle-wash text-circle-sage dark:bg-circle-dark-wash dark:text-circle-primary'
                : 'text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas'
            }`}
            title={t.chat.reactAction}
          >
            <Smile className="h-4 w-4" />
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!content.trim() && !attachedFile) || isSubmitting || isUploading}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
              (content.trim() || attachedFile) && !isSubmitting && !isUploading
                ? 'bg-circle-primary text-circle-charcoal shadow-sm hover:bg-circle-sage hover:text-white active:scale-95'
                : 'bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted opacity-40 cursor-not-allowed'
            }`}
            title={t.chat.sendBtn}
          >
            {isSubmitting || isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-circle-charcoal" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

