import * as THREE from "three";

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let objects: THREE.Mesh[] = [];
let numCanvases: number;
let canvas: OffscreenCanvas;
let targetCanvases: OffscreenCanvas[] = [];
let contexts: ImageBitmapRenderingContext[] = [];
let canvasSize: number;

function initScene(canvas: OffscreenCanvas) {
  const columns = Math.ceil(Math.sqrt(numCanvases));
  const rows = Math.ceil(numCanvases / columns);
  const tileWidth = Math.floor(canvasSize / columns);
  const tileHeight = Math.floor(canvasSize / rows);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  // Setup scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, tileWidth / tileHeight, 0.1, 1000);
  camera.position.z = 1;
  scene.background = new THREE.Color(0x222222);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  // Setup objects and contexts
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
    const context = c.getContext("bitmaprenderer");
    if (!context) {
      throw new Error("Failed to create BitmapRenderer context");
    }
    contexts.push(context);
  });
}

function render() {
  // Update all object rotations
  objects.forEach((object) => {
    object.rotation.x += 0.01;
    object.rotation.y += 0.01;
  });

  // Render each object individually
  objects.forEach((object, index) => {
    // Hide all objects
    objects.forEach((obj) => (obj.visible = false));
    // Show only current object
    object.visible = true;

    // Render the scene
    renderer.render(scene, camera);

    // Transfer to the corresponding context
    const bitmap = canvas.transferToImageBitmap();
    contexts[index].transferFromImageBitmap(bitmap);
  });
}

self.onmessage = async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "init":
      canvas = data.canvas;
      numCanvases = data.numCanvases;
      targetCanvases = data.targetCanvases;
      canvasSize = data.size;
      initScene(canvas);
      break;
    case "requestFrame":
      if (!canvas) return;
      render();
      break;
  }
};
