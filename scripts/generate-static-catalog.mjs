import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(new URL("..", import.meta.url).pathname);
const dataModule = await import(pathToFileURL(resolve(root, "apps/server/dist/data/games.js")));
const catalogModule = await import(pathToFileURL(resolve(root, "apps/server/dist/data/portalCatalog.js")));
const games = dataModule.games;
const publishedGames = games.filter((game) => game.status === "published").map(catalogModule.toSummary);
const slugs = publishedGames.map((game) => game.slug);
const uniqueSlugs = new Set(slugs);

if (publishedGames.length !== 164) throw new Error(`Expected 164 published games, got ${publishedGames.length}`);
if (uniqueSlugs.size !== publishedGames.length) throw new Error("Published game slugs must be unique");

const outputDirectory = resolve(root, "apps/client/public/catalog");
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, "games.json"), `${JSON.stringify(publishedGames, null, 2)}\n`);
await writeFile(resolve(outputDirectory, "categories.json"), `${JSON.stringify(catalogModule.categories, null, 2)}\n`);
console.log(`Generated static catalog: ${publishedGames.length} games, ${catalogModule.categories.length} categories`);
