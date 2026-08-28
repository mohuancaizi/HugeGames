import type { CategoryItem, GameDetail, PortalApiError, PortalApiResponse, PublishedGameSummary } from "@arcade/shared";

const baseUrl = "/api/v1";
const sorts = ["featured", "popular", "new", "updated"] as const;
export type PortalSort = typeof sorts[number];
export interface PortalGamesQuery { q?: string; category?: string; sort?: PortalSort; limit?: number; }

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

async function request<T>(path: string): Promise<PortalApiResponse<T>> {
  let response: Response;
  try { response = await fetch(`${baseUrl}${path}`, { headers: { Accept: "application/json" } }); }
  catch { throw new PortalApiRequestError({ code: "NETWORK_ERROR", message: "网络暂时不可用，请稍后重试。", request_id: "client" }, 0); }
  const body = await response.json().catch(() => null) as PortalApiResponse<T> | { error?: PortalApiError } | null;
  if (!response.ok || !body || !("data" in body)) {
    const error = body && "error" in body && body.error ? body.error : { code: "SERVER_ERROR", message: "服务暂时不可用。", request_id: "unknown" };
    throw new PortalApiRequestError(error, response.status);
  }
  return body;
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
