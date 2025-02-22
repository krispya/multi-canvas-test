import * as THREE from "three";

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let objects: THREE.Mesh[] = [];
let numCanvases: number;
let canvas: OffscreenCanvas;
let targetCanvases: OffscreenCanvas[] = [];
let contexts: ImageBitmapRenderingContext[] = [];

function initScene(canvas: OffscreenCanvas) {
  // Initialize renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

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
    object.visible = false;
    scene.add(object);
    objects.push(object);
  }

  targetCanvases.forEach((c) => {
    const context = c.getContext("bitmaprenderer", {
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
  objects[0].visible = true;
  objects[0].rotation.x += 0.01;
  objects[0].rotation.y += 0.01;
  renderer.render(scene, camera);
  objects[0].visible = false;
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

      // Create one bitmap and clone it for each context
      const sourceBitmap = canvas.transferToImageBitmap();
      const transferPromises = contexts.map(async (context) => {
        const clonedBitmap = await createImageBitmap(sourceBitmap);
        context.transferFromImageBitmap(clonedBitmap);
      });

      // Wait for all transfers to complete
      await Promise.all(transferPromises);
      sourceBitmap.close();
      break;
  }
};
