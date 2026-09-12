type Vector3 = [number, number, number];

const MAX_SAMPLE_SIZE = 180;
const SHOW_WIDTH = 52;
const SHOW_HEIGHT = 42;

export const createImageFormation = (file: File, count: number): Promise<{ points: Vector3[]; preview: string }> => {
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
        const silhouette: Array<[number, number]> = [];
        const fallback: Array<[number, number]> = [];

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const alpha = pixels[index + 3];
            if (alpha < 32) continue;

            fallback.push([x, y]);
            const luminance = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
            if (luminance < 210 || alpha < 245) silhouette.push([x, y]);
          }
        }

        const source = silhouette.length >= Math.max(12, fallback.length * 0.04) ? silhouette : fallback;
        resolve({ points: normalizeSamples(source, count, width, height), preview });
      };
      image.src = preview;
    };
    reader.readAsDataURL(file);
  });
};

export const resampleFormationPoints = (points: Vector3[], count: number): Vector3[] => {
  if (points.length === 0 || count === 0) return [];
  return Array.from({ length: count }, (_, index) => points[Math.floor((index * points.length) / count)] ?? points[0]);
};

const normalizeSamples = (samples: Array<[number, number]>, count: number, width: number, height: number): Vector3[] => {
  if (samples.length === 0) return [];
  const selected = resamplePixels(samples, count);
  const scale = Math.min(SHOW_WIDTH / width, SHOW_HEIGHT / height);
  const offsetX = (width * scale) / 2;
  const offsetY = (height * scale) / 2;

  return selected.map(([x, y]) => [
    x * scale - offsetX,
    (height - y) * scale - offsetY,
    0,
  ]);
};

const resamplePixels = (pixels: Array<[number, number]>, count: number): Array<[number, number]> => {
  if (count <= 1) return [pixels[0]];
  return Array.from({ length: count }, (_, index) => pixels[Math.floor((index * (pixels.length - 1)) / (count - 1))] ?? pixels[0]);
};
