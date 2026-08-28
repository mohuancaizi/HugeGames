import "dotenv/config";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { CategoryItem, ErrorResponse, GameDetail, GamesResponse, HealthResponse, PortalApiErrorResponse, PortalApiMeta, PortalApiResponse, PublishedGameSummary } from "@arcade/shared";
import { games } from "./data/games.js";
import { categories, toDetail, toSummary } from "./data/portalCatalog.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const sortValues = ["featured", "popular", "new", "updated"] as const;
type PortalSort = typeof sortValues[number];
type PortalQuery = { q?: string; category?: string; sort?: PortalSort; limit?: string };

function requestId(): string { return `portal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function meta(total: number, id: string, query: PortalQuery = {}): PortalApiMeta { return { total, limit: query.limit ? Number(query.limit) : undefined, query: query.q, category: query.category, sort: query.sort, request_id: id }; }
function portalError(reply: { code: (status: number) => { send: (body: PortalApiErrorResponse) => unknown } }, status: number, code: string, message: string, id: string): unknown {
  return reply.code(status).send({ error: { code, message, request_id: id } });
}

export function buildServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: clientOrigin });

  app.get<{ Reply: HealthResponse }>("/api/health", async () => ({ status: "ok", service: "arcade-server", timestamp: new Date().toISOString() }));
  app.get<{ Reply: GamesResponse }>("/api/games", async () => ({ data: games, total: games.length }));
  app.get<{ Params: { slug: string }; Reply: typeof games[number] | ErrorResponse }>("/api/games/:slug", async (request, reply) => {
    const game = games.find((item) => item.slug === request.params.slug);
    if (!game) return reply.code(404).send({ error: "NOT_FOUND", message: "Game not found" });
    return game;
  });

  app.get("/api/v1/health", async () => ({ data: { status: "ok", service: "arcade-server", timestamp: new Date().toISOString() }, meta: meta(1, requestId()) } satisfies PortalApiResponse<HealthResponse>));
  app.get("/api/v1/categories", async () => ({ data: categories, meta: meta(categories.length, requestId()) } satisfies PortalApiResponse<CategoryItem[]>));
  app.get<{ Querystring: PortalQuery }>("/api/v1/games", async (request, reply) => {
    const id = requestId();
    const query = request.query;
    if (query.sort && !sortValues.includes(query.sort)) return portalError(reply, 400, "INVALID_SORT", "sort 必须是 featured、popular、new 或 updated", id);
    const limit = query.limit ? Number(query.limit) : 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 164) return portalError(reply, 400, "INVALID_LIMIT", "limit 必须是 1 到 164 之间的整数", id);
    let result = games.filter((game) => game.status === "published");
    if (query.q) { const q = query.q.slice(0, 100).toLowerCase(); result = result.filter((game) => `${game.title} ${game.description} ${game.tags?.join(" ") ?? ""}`.toLowerCase().includes(q)); }
    if (query.category) result = result.filter((game) => game.category.toLowerCase() === query.category?.toLowerCase());
    const sort = query.sort ?? "featured";
    if (sort === "featured") result = [...result].sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
    if (sort === "new" || sort === "updated") result = [...result].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    const data = result.slice(0, limit).map(toSummary);
    return { data, meta: meta(result.length, id, { ...query, limit: String(limit) }) } satisfies PortalApiResponse<PublishedGameSummary[]>;
  });
  app.get<{ Params: { slug: string } }>("/api/v1/games/:slug", async (request, reply) => {
    const id = requestId();
    const game = games.find((item) => item.slug === request.params.slug);
    if (!game || game.status === "draft" || game.status === "archived") return portalError(reply, 404, "GAME_NOT_FOUND", "游戏不存在", id);
    if (game.status !== "published") return portalError(reply, 409, "GAME_UNAVAILABLE", "游戏当前不可用", id);
    return { data: toDetail(game), meta: meta(1, id) } satisfies PortalApiResponse<GameDetail>;
  });

  app.setNotFoundHandler((request, reply) => {
    const id = requestId();
    if (request.url.startsWith("/api/v1/")) return portalError(reply, 404, "NOT_FOUND", "接口不存在", id);
    return reply.code(404).send({ error: "NOT_FOUND", message: "Route not found" });
  });

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    if (request.url.startsWith("/api/v1/")) return portalError(reply, 500, "INTERNAL_ERROR", "服务暂时不可用", requestId());
    const statusCode = error instanceof Error && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    return reply.code(statusCode >= 400 ? statusCode : 500).send({ error: "INTERNAL_ERROR", message: "Something went wrong" });
  });

  return app;
}

const app = buildServer();
const start = async (): Promise<void> => { try { await app.listen({ port, host }); } catch (error) { app.log.error(error); process.exit(1); } };
const close = async (signal: string): Promise<void> => { app.log.info(`${signal} received, closing server`); await app.close(); process.exit(0); };
process.once("SIGINT", () => void close("SIGINT"));
process.once("SIGTERM", () => void close("SIGTERM"));
void start();
