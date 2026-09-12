import type { ImageFormationPoint } from '../types';

type Pixel = { x: number; y: number; color: string; red: number; green: number; blue: number };
type Vector3 = [number, number, number];

const MAX_SAMPLE_SIZE = 240;
const SHOW_WIDTH = 52;
const SHOW_HEIGHT = 58;
const MIN_DRONES = 600;
const MAX_DRONES = 1200;
const BACKGROUND_DISTANCE = 48;

export interface ImageFormationResult {
  points: ImageFormationPoint[];
  preview: string;
  suggestedDroneCount: number;
}

export const createImageFormation = (file: File): Promise<ImageFormationResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.onload = () => {
      const preview = String(reader.result);
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to decode image'));
      image.onload = () => {
        const scale = Math.min(1, MAX_SAMPLE_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Canvas processing is unavailable'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        const allPixels = readPixels(pixels, width, height);
        const foreground = extractSubject(allPixels, pixels, width, height);
        const suggestedDroneCount = Math.min(
          MAX_DRONES,
          Math.max(MIN_DRONES, Math.round(Math.sqrt(foreground.length) * 8)),
        );
        const sampled = sampleDottedSubject(foreground, suggestedDroneCount, width, height);

        resolve({
          points: normalizeSamples(sampled),
          preview,
          suggestedDroneCount,
        });
      };
      image.src = preview;
    };
    reader.readAsDataURL(file);
  });
};

export const resampleFormationPoints = (points: ImageFormationPoint[], count: number): ImageFormationPoint[] => {
  if (points.length === 0 || count === 0) return [];
  if (count <= points.length) {
    return points.slice(0, count);
  }

  return Array.from({ length: count }, (_, index) => points[index % points.length]);
};

const readPixels = (data: Uint8ClampedArray, width: number, height: number): Pixel[] => {
  const pixels: Pixel[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      if (alpha < 24) continue;
      pixels.push({
        x,
        y,
        red,
        green,
        blue,
        color: enhanceShowColor(red, green, blue),
      });
    }
  }
  return pixels;
};

const extractSubject = (pixels: Pixel[], data: Uint8ClampedArray, width: number, height: number): Pixel[] => {
  if (pixels.length === 0) return [];
  const background = averageBorderColor(data, width, height);
  const visited = new Uint8Array(width * height);
  const queue: Array<[number, number]> = [];

  const enqueueBackground = (x: number, y: number) => {
    const key = y * width + x;
    if (visited[key] || !isBackgroundPixel(data, x, y, width, background)) return;
    visited[key] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x++) {
    enqueueBackground(x, 0);
    enqueueBackground(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueueBackground(0, y);
    enqueueBackground(width - 1, y);
  }

  let queueIndex = 0;
  while (queueIndex < queue.length) {
    const [x, y] = queue[queueIndex++];
    enqueueBackground(x - 1, y);
    enqueueBackground(x + 1, y);
    enqueueBackground(x, y - 1);
    enqueueBackground(x, y + 1);
  }

  // Reject background-colored pixels globally as a final guard. This prevents
  // a white portrait canvas from becoming thousands of white drones.
  const foreground = pixels.filter((pixel) => {
    if (visited[pixel.y * width + pixel.x]) return false;
    const index = (pixel.y * width + pixel.x) * 4;
    if (isWhiteCanvasPixel(pixel)) return false;
    return !isBackgroundPixel(data, pixel.x, pixel.y, width, background) || data[index + 3] < 245;
  });
  if (foreground.length >= pixels.length * 0.02) return foreground;

  // Never fall back to the whole canvas: that creates a rectangular formation.
  return pixels.filter((pixel) => !isWhiteCanvasPixel(pixel) && luminance(pixel) < 175);
};

const isWhiteCanvasPixel = (pixel: Pixel): boolean =>
  pixel.red > 224 && pixel.green > 224 && pixel.blue > 224;

const sampleDottedSubject = (pixels: Pixel[], count: number, width: number, height: number): Pixel[] => {
  if (pixels.length === 0) return [];
  const aspect = width / height;
  const columns = Math.max(1, Math.round(Math.sqrt(count * aspect)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const buckets = new Map<string, Pixel[]>();

  for (const pixel of pixels) {
    const column = Math.min(columns - 1, Math.floor((pixel.x / width) * columns));
    const row = Math.min(rows - 1, Math.floor((pixel.y / height) * rows));
    const key = `${column}:${row}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(pixel);
    buckets.set(key, bucket);
  }

  const selected: Pixel[] = [];
  const occupiedBuckets = [...buckets.values()];
  const samplesPerBucket = Math.max(1, Math.ceil(count / occupiedBuckets.length));

  for (const bucket of occupiedBuckets) {
    for (let sample = 0; sample < samplesPerBucket && selected.length < count; sample++) {
      const sourceIndex = Math.min(
        bucket.length - 1,
        Math.floor(((sample + 0.5) * bucket.length) / samplesPerBucket),
      );
      const representative = bucket[sourceIndex];
      if (representative) selected.push(representative);
    }
  }

  return selected;
};

const normalizeSamples = (samples: Pixel[]): ImageFormationPoint[] => {
  const minX = Math.min(...samples.map((pixel) => pixel.x));
  const maxX = Math.max(...samples.map((pixel) => pixel.x));
  const minY = Math.min(...samples.map((pixel) => pixel.y));
  const maxY = Math.max(...samples.map((pixel) => pixel.y));
  const paddingX = Math.max(2, (maxX - minX) * 0.04);
  const paddingY = Math.max(2, (maxY - minY) * 0.04);
  const subjectWidth = Math.max(1, maxX - minX + paddingX * 2);
  const subjectHeight = Math.max(1, maxY - minY + paddingY * 2);
  const scale = Math.min(SHOW_WIDTH / subjectWidth, SHOW_HEIGHT / subjectHeight);
  const offsetX = ((minX - paddingX) + subjectWidth / 2) * scale;

  return samples.map((pixel) => ({
    position: [pixel.x * scale - offsetX, (maxY - pixel.y) * scale - (subjectHeight * scale / 2 - paddingY * scale), 0] as Vector3,
    color: pixel.color,
  }));
};

const isBackgroundPixel = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  background: [number, number, number],
): boolean => {
  const index = (y * width + x) * 4;
  if (data[index + 3] < 245) return true;
  const distance = Math.sqrt(
    (data[index] - background[0]) ** 2 +
    (data[index + 1] - background[1]) ** 2 +
    (data[index + 2] - background[2]) ** 2,
  );
  return distance < BACKGROUND_DISTANCE;
};

const averageBorderColor = (data: Uint8ClampedArray, width: number, height: number): [number, number, number] => {
  const colors: [number, number, number][] = [];
  const sample = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    colors.push([data[index], data[index + 1], data[index + 2]]);
  };

  const patchWidth = Math.max(1, Math.floor(width * 0.12));
  const patchHeight = Math.max(1, Math.floor(height * 0.12));
  for (let y = 0; y < patchHeight; y += 2) {
    for (let x = 0; x < patchWidth; x += 2) {
      sample(x, y);
      sample(width - 1 - x, y);
      sample(x, height - 1 - y);
      sample(width - 1 - x, height - 1 - y);
    }
  }

  const total = Math.max(1, colors.length);
  return [
    colors.reduce((sum, color) => sum + color[0], 0) / total,
    colors.reduce((sum, color) => sum + color[1], 0) / total,
    colors.reduce((sum, color) => sum + color[2], 0) / total,
  ];
};

const luminance = (pixel: Pixel): number => pixel.red * 0.299 + pixel.green * 0.587 + pixel.blue * 0.114;

const enhanceShowColor = (red: number, green: number, blue: number): string => {
  const peak = Math.max(red, green, blue) / 255;
  const luminance = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
  if (peak < 0.08) return '#172554';

  // Dark warm/neutral pixels are typically black or charcoal hair. Keep them
  // neutral instead of lifting brown highlights into yellow drones. Blue-heavy
  // dark pixels bypass this rule so navy clothing remains blue.
  if (luminance < 0.26 && red >= blue * 0.85) return '#20242b';

  // Use a restrained luminance lift. A dark navy coat should remain dark navy,
  // rather than being stretched into a light blue or violet highlight.
  const targetLuminance = Math.min(0.92, Math.max(0.14, luminance * 1.18));
  const scale = targetLuminance / Math.max(0.001, luminance);
  const normalize = (channel: number) => Math.min(255, Math.round(channel * scale));

  return `#${normalize(red).toString(16).padStart(2, '0')}${normalize(green).toString(16).padStart(2, '0')}${normalize(blue).toString(16).padStart(2, '0')}`;
};
