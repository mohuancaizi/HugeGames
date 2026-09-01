import type { Circle, GridPoint, Rectangle } from "./types";

export function clamp(value: number, min: number, max: number): number {
  if (min > max) return min;
  return Math.min(max, Math.max(min, value));
}

export function advanceElapsed(elapsed: number, delta: number, paused: boolean): number {
  if (paused || !Number.isFinite(delta) || delta <= 0) return elapsed;
  return elapsed + delta;
}

export function finishOnce(current: boolean, finish: () => void): boolean {
  if (current) return false;
  finish();
  return true;
}

export function circlesCollide(first: Circle, second: Circle): boolean {
  const radius = first.radius + second.radius;
  return Math.hypot(first.x - second.x, first.y - second.y) <= radius;
}

export function rectanglesCollide(first: Rectangle, second: Rectangle): boolean {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

export function isOrthogonalNeighbor(first: number, second: number, columns: number, total: number): boolean {
  if (columns <= 0 || first < 0 || second < 0 || first >= total || second >= total) return false;
  const rowA = Math.floor(first / columns);
  const rowB = Math.floor(second / columns);
  const columnA = first % columns;
  const columnB = second % columns;
  return Math.abs(rowA - rowB) + Math.abs(columnA - columnB) === 1;
}

export function orthogonalNeighbors(index: number, columns: number, total: number): number[] {
  return Array.from({ length: total }, (_, candidate) => candidate)
    .filter((candidate) => isOrthogonalNeighbor(index, candidate, columns, total));
}

export function moveOnGrid(
  point: GridPoint,
  delta: GridPoint,
  rows: number,
  columns: number,
  blocked: (point: GridPoint) => boolean = () => false,
): GridPoint | null {
  const next = { row: point.row + delta.row, column: point.column + delta.column };
  if (next.row < 0 || next.row >= rows || next.column < 0 || next.column >= columns || blocked(next)) return null;
  return next;
}

export function toggleCross(grid: readonly number[], index: number, columns: number): number[] {
  const next = [...grid];
  if (columns <= 0 || index < 0 || index >= next.length) return next;
  const row = Math.floor(index / columns);
  const candidates = [index, index - 1, index + 1, index - columns, index + columns];
  candidates.forEach((candidate) => {
    if (candidate >= 0 && candidate < next.length && (candidate === index || Math.floor(candidate / columns) === row)) next[candidate] = next[candidate] ? 0 : 1;
  });
  return next;
}

export function floodRegion(grid: readonly number[], index: number, color: number, columns: number): number[] {
  const next = [...grid];
  if (columns <= 0 || index < 0 || index >= next.length || next[index] === color) return next;
  const source = next[index];
  const queue = [index];
  const visited = new Set<number>([index]);
  while (queue.length > 0) {
    const current = queue.shift() as number;
    next[current] = color;
    orthogonalNeighbors(current, columns, next.length).forEach((neighbor) => {
      if (!visited.has(neighbor) && next[neighbor] === source) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    });
  }
  return next;
}

export function consumeEntity<T extends { id: number }>(entities: readonly T[], id: number): { entity?: T; remaining: T[] } {
  const entity = entities.find((item) => item.id === id);
  return { entity, remaining: entity ? entities.filter((item) => item.id !== id) : [...entities] };
}

export type PipeCellState = { rotation: number; ports: readonly number[] };

export function pipeConnected(cells: readonly PipeCellState[], columns: number, source: number, goal: number): boolean {
  if (columns <= 0 || source < 0 || goal < 0 || source >= cells.length || goal >= cells.length) return false;
  const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]] as const;
  const hasPort = (cell: PipeCellState, direction: number): boolean => cell.ports.includes((direction + cell.rotation) % 4);
  const visited = new Set<number>([source]);
  const queue = [source];
  while (queue.length > 0) {
    const current = queue.shift() as number;
    if (current === goal) return true;
    const row = Math.floor(current / columns);
    const column = current % columns;
    directions.forEach(([rowDelta, columnDelta], direction) => {
      const nextRow = row + rowDelta;
      const nextColumn = column + columnDelta;
      const next = nextRow * columns + nextColumn;
      if (nextRow < 0 || nextColumn < 0 || nextColumn >= columns || next < 0 || next >= cells.length || visited.has(next)) return;
      const opposite = (direction + 2) % 4;
      if (hasPort(cells[current], direction) && hasPort(cells[next], opposite)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }
  return false;
}
