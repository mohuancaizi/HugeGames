export const GAME_CATEGORIES = ["All", "Action", "Puzzle", "Strategy", "Arcade"] as const;

export type GameCategory = Exclude<(typeof GAME_CATEGORIES)[number], "All">;

export type GameStatus = "draft" | "review" | "rejected" | "published" | "paused" | "archived";
export type GameLaunchMode = "same-origin" | "iframe" | "new-window";
export type LaunchMode = GameLaunchMode;
export type GameOrientation = "any" | "portrait" | "landscape";
export type GameDeviceSupport = "desktop" | "mobile" | "tablet" | "all";
export type GameLaunchState = "requested" | "validating" | "preparing" | "loading" | "ready" | "running" | "blocked" | "paused" | "failed" | "offline";

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface PublishedGameSummary {
  id?: string;
  slug: string;
  title: string;
  short_description: string;
  primary_category_id: string;
  categories: CategoryItem[];
  tags: string[];
  status: GameStatus;
  default_locale: string;
  supported_locales: string[];
  orientation: GameOrientation;
  input_modes: string[];
  device_support?: GameDeviceSupport[];
  age_rating: "all" | "teen" | "adult";
  launch_mode: GameLaunchMode;
  release_id: string | null;
  developer_name: string;
  cover_url: string | null;
  icon_url: string | null;
  updated_at: string;
  featured: boolean;
  accent?: string;
  legacy_icon?: string;
  players?: string;
}

export interface GameDetail extends PublishedGameSummary {
  long_description?: string;
  copyright_notice?: string;
  third_party_notice?: string;
  complaint_url?: string;
  launch_url?: string | null;
  estimated_load_seconds?: number;
}

export interface PortalPageMeta {
  title: string;
  description: string;
  canonical?: string;
  robots?: string;
}

export interface PortalApiError {
  code: string;
  message: string;
  request_id: string;
  details?: Record<string, unknown>;
}

export interface PortalApiMeta {
  total: number;
  limit?: number;
  query?: string;
  category?: string;
  sort?: string;
  request_id: string;
  [key: string]: unknown;
}

export interface PortalApiResponse<T> {
  data: T;
  meta: PortalApiMeta;
}

export interface PortalApiErrorResponse {
  error: PortalApiError;
}

export interface PagedResponse<T> {
  data: T[];
  total: number;
  next_cursor?: string | null;
  request_id?: string;
}

export interface ApiError {
  code: string;
  message: string;
  request_id?: string;
  details?: Record<string, unknown>;
}

export interface GameLaunchStateResponse {
  state: GameLaunchState;
  game_id: string;
  release_id: string;
  launch_mode: GameLaunchMode;
  launch_url?: string;
  allowed_origin?: string;
  sandbox?: string;
  message?: string;
  request_id?: string;
}

export interface GameInfo {
  slug: string;
  title: string;
  description: string;
  category: GameCategory;
  icon: string;
  accent: string;
  players: string;
  featured?: boolean;
  status?: GameStatus;
  developerName?: string;
  supportedLocales?: string[];
  orientation?: GameOrientation;
  inputModes?: string[];
  deviceSupport?: GameDeviceSupport[];
  launchMode?: GameLaunchMode;
  tags?: string[];
  updatedAt?: string;
  short_description?: string;
  developer_name?: string;
  supported_locales?: string[];
  input_modes?: string[];
  device_support?: GameDeviceSupport[];
  launch_mode?: GameLaunchMode;
  updated_at?: string;
}

export interface GamesResponse {
  data: GameInfo[];
  total: number;
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
