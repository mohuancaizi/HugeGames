import type { CategoryItem, GameDetail, PortalApiError, PortalApiResponse, PublishedGameSummary } from "@arcade/shared";

const baseUrl = "/api/v1";
const basePath = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
const staticBaseUrl = `${basePath}catalog`;
const sorts = ["featured", "popular", "new", "updated"] as const;
export type PortalSort = typeof sorts[number];
export interface PortalGamesQuery { q?: string; category?: string; sort?: PortalSort; limit?: number; }

type CatalogPayload<T> = T[] | { data: T[]; meta?: unknown };
type StaticCatalog = { games: PublishedGameSummary[]; categories: CategoryItem[] };
let staticCatalogPromise: Promise<StaticCatalog> | null = null;

function isCatalogPayload<T>(value: unknown): value is CatalogPayload<T> {
  if (Array.isArray(value)) return true;
  return typeof value === "object" && value !== null && Array.isArray((value as { data?: unknown }).data);
}

function catalogData<T>(value: unknown, label: string): T[] {
  if (!isCatalogPayload<T>(value)) throw new Error(`静态${label}格式无效`);
  return (Array.isArray(value) ? value : value.data) as T[];
}

function normalizeLimit(value: number | undefined): number {
  return value === undefined || !Number.isFinite(value) ? 20 : Math.min(50, Math.max(1, Math.round(value)));
}

export class PortalApiRequestError extends Error {
  readonly code: string;
  readonly requestId: string;
  readonly status: number;
  constructor(error: PortalApiError, status: number) {
    super(error.message);
    this.name = "PortalApiRequestError";
    this.code = error.code;
    this.requestId = error.request_id;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function requestApi<T>(path: string): Promise<PortalApiResponse<T>> {
  let response: Response;
  try { response = await fetch(`${baseUrl}${path}`, { headers: { Accept: "application/json" } }); }
  catch { throw new PortalApiRequestError({ code: "NETWORK_ERROR", message: "网络暂时不可用，请稍后重试。", request_id: "client" }, 0); }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || !isRecord(body) || !("data" in body)) {
    const error = isRecord(body) && isRecord(body.error) ? body.error as unknown as PortalApiError : { code: "SERVER_ERROR", message: "服务暂时不可用。", request_id: "unknown" };
    throw new PortalApiRequestError(error, response.status);
  }
  return body as unknown as PortalApiResponse<T>;
}

async function loadStaticCatalog(): Promise<StaticCatalog> {
  if (!staticCatalogPromise) {
    staticCatalogPromise = Promise.all([
      fetch(`${staticBaseUrl}/games.json`, { headers: { Accept: "application/json" } }),
      fetch(`${staticBaseUrl}/categories.json`, { headers: { Accept: "application/json" } }),
    ]).then(async ([gamesResponse, categoriesResponse]) => {
      if (!gamesResponse.ok || !categoriesResponse.ok) throw new Error("静态目录文件不可用，请稍后重试。");
      const [gamesPayload, categoriesPayload] = await Promise.all([
        gamesResponse.json() as Promise<unknown>,
        categoriesResponse.json() as Promise<unknown>,
      ]);
      return {
        games: catalogData<PublishedGameSummary>(gamesPayload, "游戏目录"),
        categories: catalogData<CategoryItem>(categoriesPayload, "分类目录"),
      };
    }).catch((error) => {
      staticCatalogPromise = null;
      if (error instanceof Error && error.message.startsWith("静态")) throw error;
      throw new Error("静态目录暂时不可用，请稍后重试。");
    });
  }
  return staticCatalogPromise;
}

function staticMeta(total: number, query: PortalGamesQuery = {}): PortalApiResponse<unknown>["meta"] {
  return { total, limit: normalizeLimit(query.limit), query: query.q, category: query.category, sort: query.sort ?? "featured", request_id: "static-catalog" };
}

async function requestStatic<T>(path: string): Promise<PortalApiResponse<T>> {
  const catalog = await loadStaticCatalog();
  const url = new URL(path, "https://static-catalog.invalid");
  if (url.pathname === "/categories") return { data: catalog.categories as T, meta: staticMeta(catalog.categories.length) };
  if (url.pathname === "/games") {
    const query: PortalGamesQuery = {
      q: url.searchParams.get("q") ?? undefined,
      category: url.searchParams.get("category")?.trim().toLowerCase() || undefined,
      sort: isPortalSort(url.searchParams.get("sort")) ? url.searchParams.get("sort") as PortalSort : "featured",
      limit: url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : undefined,
    };
    let games = catalog.games.filter((game) => game.status === "published");
    const normalizedQuery = query.q?.trim().slice(0, 100).toLowerCase();
    if (normalizedQuery) games = games.filter((game) => `${game.title} ${game.short_description} ${game.slug} ${game.developer_name} ${game.tags.join(" ")}`.toLowerCase().includes(normalizedQuery));
    if (query.category) games = games.filter((game) => game.categories.some((category) => category.slug.toLowerCase() === query.category));
    if (query.sort === "featured" || query.sort === "popular") games = [...games].sort((a, b) => Number(b.featured) - Number(a.featured) || b.updated_at.localeCompare(a.updated_at));
    if (query.sort === "new" || query.sort === "updated") games = [...games].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const total = games.length;
    const limit = normalizeLimit(query.limit);
    return { data: games.slice(0, limit) as T, meta: staticMeta(total, query) };
  }
  const match = url.pathname.match(/^\/games\/([^/]+)$/);
  if (match) {
    const slug = decodeURIComponent(match[1]);
    const game = catalog.games.find((item) => item.status === "published" && item.slug === slug);
    if (game) return { data: { ...game, long_description: game.short_description, estimated_load_seconds: 5 } as T, meta: staticMeta(1) };
    throw new PortalApiRequestError({ code: "GAME_NOT_FOUND", message: "游戏不存在", request_id: "static-catalog" }, 404);
  }
  throw new PortalApiRequestError({ code: "NOT_FOUND", message: "接口不存在", request_id: "static-catalog" }, 404);
}

async function request<T>(path: string): Promise<PortalApiResponse<T>> {
  try { return await requestApi<T>(path); }
  catch {
    try { return await requestStatic<T>(path); }
    catch (staticError) {
      if (staticError instanceof Error) throw staticError;
      throw new Error("目录暂时无法加载，请稍后重试。");
    }
  }
}

function queryString(query: PortalGamesQuery): string {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim().slice(0, 100));
  if (query.category) params.set("category", query.category);
  if (query.sort && sorts.includes(query.sort)) params.set("sort", query.sort);
  if (query.limit !== undefined) params.set("limit", String(Math.min(50, Math.max(1, Math.round(query.limit)))));
  const value = params.toString();
  return value ? `?${value}` : "";
}

export function getPortalGames(query: PortalGamesQuery = {}): Promise<PortalApiResponse<PublishedGameSummary[]>> { return request(`/games${queryString(query)}`); }
export function getPortalGame(slug: string): Promise<PortalApiResponse<GameDetail>> { return request(`/games/${encodeURIComponent(slug)}`); }
export function getPortalCategories(): Promise<PortalApiResponse<CategoryItem[]>> { return request("/categories"); }
export function isPortalSort(value: string | null | undefined): value is PortalSort { return Boolean(value && sorts.includes(value as PortalSort)); }
