import type { EngineEvent, GameEngineContract } from "./types";
import { isOrthogonalNeighbor } from "./utils";

export type PuzzleState = {
  tiles: number[];
  moves: number;
  complete: boolean;
  failed: boolean;
};

export type PuzzleInput = { type: "move"; index: number };

export function createSlidingPuzzleEngine(initial: number[] = [1, 2, 3, 4, 5, 6, 0, 7, 8]): GameEngineContract<PuzzleState, PuzzleInput> {
  const goal = initial.map((_, index) => index + 1);
  goal[goal.length - 1] = 0;
  return {
    initialState: () => ({ tiles: [...initial], moves: 0, complete: initial.join(",") === goal.join(","), failed: false }),
    reduce: (state, input) => {
      if (state.complete || state.failed) return { state, events: [] };
      if (input.type !== "move" || !Number.isInteger(input.index) || !isOrthogonalNeighbor(state.tiles.indexOf(0), input.index, Math.sqrt(state.tiles.length), state.tiles.length)) {
        return { state, events: [{ type: "invalid-input", message: "只能移动空格旁的方块" }] };
      }
      const tiles = [...state.tiles];
      const empty = tiles.indexOf(0);
      [tiles[empty], tiles[input.index]] = [tiles[input.index], tiles[empty]];
      const complete = tiles.every((tile, index) => tile === goal[index]);
      const next = { tiles, moves: state.moves + 1, complete, failed: false };
      const events: EngineEvent[] = [{ type: "score", points: 1 }];
      if (complete) events.push({ type: "success", message: "滑块拼图完成" });
      return { state: next, events };
    },
    isComplete: (state) => state.complete,
    isFailed: (state) => state.failed,
  };
}
