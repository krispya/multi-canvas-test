import * as THREE from "three";

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let objects: THREE.Mesh[] = [];
let numCanvases: number;
let canvas: OffscreenCanvas;
let bitmaps: ImageBitmap[] = [];

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
      initScene(canvas);
      break;
    case "requestFrame":
      if (!canvas) return;
      render();
      bitmaps[0] = canvas.transferToImageBitmap();

      for (let i = 1; i < numCanvases; i++) {
        bitmaps[i] = await createImageBitmap(bitmaps[0]);
      }

      self.postMessage({ bitmaps }, { transfer: bitmaps });
      break;
  }
};
