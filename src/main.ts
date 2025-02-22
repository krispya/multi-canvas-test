import { CANVAS_SIZE, NUM_CANVASES } from "./constants";
import { createOffscreenSourceCanvas } from "./render/create-offscreen-source-canvas copy";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <h2>Rendering ${NUM_CANVASES} canvases that are ${CANVAS_SIZE} pixels each.</h2>
  <div class="canvas-container" id="canvasContainer"></div>
`;

const sourceCanvas = createOffscreenSourceCanvas(CANVAS_SIZE);

// Create and setup worker
const worker = new Worker(
  new URL("./workers/render.worker.ts", import.meta.url),
  {
    type: "module",
  }
);

const { canvases } = createTargetCanvas(
  document.querySelector<HTMLDivElement>("#canvasContainer")!,
  CANVAS_SIZE,
  NUM_CANVASES
);

function render() {
  requestAnimationFrame(render);
  worker.postMessage({ type: "requestFrame" });
}

// Start rendering
render();

const offscreenCanvases = canvases.map((c) =>
  (c as HTMLCanvasElement).transferControlToOffscreen()
);

worker.postMessage(
  {
    type: "init",
    data: {
      canvas: sourceCanvas,
      size: CANVAS_SIZE,
      numCanvases: NUM_CANVASES,
      targetCanvases: offscreenCanvases,
    },
  },
  [sourceCanvas, ...offscreenCanvases]
);

export function createTargetCanvas(
  container: HTMLDivElement,
  size: number,
  numCanvases: number
) {
  const canvases = [];

  for (let i = 0; i < numCanvases; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "canvas-wrapper";

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size / window.devicePixelRatio}px`;
    canvas.style.height = `${size / window.devicePixelRatio}px`;

    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    canvases.push(canvas);
  }

  return { canvases } as const;
}
