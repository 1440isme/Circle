import { PresignedUploadInput, DirectUploadInput } from '@circle/shared';
import { StorageFolder } from '@circle/types';

export class PresignedUploadDto implements PresignedUploadInput {
  folder!: StorageFolder;
  fileName!: string;
  contentType!: string;
  fileSize?: number;
}

export class DirectUploadDto implements DirectUploadInput {
  folder!: StorageFolder;
  fileName!: string;
  contentType!: string;
  base64Data!: string;
}
