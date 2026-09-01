import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { funGameSlugs, funGameSpecs, validateFunGameSpecs } from "../apps/client/src/data/funGameSpecs";
import { kidsGameSlugs, kidsGameSpecs, validateKidsGameSpecs } from "../apps/client/src/data/kidsGameSpecs";
import { createSlidingPuzzleEngine } from "../apps/client/src/games/engines/puzzleEngine";
import { advanceElapsed, clamp, circlesCollide, isOrthogonalNeighbor, moveOnGrid, pipeConnected, rectanglesCollide, toggleCross } from "../apps/client/src/games/engines/utils";

const errors = [
  ...validateFunGameSpecs(funGameSpecs),
  ...validateKidsGameSpecs(kidsGameSpecs),
];

assert.equal(clamp(-2, 0, 10), 0);
assert.equal(clamp(12, 0, 10), 10);
assert.equal(clamp(4, 0, 10), 4);
assert.equal(circlesCollide({ x: 0, y: 0, radius: 3 }, { x: 5, y: 0, radius: 2 }), true);
assert.equal(rectanglesCollide({ x: 0, y: 0, width: 4, height: 4 }, { x: 3, y: 3, width: 2, height: 2 }), true);
assert.equal(isOrthogonalNeighbor(1, 2, 3, 9), true);
assert.equal(isOrthogonalNeighbor(2, 5, 3, 9), true);
assert.equal(isOrthogonalNeighbor(2, 6, 3, 9), false);
assert.deepEqual(moveOnGrid({ row: 0, column: 0 }, { row: -1, column: 0 }, 3, 3), null);
assert.deepEqual(toggleCross([0, 0, 0, 0, 0], 0, 5), [1, 1, 0, 0, 0]);
assert.equal(advanceElapsed(3, 2, true), 3);
assert.equal(advanceElapsed(3, 2, false), 5);
assert.equal(pipeConnected([
  { rotation: 0, ports: [1, 3] },
  { rotation: 0, ports: [1, 3] },
  { rotation: 0, ports: [1, 3] },
], 3, 0, 2), true);
const puzzle = createSlidingPuzzleEngine();
const initialPuzzle = puzzle.initialState();
const invalidMove = puzzle.reduce(initialPuzzle, { type: "move", index: 0 });
assert.equal(invalidMove.state.moves, 0);
const movedPuzzle = puzzle.reduce(initialPuzzle, { type: "move", index: 7 });
assert.equal(movedPuzzle.state.moves, 1);

if (funGameSlugs.length !== 8) errors.push(`expected 8 fun games, got ${funGameSlugs.length}`);
if (kidsGameSlugs.length !== Object.keys(kidsGameSpecs).length) errors.push("every kids slug must have a spec");

async function main(): Promise<void> {
  const router = await readFile(new URL("../apps/client/src/router/index.ts", import.meta.url), "utf8");
  const gameRoutes = [...router.matchAll(/path: \"\/games\/([^\"]+)\"/g)].map((match) => match[1]);
  const miniRoutes = [...router.matchAll(/path: \"\/games\/([^\"]+)\", name: \"([^\"]+)\", component: MiniGameView/g)].map((match) => match[1]);
  if (gameRoutes.length !== 172) errors.push(`expected 172 game routes, got ${gameRoutes.length}`);
  if (miniRoutes.length !== 171) errors.push(`expected 171 MiniGame routes plus Neon Drift, got ${miniRoutes.length}`);
  if (new Set(gameRoutes).size !== gameRoutes.length) errors.push("game routes must have unique slugs");

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Validated game data: ${funGameSlugs.length} fun, ${kidsGameSlugs.length} kids, ${miniRoutes.length} MiniGame routes`);
  }
}

void main();
