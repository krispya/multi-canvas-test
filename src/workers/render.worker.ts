import * as THREE from "three";

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let objects: THREE.Mesh[] = [];
let numCanvases: number;
let canvas: OffscreenCanvas;
let targetCanvases: OffscreenCanvas[] = [];
let contexts: OffscreenCanvasRenderingContext2D[] = [];

function initScene(canvas: OffscreenCanvas) {
  // Initialize renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setScissorTest(true);

  // Setup scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 1;
  scene.background = new THREE.Color(0x222222);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  for (let i = 0; i < numCanvases; i++) {
    const uniqueColor = new THREE.Color();
    uniqueColor.setHSL(i / numCanvases, 1.0, 0.5);
    const torusKnot = new THREE.TorusKnotGeometry(0.5, 0.1, 100, 16);
    const material = new THREE.MeshStandardMaterial({
      color: uniqueColor,
      roughness: 0.5,
      metalness: 0.5,
    });
    const object = new THREE.Mesh(torusKnot, material);
    scene.add(object);
    objects.push(object);
  }

  targetCanvases.forEach((c) => {
    const context = c.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
    if (!context) {
      throw new Error("Failed to create 2D context");
    }
    contexts.push(context);
  });
}

function render() {
  const columns = Math.ceil(Math.sqrt(numCanvases));
  const rows = Math.ceil(numCanvases / columns);
  const tileWidth = canvas.width / columns;
  const tileHeight = canvas.height / rows;

  // Update all object rotations
  objects.forEach((object) => {
    object.rotation.x += 0.01;
    object.rotation.y += 0.01;
  });

  // Render each object in its own viewport region
  objects.forEach((object, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    // Set viewport to this tile's region
    const x = col * tileWidth;
    const y = canvas.height - (row + 1) * tileHeight; // WebGL Y is bottom-to-top
    renderer.setViewport(x, y, tileWidth, tileHeight);
    renderer.setScissor(x, y, tileWidth, tileHeight);

    // Render just this object
    object.visible = true;
    renderer.render(scene, camera);
    object.visible = false;
  });

  // Create bitmap and distribute to canvases
  const bitmap = canvas.transferToImageBitmap();

  // Draw appropriate section to each canvas
  contexts.forEach((context, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    context.drawImage(
      bitmap,
      col * tileWidth,
      row * tileHeight,
      tileWidth,
      tileHeight,
      0,
      0,
      context.canvas.width,
      context.canvas.height
    );
  });

  bitmap.close();
}

self.onmessage = async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "init":
      canvas = data.canvas;
      numCanvases = data.numCanvases;
      targetCanvases = data.targetCanvases;
      initScene(canvas);
      break;
    case "requestFrame":
      if (!canvas) return;
      render();
      break;
  }
};
