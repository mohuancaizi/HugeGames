import type { CategoryItem, GameDetail, GameInfo, PublishedGameSummary } from "@arcade/shared";

export const categories: CategoryItem[] = [
  { id: "action", slug: "action", name: "动作", description: "即时反应与节奏挑战", sort_order: 0 },
  { id: "puzzle", slug: "puzzle", name: "益智", description: "动脑解题与逻辑挑战", sort_order: 1 },
  { id: "strategy", slug: "strategy", name: "策略", description: "规划资源，建立自己的节奏", sort_order: 2 },
  { id: "arcade", slug: "arcade", name: "街机", description: "短局高分与反应挑战", sort_order: 3 },
];

const categoryByGameCategory: Record<string, CategoryItem> = {
  Action: categories[0],
  Puzzle: categories[1],
  Strategy: categories[2],
  Arcade: categories[3],
};

export function toSummary(game: GameInfo): PublishedGameSummary {
  const category = categoryByGameCategory[game.category] ?? categories[0];
  return {
    id: `static-${game.slug}`, slug: game.slug, title: game.title, short_description: game.short_description ?? game.description,
    primary_category_id: category.id, categories: [category], tags: game.tags ?? [], status: game.status ?? "published",
    default_locale: "zh-CN", supported_locales: game.supportedLocales ?? ["zh-CN"], orientation: game.orientation ?? "any",
    input_modes: game.inputModes ?? [], device_support: game.deviceSupport ?? ["all"], age_rating: "all",
    launch_mode: game.launchMode ?? "iframe", release_id: null, developer_name: game.developerName ?? "星屿自制组",
    cover_url: null, icon_url: null, updated_at: game.updatedAt ?? new Date(0).toISOString(), featured: game.featured ?? false,
    accent: game.accent, legacy_icon: game.icon, players: game.players,
  };
}

export function toDetail(game: GameInfo): GameDetail {
  return { ...toSummary(game), long_description: game.description, estimated_load_seconds: 5 };
}
