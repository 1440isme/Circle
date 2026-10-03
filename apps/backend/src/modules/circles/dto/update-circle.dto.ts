import { updateCircleSchema, UpdateCircleInput } from '@circle/shared';

export { updateCircleSchema, UpdateCircleInput };

export class UpdateCircleDto implements UpdateCircleInput {
  name?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
}
