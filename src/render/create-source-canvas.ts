export function createSourceCanvas(container: HTMLDivElement, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  container.appendChild(canvas);

  // Hide thecanvas
  canvas.style.display = "none";

  return canvas;
}
