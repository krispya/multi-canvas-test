export function createOffscreenSourceCanvas(width: number, height: number) {
  const canvas = new OffscreenCanvas(width, height);
  canvas.width = width;
  canvas.height = height;

  return canvas;
}
