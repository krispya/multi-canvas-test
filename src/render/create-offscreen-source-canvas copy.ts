export function createOffscreenSourceCanvas(size: number) {
  const canvas = new OffscreenCanvas(size, size);
  canvas.width = size;
  canvas.height = size;

  return canvas;
}
