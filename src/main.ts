import { CANVAS_SIZE, NUM_CANVASES } from "./constants";
import { createOffscreenSourceCanvas } from "./render/create-offscreen-source-canvas copy";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <h2>Rendering a single ${CANVAS_SIZE}x${CANVAS_SIZE} WebGL canvas that is split into ${NUM_CANVASES} destination 2D canvases.</h2>
  <div class="canvas-container" id="canvasContainer"></div>
`;

// Calculate tile dimensions
const columns = Math.ceil(Math.sqrt(NUM_CANVASES));
const rows = Math.ceil(NUM_CANVASES / columns);
const tileWidth = Math.floor(CANVAS_SIZE / columns);
const tileHeight = Math.floor(CANVAS_SIZE / rows);

const sourceCanvas = createOffscreenSourceCanvas(tileWidth, tileHeight);

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

  // Calculate grid dimensions
  const columns = Math.ceil(Math.sqrt(numCanvases));
  const rows = Math.ceil(numCanvases / columns);

  // Set container style to create grid
  container.style.display = "grid";
  container.style.gridTemplateColumns = `repeat(${columns}, auto)`;
  container.style.gap = "3px";

  for (let i = 0; i < numCanvases; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "canvas-wrapper";

    const canvas = document.createElement("canvas");
    // Each canvas should be sized to match its tile section
    canvas.width = size / columns;
    canvas.height = size / rows;

    // Scale the display size while maintaining aspect ratio
    const scale = Math.min(
      size / columns / window.devicePixelRatio,
      size / rows / window.devicePixelRatio
    );

    canvas.style.width = `${scale}px`;
    canvas.style.height = `${scale}px`;

    wrapper.appendChild(canvas);
    container.appendChild(wrapper);
    canvases.push(canvas);
  }

  return { canvases } as const;
}
