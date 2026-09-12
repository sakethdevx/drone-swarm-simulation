export class SpatialHashGrid {
  private cellSize: number;
  private cells: Map<number, number[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  // Collision-free encoding for coords within [-500, 500] cell range.
  // Avoids the `| 0` truncation that caused 32-bit overflow collisions.
  private hash(cx: number, cy: number, cz: number): number {
    const ox = cx + 500;
    const oy = cy + 500;
    const oz = cz + 500;
    return ox + oy * 1001 + oz * 1001 * 1001;
  }

  public clear(): void {
    this.cells.clear();
  }

  public insert(id: number, x: number, y: number, z: number): void {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    const key = this.hash(cx, cy, cz);
    const cell = this.cells.get(key);
    if (cell) {
      cell.push(id);
    } else {
      this.cells.set(key, [id]);
    }
  }

  public getNearby(x: number, y: number, z: number, searchRadius: number): number[] {
    const nearby: number[] = [];
    const minX = Math.floor((x - searchRadius) / this.cellSize);
    const maxX = Math.floor((x + searchRadius) / this.cellSize);
    const minY = Math.floor((y - searchRadius) / this.cellSize);
    const maxY = Math.floor((y + searchRadius) / this.cellSize);
    const minZ = Math.floor((z - searchRadius) / this.cellSize);
    const maxZ = Math.floor((z + searchRadius) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        for (let cz = minZ; cz <= maxZ; cz++) {
          const cell = this.cells.get(this.hash(cx, cy, cz));
          if (cell) {
            nearby.push(...cell);
          }
        }
      }
    }
    return nearby;
  }
}
