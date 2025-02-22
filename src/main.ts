import { CANVAS_SIZE, NUM_CANVASES } from "./constants";
import { createOffscreenSourceCanvas } from "./render/create-offscreen-source-canvas copy";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <h2>Rendering ${NUM_CANVASES} canvases that are ${CANVAS_SIZE} pixels each.</h2>
  <div class="canvas-container" id="canvasContainer"></div>
`;

// const sourceCanvas = createSourceCanvas(
//   document.querySelector<HTMLDivElement>("#app")!,
//   CANVAS_SIZE
// );

const sourceCanvas = createOffscreenSourceCanvas(CANVAS_SIZE);

// Create and setup worker
const worker = new Worker(
  new URL("./workers/render.worker.ts", import.meta.url),
  {
    type: "module",
  }
);

worker.postMessage(
  {
    type: "init",
    data: {
      canvas: sourceCanvas,
      size: CANVAS_SIZE,
      numCanvases: NUM_CANVASES,
    },
  },
  [sourceCanvas]
);

const { contexts } = createTargetCanvas(
  document.querySelector<HTMLDivElement>("#canvasContainer")!,
  CANVAS_SIZE,
  NUM_CANVASES
);

function render() {
  requestAnimationFrame(render);
  worker.postMessage({ type: "requestFrame" });
}

// Start rendering
worker.postMessage({ type: "render" });
render();

worker.onmessage = async (e) => {
  const { bitmap } = e.data;

  // Clone the bitmap for each context
  const bitmaps = await Promise.all(
    contexts.map(() => createImageBitmap(bitmap))
  );

  // Close original bitmap to free memory
  bitmap.close();

  // Transfer clones to each context
  contexts.forEach((context, index) => {
    context.transferFromImageBitmap(bitmaps[index]);
  });
};

export function createTargetCanvas(
  container: HTMLDivElement,
  size: number,
  numCanvases: number
) {
  const canvases = [];
  const contexts = [];

  for (let i = 0; i < numCanvases; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "canvas-wrapper";

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size / window.devicePixelRatio}px`;
    canvas.style.height = `${size / window.devicePixelRatio}px`;

    const context = canvas.getContext("bitmaprenderer");
    if (!context) {
      throw new Error("Failed to create 2D context");
    }

    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    canvases.push(canvas);
    contexts.push(context);
  }

  return { canvases, contexts };
}

// const renderer = new THREE.WebGLRenderer({
//   canvas: sourceCanvas,
//   antialias: true,
//   alpha: true,
// });

// // Setup scene
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
// camera.position.z = 1;
// const light = new THREE.DirectionalLight(0xffffff, 1);
// light.position.set(1, 1, 1);
// scene.add(light);
// scene.add(new THREE.AmbientLight(0x404040));

// const { canvases, contexts, objects } = createTargetCanvas(
//   scene,
//   document.querySelector<HTMLDivElement>("#canvasContainer")!,
//   CANVAS_SIZE,
//   NUM_CANVASES
// );

// function render() {
//   requestAnimationFrame(render);

//   objects[0].visible = true;
//   objects[0].rotation.x += 0.01;
//   objects[0].rotation.y += 0.01;

//   renderer.render(scene, camera);

//   contexts.forEach((context) => {
//     context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
//     context.drawImage(sourceCanvas, 0, 0);
//   });
// }

// render();
