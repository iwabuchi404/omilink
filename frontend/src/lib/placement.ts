/**
 * Given a list of existing placements and the number of columns,
 * finds the next free (col, row) position to place a new item.
 * Strategy: place at col=0 on the row AFTER the last occupied row.
 */
export interface SimplePlacement {
  col: number;
  row: number;
  width: number;
  height: number;
}

export function findNextFreePosition(
  placements: SimplePlacement[],
  _cols: number,
  _itemW = 2,
  _itemH = 1,
): { col: number; row: number } {
  if (placements.length === 0) {
    return { col: 0, row: 0 };
  }

  // Find the maximum row + height among all existing placements
  const maxRow = placements.reduce((max, p) => Math.max(max, p.row + p.height), 0);

  // Place new item at col=0 on the next row
  return { col: 0, row: maxRow };
}
