import { createCircleSchema, CreateCircleInput } from '@circle/shared';

export { createCircleSchema, CreateCircleInput };

export class CreateCircleDto implements CreateCircleInput {
  name: string;
  handle: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  isPrivate: boolean;
}
