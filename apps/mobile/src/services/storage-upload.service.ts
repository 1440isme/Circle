import { StorageFolder, PresignedUploadResponse } from '@circle/types';
import { mobileApiRequest, getApiBaseUrl } from './api';

export interface MobileUploadOptions {
  folder: StorageFolder;
  uri?: string;
  base64?: string;
  fileName?: string;
  contentType?: string;
}

function resolveMobilePublicUrl(url: string): string {
  if (!url) return url;
  if (url.includes('localhost:4000') || url.includes('127.0.0.1:4000')) {
    const mobileBase = getApiBaseUrl().replace(/\/api\/v1\/?$/, '');
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1):4000/, mobileBase);
  }
  return url;
}

export async function uploadMobileMedia({
  folder,
  uri,
  base64,
  fileName,
  contentType = 'image/jpeg',
}: MobileUploadOptions): Promise<{ publicUrl: string; key: string }> {
  const resolvedFileName =
    fileName || `mobile_${folder}_${Date.now()}.${contentType.includes('png') ? 'png' : 'jpg'}`;

  // If already an HTTP/HTTPS URL, return directly
  if (uri && (uri.startsWith('http://') || uri.startsWith('https://'))) {
    return { publicUrl: resolveMobilePublicUrl(uri), key: uri };
  }

  // 1. Resolve base64 payload
  let base64Payload = base64;
  if (!base64Payload && uri && uri.startsWith('data:')) {
    base64Payload = uri.replace(/^data:[^;]+;base64,/, '');
  }

  // If still no base64 and we have a local file:// uri, convert blob to base64 for reliable transfer
  if (!base64Payload && uri) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      base64Payload = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = (reader.result as string) || '';
          resolve(result.replace(/^data:[^;]+;base64,/, ''));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('Fallback base64 conversion error:', err);
    }
  }

  // 2. Direct upload via backend /storage/upload (100% reliable for both Local Dev & Production)
  if (base64Payload) {
    try {
      const res = await mobileApiRequest<any>('/storage/upload', {
        method: 'POST',
        body: JSON.stringify({
          folder,
          fileName: resolvedFileName,
          contentType,
          base64Data: base64Payload,
        }),
      });

      if (res?.data?.publicUrl) {
        return { publicUrl: resolveMobilePublicUrl(res.data.publicUrl), key: res.data.key };
      }
    } catch (err) {
      console.warn('Direct upload error, falling back to presigned URL:', err);
    }
  }

  // 3. Fallback: Presigned URL request
  const presignedRes = await mobileApiRequest<PresignedUploadResponse>('/storage/presigned-url', {
    method: 'POST',
    body: JSON.stringify({
      folder,
      fileName: resolvedFileName,
      contentType,
    }),
  });

  if (!presignedRes?.data?.uploadUrl) {
    throw new Error('Failed to obtain upload URL');
  }

  const { uploadUrl, publicUrl, key, method } = presignedRes.data;

  if (method === 'PUT' && uri) {
    const response = await fetch(uri);
    const blob = await response.blob();

    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });

    if (!putRes.ok) {
      throw new Error(`Direct upload failed with status ${putRes.status}`);
    }
  } else if (method === 'POST' && base64Payload) {
    await mobileApiRequest<any>(uploadUrl, {
      method: 'POST',
      body: JSON.stringify({
        folder,
        fileName: resolvedFileName,
        contentType,
        base64Data: base64Payload,
      }),
    });
  }

  return { publicUrl, key };
}
