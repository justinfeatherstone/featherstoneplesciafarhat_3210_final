import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ASTRONOMICAL_UNIT } from "./Constants.js";

/**
 * Create a camera
 * @param {Object} renderer - The renderer
 * @param {Object} scale - The scale
 * @returns {Object} - The camera and controls
 **/
export function createCamera(renderer, scale) {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.0001,
    scale.distance(ASTRONOMICAL_UNIT * 100)
  );

  // Create controls for the camera
  const controls = new OrbitControls(camera, renderer.domElement);

  // Enable smooth controls
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Allow rotation
  controls.enableRotate = true;
  controls.rotateSpeed = 0.5;

  // Configure zoom
  controls.enableZoom = true;
  controls.zoomSpeed = 1.0;
  controls.minDistance = 0.0001;
  controls.maxDistance = scale.distance(ASTRONOMICAL_UNIT * 90);

  // Optional: Add smooth zoom
  controls.smoothZoom = true;
  controls.smoothZoomSpeed = 5.0;

  // Enable panning but with constraints
  controls.enablePan = true;
  controls.panSpeed = 0.5;
  controls.screenSpacePanning = true;

  return { camera, controls };
}
