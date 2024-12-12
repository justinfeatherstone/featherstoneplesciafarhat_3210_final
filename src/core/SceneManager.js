import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CELESTIAL_BODIES } from "../data/celestialBodies.js";
import { ASTRONOMICAL_UNIT } from "../constants.js";
import { UI } from "../ui/UI.js";
import { UIShader } from "../ui/UIShader.js";
import { scale } from "./Utils.js";

/**
 * Scene Manager Module
 **/
export class SceneManager {
  /**
   * Constructor for SceneManager
   * @param {Object} timeScale - The time scale object
   * @param {Boolean} isPaused - Whether the scene is paused
   **/
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
    this.scale = scale;
  }

  /**
   * Initialize the renderer
   **/
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document
      .getElementById("canvas-container")
      .appendChild(this.renderer.domElement);
  }

  /**
   * Initialize the camera
   * @param {Object} scale - The scale object
   **/
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

  /**
   * Initialize the UI
   **/
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

  /**
   * Add ambient light
   **/
  addAmbientLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);
  }

  /**
   * Add sun light
   **/
  addSunLight() {
    // Add point light with adjusted properties
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.color.setHSL(0.1, 0.7, 0.95);
    sunLight.decay = 0;

    this.scene.add(sunLight);
  }

  /**
   * Handle window resize
   **/
  resizeHandler() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Set the planet manager
   * @param {Object} planetManager - The planet manager object
   **/
  setPlanetManager(planetManager) {
    this.planetManager = planetManager;
  }

  /**
   * Initialize helpers
   **/
  initHelpers() {
    // Axes Helper
    const axesHelper = new THREE.AxesHelper(this.scale.distance(200000000)); // 200 million km for solar system scale
    axesHelper.name = "axesHelper";
    this.scene.add(axesHelper);

    // Grid Helper
    const size = this.scale.distance(500000000); // 500 million km grid
    const divisions = 50;
    const gridHelper = new THREE.GridHelper(size, divisions);
    gridHelper.name = "gridHelper";
    gridHelper.rotation.x = Math.PI / 2; // Rotate to match ecliptic plane
    this.scene.add(gridHelper);

    // Polar Grid Helper
    const polarGridHelper = new THREE.PolarGridHelper(size / 2, 16, 8, 64);
    polarGridHelper.name = "polarGridHelper";
    this.scene.add(polarGridHelper);
  }

  /**
   * Toggle helpers
   * @param {Boolean} showHelpers - Whether to show helpers
   **/
  toggleHelpers(showHelpers) {
    const helpers = ["axesHelper", "gridHelper", "polarGridHelper"];

    helpers.forEach((helperName) => {
      const helper = this.scene.getObjectByName(helperName);
      if (helper) {
        helper.visible = showHelpers;
      }
    });
  }
}
