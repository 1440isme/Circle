import { UpdateProfileInput } from '@circle/shared';

export class UpdateProfileDto implements UpdateProfileInput {
  handle?: string | null;
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
}
