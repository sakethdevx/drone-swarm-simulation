export class SpatialHashGrid {
  private cellSize: number;
  // Numeric key is significantly faster than string interpolation on hot paths
  private cells: Map<number, number[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  private hash(cx: number, cy: number, cz: number): number {
    // Large prime mixing — cheap and collision-resistant for typical simulation coords
    return (cx * 92837111 ^ cy * 689287499 ^ cz * 283923481) | 0;
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
