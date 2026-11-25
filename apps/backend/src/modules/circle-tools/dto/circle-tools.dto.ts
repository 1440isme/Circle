import {
  CreateSharedAlbumInput,
  UpdateSharedAlbumInput,
  AddPhotosInput,
  CreateWheelInput,
  UpdateWheelInput,
  LiveSpinWheelInput,
  UpdateLiveWheelSettingsInput,
  CreateWheelFolderInput,
  UpdateWheelFolderInput,
  WheelFolderSnapshotItem,
  CreateAnonymousPostInput,
  ReactAnonymousPostInput,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  RespondEventRsvpInput,
  EventRsvpStatus,
  CreatePlanningSheetInput,
  UpdatePlanningSheetInput,
  AddSheetColumnInput,
  UpdateSheetColumnInput,
  AddSheetRowInput,
  UpdateSheetCellInput,
  StartLiveLocationInput,
  UpdateLiveLocationInput,
  CreatePollInput,
  UpdatePollInput,
  VotePollInput,
  SetMeetingPointInput,
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
  title?: string;
  options: {
    optionLabel: string;
    color?: string;
  }[];
  soundEnabled?: boolean;
  confettiEnabled?: boolean;
  initialOptions?: string[];
}

export class UpdateWheelDto implements UpdateWheelInput {
  title?: string;
  options?: {
    optionLabel: string;
    color?: string;
  }[];
  soundEnabled?: boolean;
  confettiEnabled?: boolean;
  initialOptions?: string[];
}


export class CreateWheelFolderDto implements CreateWheelFolderInput {
  name: string;
  data?: WheelFolderSnapshotItem[];
}

export class UpdateWheelFolderDto implements UpdateWheelFolderInput {
  name?: string;
  data?: WheelFolderSnapshotItem[];
}

export class ShareWheelResultsDto {
  results: { wheelTitle: string; winner: string }[];
}

export class LiveSpinWheelDto implements LiveSpinWheelInput {
  wheelId?: string;
  title?: string;
  options?: string[];
  channelId?: string;
  isAll?: boolean;
}

export class UpdateLiveWheelSettingsDto implements UpdateLiveWheelSettingsInput {
  allowMembersToEdit?: boolean;
  newHostUserId?: string;
}

export class CreateAnonymousPostDto implements CreateAnonymousPostInput {
  content: string;
  cardTheme?: string;
}

export class ReactAnonymousPostDto implements ReactAnonymousPostInput {
  emoji: string;
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
  isCancelled?: boolean;
}

export class RespondEventRsvpDto implements RespondEventRsvpInput {
  status: EventRsvpStatus;
}

// =============================================================================
// 5. COLLABORATIVE PLANNING SHEET (UC18)
// =============================================================================

export class CreatePlanningSheetDto implements CreatePlanningSheetInput {
  title: string;
  templateType?: string;
  columns?: Array<string | { columnTitle: string; columnType?: string; columnConfig?: Record<string, unknown> }>;
  initialRows?: Array<Record<string | number, string>>;
  initialRowCount?: number;
  metadata?: Record<string, unknown>;
}

export class UpdatePlanningSheetDto implements UpdatePlanningSheetInput {
  title?: string;
  metadata?: Record<string, unknown>;
}

export class AddSheetColumnDto implements AddSheetColumnInput {
  columnTitle: string;
  columnType?: string;
  columnConfig?: Record<string, unknown>;
}

export class UpdateSheetColumnDto implements UpdateSheetColumnInput {
  columnTitle?: string;
  columnType?: string;
  columnConfig?: Record<string, unknown>;
}

export class AddSheetRowDto implements AddSheetRowInput {
  cellValues?: Record<string, string>;
}

export class UpdateSheetCellDto implements UpdateSheetCellInput {
  cellValue: string;
}

export class SharePlanningSheetDto {
  channelId?: string;
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

export class SetMeetingPointDto implements SetMeetingPointInput {
  title: string;
  latitude: number;
  longitude: number;
  address?: string;
}

// =============================================================================
// 7. GROUP POLL (UC15)
// =============================================================================

export class CreatePollDto implements CreatePollInput {
  question: string;
  options: string[];
  deadline?: string;
  isMultipleChoice?: boolean;
  isAnonymous?: boolean;
}

export class UpdatePollDto implements UpdatePollInput {
  isMultipleChoice?: boolean;
  question?: string;
  options?: string[];
  deadline?: string | null;
}

export class VotePollDto implements VotePollInput {
  optionId?: string;
  optionIds?: string[];
}

