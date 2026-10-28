import {
  CreateSharedAlbumInput,
  UpdateSharedAlbumInput,
  AddPhotosInput,
  CreateWheelInput,
  CreateAnonymousPostInput,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CreatePlanningSheetInput,
  AddSheetColumnInput,
  AddSheetRowInput,
  UpdateSheetCellInput,
  StartLiveLocationInput,
  UpdateLiveLocationInput,
  CreatePollInput,
  VotePollInput,
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

// =============================================================================
// 5. COLLABORATIVE PLANNING SHEET (UC18)
// =============================================================================

export class CreatePlanningSheetDto implements CreatePlanningSheetInput {
  title: string;
  columns?: string[];
  initialRowCount?: number;
}

export class AddSheetColumnDto implements AddSheetColumnInput {
  columnTitle: string;
}

export class AddSheetRowDto implements AddSheetRowInput {
  cellValues?: Record<string, string>;
}

export class UpdateSheetCellDto implements UpdateSheetCellInput {
  cellValue: string;
}

// =============================================================================
// 6. LIVE LOCATION SHARING (UC19)
// =============================================================================

export class StartLiveLocationDto implements StartLiveLocationInput {
  latitude: number;
  longitude: number;
  shareDuration: number;
}

export class UpdateLiveLocationDto implements UpdateLiveLocationInput {
  latitude: number;
  longitude: number;
}

// =============================================================================
// 7. GROUP POLL (UC15)
// =============================================================================

export class CreatePollDto implements CreatePollInput {
  question: string;
  options: string[];
  deadline?: string;
}

export class VotePollDto implements VotePollInput {
  optionId: string;
}

