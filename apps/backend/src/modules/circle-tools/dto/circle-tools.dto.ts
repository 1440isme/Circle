import {
  CreateSharedAlbumInput,
  UpdateSharedAlbumInput,
  AddPhotosInput,
  CreateWheelInput,
  CreateAnonymousPostInput,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@circle/types';

export class CreateSharedAlbumDto implements CreateSharedAlbumInput {
  albumTitle: string;
  description?: string;
}

export class UpdateSharedAlbumDto implements UpdateSharedAlbumInput {
  albumTitle?: string;
  description?: string;
}

export class AddPhotosDto implements AddPhotosInput {
  photos: {
    fileUrl: string;
    caption?: string;
    width?: number;
    height?: number;
  }[];
}

export class CreateWheelDto implements CreateWheelInput {
  title: string;
  options: {
    optionLabel: string;
    color?: string;
  }[];
}

export class CreateAnonymousPostDto implements CreateAnonymousPostInput {
  content: string;
  cardTheme?: string;
}

export class CreateCalendarEventDto implements CreateCalendarEventInput {
  eventTitle: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  reminderTime?: string;
}

export class UpdateCalendarEventDto implements UpdateCalendarEventInput {
  eventTitle?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  reminderTime?: string;
}
