import { useState, useCallback } from 'react';
import { getStoredTokens } from '../lib/auth-storage';
import { useLanguageStore } from '../stores/language.store';
import { StorageFolder, PresignedUploadResponse, ApiResponse } from '@circle/types';
import { optimizeImage, ImageOptimizationOptions } from '../lib/image-optimizer';

interface UploadOptions {
  folder: StorageFolder;
  file: File | Blob;
  fileName?: string;
  optimizationOptions?: ImageOptimizationOptions;
  onProgress?: (percent: number) => void;
}

export function useUploadMedia() {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const uploadMedia = useCallback(
    async ({
      folder,
      file,
      fileName,
      optimizationOptions,
      onProgress,
    }: UploadOptions): Promise<{ publicUrl: string; key: string; savingsPercent?: number }> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        let uploadFile: File | Blob = file;
        let contentType = file.type || 'application/octet-stream';
        let resolvedFileName =
          fileName ||
          (file instanceof File
            ? file.name
            : `media_${Date.now()}.${contentType.split('/')[1] || 'bin'}`);
        let savingsPercent = 0;

        // Step 1: Client-side Image Optimization & EXIF Stripping
        if (contentType.startsWith('image/')) {
          const maxDim = folder === 'avatars' ? 512 : 1920;
          const optResult = await optimizeImage(file, {
            maxWidth: maxDim,
            maxHeight: maxDim,
            quality: folder === 'avatars' ? 0.85 : 0.82,
            ...optimizationOptions,
          });

          uploadFile = optResult.blob;
          contentType = optResult.file.type;
          resolvedFileName = optResult.file.name;
          savingsPercent = Math.round(optResult.savingsRatio * 100);

          if (savingsPercent > 0) {
            console.log(
              `[ImageOptimizer] Optimized ${file.size}B ➔ ${optResult.optimizedSize}B (-${savingsPercent}%) [EXIF stripped]`,
            );
          }
        }

        const { accessToken } = getStoredTokens();
        const fileSize = uploadFile.size;

        // Step 2: Request presigned upload URL from backend
        const presignedRes = await fetch(`${apiUrl}/api/v1/storage/presigned-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept-Language': locale,
            Authorization: `Bearer ${accessToken || ''}`,
          },
          body: JSON.stringify({
            folder,
            fileName: resolvedFileName,
            contentType,
            fileSize,
          }),
        });

        if (!presignedRes.ok) {
          throw new Error(t.storage.presignedUrlError);
        }

        const presignedData: ApiResponse<PresignedUploadResponse> = await presignedRes.json();
        const { uploadUrl, publicUrl, key, method, headers } = presignedData.data;

        // Step 3: Upload file
        if (method === 'PUT') {
          // Direct Cloudflare R2 S3 Upload
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': contentType,
              ...(headers || {}),
            },
            body: uploadFile,
          });

          if (!putRes.ok) {
            throw new Error(t.storage.uploadFailed);
          }
        } else {
          // Direct / Fallback POST Upload via base64
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(uploadFile);
          });

          const directRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept-Language': locale,
              Authorization: `Bearer ${accessToken || ''}`,
            },
            body: JSON.stringify({
              folder,
              fileName: resolvedFileName,
              contentType,
              base64Data,
            }),
          });

          if (!directRes.ok) {
            throw new Error(t.storage.uploadFailed);
          }
        }

        setProgress(100);
        onProgress?.(100);
        return { publicUrl, key, savingsPercent };
      } catch (err: any) {
        const msg = err.message || t.storage.uploadFailed;
        setError(msg);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [apiUrl, locale, t],
  );

  return {
    uploadMedia,
    isUploading,
    progress,
    error,
  };
}
