import { createCircleSchema, CreateCircleInput } from '@circle/shared';

export { createCircleSchema, CreateCircleInput };

export class CreateCircleDto implements CreateCircleInput {
  name: string;
  handle: string;
  avatarUrl?: string;
  isPrivate: boolean;
}
