import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CELESTIAL_BODIES } from "../data/celestialBodies.js";
import { ASTRONOMICAL_UNIT } from "../constants.js";
import { UI } from "../ui/UI.js";
import { UIShader } from "../ui/UIShader.js";

export class SceneManager {
  constructor(timeScale, isPaused) {
    this.timeScale = timeScale;
    this.isPaused = isPaused;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.ui = null;
    this.uiShader = null;
    this.planetManager = null;
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document
      .getElementById("canvas-container")
      .appendChild(this.renderer.domElement);
  }

  initCamera(scale) {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.0001,
      scale.distance(ASTRONOMICAL_UNIT * 50)
    );

    this.controls = new OrbitControls(camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 0.0001;
    this.controls.maxDistance = scale.distance(ASTRONOMICAL_UNIT * 40);
    this.controls.enableZoom = true;

    this.camera = camera;
  }

  initUI() {
    this.ui = new UI(
      CELESTIAL_BODIES,
      (direction) => this.planetManager.handleNavigate(direction),
      this.timeScale,
      this.isPaused,
      this.planetManager
    );
    this.uiShader = new UIShader();
  }

  addAmbientLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);
  }

  addSunLight() {
    // Add point light with adjusted properties
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.color.setHSL(0.1, 0.7, 0.95);
    sunLight.decay = 0;

    this.scene.add(sunLight);
  }

  resizeHandler() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setPlanetManager(planetManager) {
    this.planetManager = planetManager;
  }
}
