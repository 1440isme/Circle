import { StorageFolder, PresignedUploadResponse } from '@circle/types';
import { mobileApiRequest } from './api';

export interface MobileUploadOptions {
  folder: StorageFolder;
  uri?: string;
  base64?: string;
  fileName?: string;
  contentType?: string;
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
    return { publicUrl: uri, key: uri };
  }

  // Try direct backend upload fallback with base64 for maximum mobile reliability
  let base64Payload = base64;
  if (!base64Payload && uri && uri.startsWith('data:')) {
    base64Payload = uri.replace(/^data:[^;]+;base64,/, '');
  }

  if (base64Payload) {
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
      return { publicUrl: res.data.publicUrl, key: res.data.key };
    }
  }

  // Fallback: Presigned URL request
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
    // Binary upload from URI
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
  }

  return { publicUrl, key };
}
