import { SceneManager } from './core/SceneManager.js';
import { EffectManager } from './core/EffectsManager.js';
import { PlanetManager } from './core/PlanetManager.js';
import { AnimationLoop } from './core/AnimationLoop.js';
import { EventManager } from './core/EventManager.js';
import { scale } from './core/Utils.js';

// Global variables
let timeScale = { value: 1 };
let isPaused = { value: false };

// Initialize Scene Manager
const sceneManager = new SceneManager(timeScale, isPaused);
sceneManager.initRenderer();
sceneManager.initCamera(scale);
sceneManager.initHelpers();
// Initialize Planet Manager
const planetManager = new PlanetManager(scale, sceneManager, sceneManager.scene);
await planetManager.initPlanets();

// Set up the circular reference
sceneManager.setPlanetManager(planetManager);

// Now initialize UI with proper navigation callback
sceneManager.initUI();
sceneManager.addAmbientLight();
sceneManager.addSunLight();

// Initialize Effect Manager
const effectManager = new EffectManager(
  sceneManager.scene,
  planetManager.planets,
  sceneManager.camera
);
effectManager.addCubeBackground();
effectManager.addSunFlare();
effectManager.createSunGlow();

// Initialize Animation Loop
const animationLoop = new AnimationLoop(
  sceneManager,
  planetManager,
  effectManager,
  timeScale,
  isPaused,
);
animationLoop.animate();

// Initialize Event Manager
const eventManager = new EventManager(sceneManager, planetManager);
eventManager.addEventListeners();