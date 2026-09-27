import { updateCircleSchema, UpdateCircleInput } from '@circle/shared';

export { updateCircleSchema, UpdateCircleInput };

export class UpdateCircleDto implements UpdateCircleInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  isPrivate?: boolean;
}
