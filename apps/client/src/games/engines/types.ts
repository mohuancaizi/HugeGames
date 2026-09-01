export type EngineEvent =
  | { type: "score"; points: number }
  | { type: "success"; message?: string }
  | { type: "failure"; message?: string }
  | { type: "invalid-input"; message?: string };

export type EngineStep<State> = {
  state: State;
  events: EngineEvent[];
};

/**
 * Pure game contract. UI code owns clocks and rendering; engines only reduce
 * state from explicit inputs and expose deterministic success/failure checks.
 */
export type GameEngineContract<State, Input> = {
  initialState: () => State;
  reduce: (state: State, input: Input) => EngineStep<State>;
  isComplete: (state: State) => boolean;
  isFailed: (state: State) => boolean;
};

export type GridPoint = { row: number; column: number };
export type Rectangle = { x: number; y: number; width: number; height: number };
export type Circle = { x: number; y: number; radius: number };
