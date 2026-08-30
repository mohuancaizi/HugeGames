import type {
  CategoryItem,
  GameDetail,
  GameInfo,
  GameLaunchStateResponse,
  GamesResponse,
  HealthResponse,
  PagedResponse,
  PublishedGameSummary,
} from "@arcade/shared";
import { getPortalCategories as getStaticCapableCategories, getPortalGames as getStaticCapableGames } from "./portalApi";

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VERSION_CONFLICT"
  | "VALIDATION_ERROR"
  | "INSUFFICIENT_RESOURCE"
  | "OFFLINE_NOT_ALLOWED"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  request_id?: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccess<T> { data: T; request_id?: string; }

export class ApiRequestError extends Error {
  readonly code: ApiErrorCode;
  readonly request_id?: string;
  readonly details?: Record<string, unknown>;
  constructor(body: ApiErrorBody, status?: number) {
    super(body.message || `Request failed with status ${status ?? "unknown"}`);
    this.name = "ApiRequestError";
    this.code = body.code;
    this.request_id = body.request_id;
    this.details = body.details;
  }
}

export interface SnapshotRef { snapshot_version: number; content_version: string; ruleset_version: string; }
export interface WriteRequest { idempotency_key: string; expected_snapshot_version?: number; }
export interface BattleStartInput extends WriteRequest { stage_id: string; formation_id: string; }
export interface FormationSaveInput extends WriteRequest { formation_id: string; card_ids: string[]; }
export interface CardUpgradeInput extends WriteRequest { card_id: string; }
export interface SummonCreateInput extends WriteRequest { summon_pool_id: string; count: 1 | 10; }
export interface TaskClaimInput extends WriteRequest { task_id: string; }
export interface IdleRewardClaimInput extends WriteRequest { claim_id?: string; }

const apiBaseUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1").replace(/\/$/, "");
const legacyApiBaseUrl = "/api";

function mapErrorCode(status: number, body: Partial<ApiErrorBody> | null): ApiErrorCode {
  if (body?.code) return body.code;
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

async function requestAt<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
  } catch {
    throw new ApiRequestError({ code: "NETWORK_ERROR", message: "网络不可用，当前操作未提交。" });
  }
  const body = (await response.json().catch(() => null)) as (Partial<ApiSuccess<T>> & Partial<ApiErrorBody> & { error?: string }) | null;
  if (!response.ok) throw new ApiRequestError({ code: mapErrorCode(response.status, body), message: body?.message ?? body?.error ?? "服务暂时不可用。", request_id: body?.request_id, details: body?.details }, response.status);
  if (body && "data" in body) return body.data as T;
  return body as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> { return requestAt<T>(apiBaseUrl, path, options); }
function write<T>(path: string, input: WriteRequest & Record<string, unknown>): Promise<T> {
  const { idempotency_key, expected_snapshot_version, ...payload } = input;
  return request<T>(path, { method: "POST", headers: { "Idempotency-Key": idempotency_key }, body: JSON.stringify({ ...payload, ...(expected_snapshot_version === undefined ? {} : { expected_snapshot_version }) }) });
}

const categoryDefinitions: CategoryItem[] = [
  ["action", "动作", "即时反应与节奏挑战"], ["adventure", "冒险", "探索原创世界与故事"], ["casual", "休闲", "随时开始的轻松体验"], ["puzzle", "益智", "动脑解题与逻辑挑战"], ["simulation", "模拟", "经营与构建你的日常"], ["strategy", "策略", "规划资源与每一步选择"], ["music", "音乐", "跟随节拍完成挑战"], ["card", "卡牌", "组合卡组与策略选择"], ["board", "桌游", "经典规则的数字体验"], ["tower-defense", "塔防", "布置防线守护目标"], ["arcade", "街机", "短局高分与反应挑战"], ["dress-up", "装扮", "搭配风格与创意造型"], ["parkour", "跑酷", "连续动作与路线选择"], ["merge", "合成", "合并物件解锁新发现"], ["platformer", "闯关", "跳跃、机关与关卡探索"], ["management", "经营", "规划资源并持续发展"], ["multiplayer-io", "多人 / IO", "与其他玩家共享空间"],
].map(([slug, name, description], index) => ({ id: `category-${slug}`, slug, name, description, sort_order: index }));

const legacyCopy: Record<string, { title: string; short_description: string; category: string; accent: string }> = {
  "neon-drift": { title: "霓虹漂移", short_description: "在不断变化的光轨中保持节奏，躲开迎面而来的能量障碍。", category: "action", accent: "#ff6b55" },
  "orbit-architect": { title: "轨道筑境", short_description: "搭建一座运转平衡的微型星系，让每个世界找到自己的轨道。", category: "simulation", accent: "#58c9a5" },
  wordsmith: { title: "字谜工坊", short_description: "连接词语、寻找巧思，在倒计时结束前完成你的文字路线。", category: "puzzle", accent: "#f3b84b" },
  "pixel-punch": { title: "像素擂台", short_description: "在快节奏的像素竞技场中见招拆招，把握每一次出拳。", category: "arcade", accent: "#9b7bff" },
  "tiny-trails": { title: "微光小径", short_description: "穿过一座座微缩世界，画出不重复的路线并点亮终点。", category: "puzzle", accent: "#4ca8e8" },
  "last-light": { title: "终夜灯塔", short_description: "守住远方信号塔的最后一夜，在黑暗靠近前点亮希望。", category: "adventure", accent: "#e978ad" },
};

function toPublishedGame(game: GameInfo): PublishedGameSummary {
  const copy = legacyCopy[game.slug] ?? { title: game.title, short_description: game.description, category: "casual", accent: game.accent };
  const category = categoryDefinitions.find((item) => item.slug === copy.category) ?? categoryDefinitions[0];
  return { id: `legacy-${game.slug}`, slug: game.slug, title: copy.title, short_description: copy.short_description, primary_category_id: category.id, categories: [category], tags: game.category === "Action" ? ["反应", "短局"] : ["单人", "轻量"], status: "published", default_locale: "zh-CN", supported_locales: ["zh-CN"], orientation: "portrait", input_modes: ["touch", "keyboard"], age_rating: "all", launch_mode: game.slug === "neon-drift" ? "same-origin" : "iframe", release_id: null, developer_name: "星屿自制组", cover_url: null, icon_url: null, updated_at: "2026-08-25T00:00:00.000Z", featured: game.featured ?? false, accent: copy.accent, legacy_icon: game.icon, players: game.players };
}
function toDetail(game: PublishedGameSummary): GameDetail { return { ...game, long_description: game.short_description, copyright_notice: "本页面展示内容为平台自制原型适配数据。", third_party_notice: "当前旧接口未提供可验证启动配置，门户不会伪造启动票据。", complaint_url: "/zh/about#complaints", estimated_load_seconds: 8 }; }
async function getLegacyGames(): Promise<PublishedGameSummary[]> { const response = await requestAt<GamesResponse>(legacyApiBaseUrl, "/games"); return response.data.map(toPublishedGame); }

export interface PortalGamesQuery { category?: string; sort?: "recommended" | "popular" | "newest" | "updated"; cursor?: string; limit?: number; favorites?: boolean; }
export interface CatalogHome { featured: PublishedGameSummary[]; popular: PublishedGameSummary[]; new_games: PublishedGameSummary[]; editor_picks: PublishedGameSummary[]; recent: PublishedGameSummary[]; categories: CategoryItem[]; legacy_fallback: boolean; }
function buildQuery(query: PortalGamesQuery | Record<string, string | number | boolean | undefined>): string { const params = new URLSearchParams(); Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); }); const result = params.toString(); return result ? `?${result}` : ""; }

export const getGames = (): Promise<GameInfo[]> => requestAt<GameInfo[]>(legacyApiBaseUrl, "/games");
export const getHealth = (): Promise<HealthResponse> => request<HealthResponse>("/health");
export const getGame = (slug: string): Promise<GameInfo> => requestAt<GameInfo>(legacyApiBaseUrl, `/games/${slug}`);

export async function getPortalGames(query: PortalGamesQuery = {}): Promise<PagedResponse<PublishedGameSummary>> {
  try {
    const data = await request<PublishedGameSummary[]>(`/games${buildQuery(query)}`);
    return { data, total: data.length, next_cursor: null };
  } catch {
    const sort = query.sort === "recommended" ? "featured" : query.sort === "newest" ? "new" : query.sort;
    const result = await getStaticCapableGames({ category: query.category, sort, limit: query.limit });
    return { data: result.data, total: result.meta.total, next_cursor: null };
  }
}
export async function getCategories(): Promise<CategoryItem[]> {
  try { return await request<CategoryItem[]>("/categories"); } catch { return (await getStaticCapableCategories()).data; }
}
export async function getCategoryGames(slug: string, query: PortalGamesQuery = {}): Promise<PagedResponse<PublishedGameSummary>> { try { return await request<PagedResponse<PublishedGameSummary>>(`/categories/${encodeURIComponent(slug)}/games${buildQuery(query)}`); } catch (error) { if (!(error instanceof ApiRequestError) || error.code !== "NOT_FOUND") throw error; return getPortalGames({ ...query, category: slug }); } }
export async function searchPortalGames(q: string): Promise<PagedResponse<PublishedGameSummary>> { try { return await request<PagedResponse<PublishedGameSummary>>(`/search${buildQuery({ q: q.slice(0, 100), limit: 50 })}`); } catch (error) { if (!(error instanceof ApiRequestError) || error.code !== "NOT_FOUND") throw error; const normalized = q.trim().toLowerCase(); const data = (await getLegacyGames()).filter((game) => `${game.title} ${game.short_description} ${game.slug} ${game.tags.join(" ")}`.toLowerCase().includes(normalized)); return { data, total: data.length, next_cursor: null }; } }
export async function getPortalGame(slug: string): Promise<GameDetail> { try { return await request<GameDetail>(`/games/${encodeURIComponent(slug)}`); } catch (error) { if (!(error instanceof ApiRequestError) || error.code !== "NOT_FOUND") throw error; const game = (await getLegacyGames()).find((item) => item.slug === slug); if (!game) throw error; return toDetail(game); } }
export async function getCatalogHome(): Promise<CatalogHome> {
  try { return await request<CatalogHome>("/catalog/home?locale=zh-CN"); } catch {
    try {
      const [gamesResult, categoriesResult] = await Promise.all([
        getStaticCapableGames({ limit: 50 }),
        getStaticCapableCategories(),
      ]);
      const data = gamesResult.data;
      return { featured: data.filter((game) => game.featured), popular: data, new_games: [...data].sort((a, b) => b.updated_at.localeCompare(a.updated_at)), editor_picks: data.filter((game) => game.featured).slice(0, 3), recent: [], categories: categoriesResult.data, legacy_fallback: false };
    } catch {
      const data = await getLegacyGames();
      return { featured: data.filter((game) => game.featured), popular: data, new_games: [...data].reverse(), editor_picks: data.slice(0, 3), recent: [], categories: categoryDefinitions, legacy_fallback: true };
    }
  }
}
export async function requestGameLaunch(slug: string): Promise<GameLaunchStateResponse> { try { return await request<GameLaunchStateResponse>(`/games/${encodeURIComponent(slug)}/launches`, { method: "POST", body: JSON.stringify({}) }); } catch (error) { if (error instanceof ApiRequestError && error.code === "NOT_FOUND") return { state: "blocked", game_id: `legacy-${slug}`, release_id: "", launch_mode: "same-origin", message: "当前服务端尚未提供启动票据，原型游戏不会在门户中伪造启动成功。" }; throw error; } }
export async function sendAnalyticsEvents(events: Record<string, unknown>[]): Promise<void> { try { await request<unknown>("/analytics/events", { method: "POST", body: JSON.stringify({ events }) }); } catch (error) { if (!(error instanceof ApiRequestError) || error.code !== "NOT_FOUND") throw error; } }

export const getPlayerSnapshot = (): Promise<unknown> => request<unknown>("/player/snapshot");
export const getAdventureContent = (): Promise<unknown> => request<unknown>("/content/adventure");
export const getCards = (): Promise<unknown> => request<unknown>("/player/cards");
export const getTasks = (): Promise<unknown> => request<unknown>("/player/tasks");
export const getIdleRewardPreview = (): Promise<unknown> => request<unknown>("/player/idle-rewards/preview");
export const startBattle = (input: BattleStartInput): Promise<unknown> => write<unknown>("/battles", input as BattleStartInput & Record<string, unknown>);
export const settleBattle = (battle_id: string, input: WriteRequest): Promise<unknown> => write<unknown>(`/battles/${battle_id}/settle`, input as WriteRequest & Record<string, unknown>);
export const saveFormation = (input: FormationSaveInput): Promise<unknown> => write<unknown>("/formations", input as FormationSaveInput & Record<string, unknown>);
export const upgradeCard = (input: CardUpgradeInput): Promise<unknown> => write<unknown>(`/cards/${input.card_id}/upgrade`, input as CardUpgradeInput & Record<string, unknown>);
export const createSummon = (input: SummonCreateInput): Promise<unknown> => write<unknown>("/summons", input as SummonCreateInput & Record<string, unknown>);
export const getSummonResult = (request_id: string): Promise<unknown> => request<unknown>(`/summons/${request_id}`);
export const claimTask = (input: TaskClaimInput): Promise<unknown> => write<unknown>(`/tasks/${input.task_id}/claim`, input as TaskClaimInput & Record<string, unknown>);
export const claimIdleReward = (input: IdleRewardClaimInput): Promise<unknown> => write<unknown>("/idle-rewards/claim", input as IdleRewardClaimInput & Record<string, unknown>);
