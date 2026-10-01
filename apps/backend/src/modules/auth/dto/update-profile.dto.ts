import { UpdateProfileInput } from '@circle/shared';

export class UpdateProfileDto implements UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  coverUrl?: string | null;
  dateOfBirth?: string | null;
}
