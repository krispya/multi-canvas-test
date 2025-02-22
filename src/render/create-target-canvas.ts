import { NUM_CANVASES } from "../constants";
import * as THREE from "three";

export function createTargetCanvas(
  scene: THREE.Scene,
  container: HTMLDivElement,
  size: number,
  numCanvases: number
) {
  // Create destination canvases
  const canvases = [];
  const contexts = [];
  const objects = [];

  for (let i = 0; i < numCanvases; i++) {
    // Create wrapper for canvas and FPS counter
    const wrapper = document.createElement("div");
    wrapper.className = "canvas-wrapper";

    // Create canvas and get 2D context
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size / window.devicePixelRatio}px`;
    canvas.style.height = `${size / window.devicePixelRatio}px`;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create 2D context");
    }

    // Add to DOM
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);

    // Store references
    canvases.push(canvas);
    contexts.push(context);

    // Create a unique cube for each canvas
    const uniqueColor = new THREE.Color();
    uniqueColor.setHSL(i / NUM_CANVASES, 1.0, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: uniqueColor,
      roughness: 0.5,
      metalness: 0.5,
    });

    const torusKnot = new THREE.TorusKnotGeometry(0.5, 0.1, 100, 16);
    const object = new THREE.Mesh(torusKnot, material);
    object.visible = false;
    scene.add(object);
    objects.push(object);
  }

  return { canvases, contexts, objects };
}
