export class SpatialHashGrid {
  private cellSize: number;
  private cells: Map<string, number[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  private hash(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  public clear(): void {
    this.cells.clear();
  }

  public insert(id: number, x: number, y: number, z: number): void {
    const key = this.hash(x, y, z);
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
          const key = `${cx},${cy},${cz}`;
          const cell = this.cells.get(key);
          if (cell) {
            nearby.push(...cell);
          }
        }
      }
    }
    return nearby;
  }
}
