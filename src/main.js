import * as THREE from "three";
import { createCamera } from "./camera.js";
import { Planet } from "./planet.js";
import { SCALE_FACTOR, ASTRONOMICAL_UNIT, SUN_DIAMETER } from "./constants.js";
import { UI } from "./ui/UI.js";
import { UIShader } from './ui/UIShader.js';
import { CELESTIAL_BODIES } from './data/celestialBodies.js';

/*
 * Global variables
 */
let scene, renderer, camera, controls;
let currentFocusIndex = 0; // Initialize to 0 to focus on the Sun initially
let planetMeshes = []; // Array to store all planet meshes in order
let isComparisonView = false;
let ui;
let uiShader;
let timeScale = 1;
let isPaused = false;

/*
 * Add a cube background to the scene
 * @param {Object} scene - The scene
 */
function addCubeBackground(scene) {
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    'static/textures/stars_milky_way/px.jpg', // right
    'static/textures/stars_milky_way/nx.jpg', // left
    'static/textures/stars_milky_way/py.jpg', // top
    'static/textures/stars_milky_way/ny.jpg', // bottom
    'static/textures/stars_milky_way/pz.jpg', // front
    'static/textures/stars_milky_way/nz.jpg'  // back
  ]);
  scene.background = texture;
}

/*
 * Scale factor for converting real world units to scene units
 */
const scale = {
  // Convert actual kilometers to scene units with safety checks
  size: (km) => {
    const scaled = km / SCALE_FACTOR;
    if (isNaN(scaled)) {
      console.error(`Invalid size scaling for ${km} km`);
      return 0.01; // fallback size
    }
    return scaled;
  },
  distance: (km) => {
    const scaled = km / SCALE_FACTOR;
    if (isNaN(scaled)) {
      console.error(`Invalid distance scaling for ${km} km`);
      return 0.01; // fallback distance
    }
    return scaled;
  }
};

// REFACTOR INIT() LATER
// Optimization? When first loading a planet its slow to load, 
// but once loaded it's fast, we should preload all the textures
// and then just animate them in and out.

/*
 * Initialize the scene
 */
function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const { camera: cam, controls: ctrl } = createCamera(renderer, scale);
  camera = cam;
  controls = ctrl;

  const light = new THREE.PointLight(0xffffff, 1, 0);
  light.position.set(0, 0, 0);
  scene.add(light);

  // Add directional light for better surface details
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  // Adjust ambient light intensity
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Reduced intensity
  scene.add(ambientLight);

  addCubeBackground(scene);

  // Create planets
  Object.entries(CELESTIAL_BODIES).forEach(([name, data]) => {
    let normalMapPath = null;
    let specularMapPath = null;
    let cloudsMapPath = null;
    let bumpMapPath = null;

    if (name === 'earth') {
      normalMapPath = data.normalMap;
      specularMapPath = data.specularMap;
      cloudsMapPath = data.cloudMap;
      bumpMapPath = data.bumpMap;
    }

    const planet = new Planet(
      scale.size(data.diameter / 2),
      data.texture,
      name === 'earth' ? data.normalMap : null,
      name === 'earth' ? data.specularMap : null,
      name === 'earth' ? data.bumpMap : null,
      name === 'earth' ? data.cloudMap : null,
      [scale.distance(data.distance), 0, 0],
      scale
    );
    planet.mesh.name = name;
    planetMeshes.push(planet);
    scene.add(planet.mesh);
  });

  // Initialize UI with navigation callback before focusing on a planet
  ui = new UI(CELESTIAL_BODIES, handleNavigate);

  // Focus on the initial planet (Sun) after UI is initialized
  updatePlanetPositions();
  focusOnPlanet(currentFocusIndex);

  animate();
  window.addEventListener('keydown', handleKeyPress);
  console.log("Press 'C' to toggle comparison view");

  uiShader = new UIShader();

  // Add event listeners for UI buttons
  document.querySelectorAll('.control-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      const action = event.target.dataset.action;
      switch (action) {
        case 'compare':
          handleKeyPress({ key: 'c' });
          break;
        case 'reset':
          handleKeyPress({ key: 'Escape' });
          break;
      }
    });
  });

  initTimeControls();
}

/*
 * Navigation callback for UI arrows
 * @param {Number} direction - -1 for previous, 1 for next
 */
function handleNavigate(direction) {
  let newIndex;
  if (direction === -1) {
    newIndex = currentFocusIndex <= 0 ? planetMeshes.length - 1 : currentFocusIndex - 1;
  } else if (direction === 1) {
    newIndex = (currentFocusIndex + 1) % planetMeshes.length;
  } else {
    return;
  }
  focusOnPlanet(newIndex);
}

/*
 * Main animation loop
 */
function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    // Rotate each planet
    planetMeshes.forEach((planet, index) => {
      const celestialBody = CELESTIAL_BODIES[Object.keys(CELESTIAL_BODIES)[index]];
      let rotationSpeed = 0;

      if (celestialBody.rotation_period) {
        switch (celestialBody.name.toLowerCase()) {
          case 'sun':
            // Sun rotates every 27 Earth days - very slow rotation
            rotationSpeed = (1 / celestialBody.rotation_period) * 0.005 * timeScale;
            break;
          case 'mercury':
            // Mercury: 58.646 Earth days
            rotationSpeed = (1 / celestialBody.rotation_period) * 0.02 * timeScale;
            break;
          case 'venus':
            // Venus: -243 Earth days (retrograde)
            rotationSpeed = (1 / Math.abs(celestialBody.rotation_period)) * 0.02 * timeScale;
            if (celestialBody.rotation_period < 0) rotationSpeed *= -1;
            break;
          case 'earth':
            // Earth: 23.934 hours
            rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.04 * timeScale;
            break;
          case 'mars':
            // Mars: 24.62 hours
            rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.04 * timeScale;
            break;
          case 'jupiter':
            // Jupiter: 9.93 hours (fastest rotating planet)
            rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.06 * timeScale;
            break;
          case 'saturn':
            // Saturn: 10.66 hours
            rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.06 * timeScale;
            break;
          case 'uranus':
            // Uranus: -17 hours (retrograde)
            rotationSpeed = (1 / Math.abs(celestialBody.rotation_period / 24)) * 0.04 * timeScale;
            if (celestialBody.rotation_period < 0) rotationSpeed *= -1;
            break;
          case 'neptune':
            // Neptune: 16.08 hours
            rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.04 * timeScale;
            break;
          case 'pluto':
            // Pluto: 6.39 Earth days
            rotationSpeed = (1 / celestialBody.rotation_period) * 0.02 * timeScale;
            break;
          default:
            rotationSpeed = 0.001; // reduced fallback rotation speed
        }
      }

      // Rotate the planet directly
      planet.rotatePlanet(rotationSpeed);
    });
  }

  // Update controls target
  if (currentFocusIndex >= 0) {
    const target = planetMeshes[currentFocusIndex].mesh;
    controls.target.copy(target.position);
  }

  // Update UI shader
  if (uiShader) {
    uiShader.update();
  }

  updateZoomSpeed();
  controls.update();
  renderer.render(scene, camera);
}

/*
 * Resize the canvas when the window is resized
 */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/*
 * Focus on a planet
 * @param {Number} index - The index of the planet
 */
function focusOnPlanet(index) {
  if (index < 0 || index >= planetMeshes.length) return;

  currentFocusIndex = index;
  const targetPlanet = planetMeshes[index].mesh;

  // Reset controls target to planet position
  controls.target.copy(targetPlanet.position);

  // Calculate appropriate viewing distance based on planet size
  const planetRadius = targetPlanet.geometry.parameters.radius;
  let viewDistance;

  if (targetPlanet.name === 'sun') {
    viewDistance = planetRadius * 5;
  } else if (['jupiter', 'saturn'].includes(targetPlanet.name)) {
    viewDistance = planetRadius * 8;
  } else if (['uranus', 'neptune'].includes(targetPlanet.name)) {
    viewDistance = planetRadius * 12;
  } else {
    // Smaller planets (Mercury, Venus, Earth, Mars)
    viewDistance = planetRadius * 15;
  }

  // Calculate camera position with offset
  const offsetRatio = 0.5;
  const offset = new THREE.Vector3(
    viewDistance * offsetRatio,
    viewDistance * offsetRatio,
    viewDistance
  );

  // Set camera position relative to planet
  camera.position.copy(targetPlanet.position).add(offset);

  // Update camera and controls
  camera.lookAt(targetPlanet.position);
  controls.update();

  // Update UI
  ui.updatePlanetInfo(targetPlanet);
  // Log info for debugging
  console.log(`Focused on ${targetPlanet.name}`);
  console.log(`Planet radius: ${planetRadius}`);
  console.log(`View distance: ${viewDistance}`);
}

/*
 * Handle key presses
 * @param {Object} event - The event
 */
function handleKeyPress(event) {
  switch (event.key) {
    case 'ArrowRight':
      handleNavigate(1);
      console.log("Planet:", planetMeshes[currentFocusIndex].name);
      break;
    case 'ArrowLeft':
      console.log("ArrowLeft");
      handleNavigate(-1);
      break;
    case 'Escape':
      // Reset to default view
      currentFocusIndex = -1;
      controls.target.set(0, 0, 0);
      camera.position.set(
        scale.distance(ASTRONOMICAL_UNIT * 2),
        scale.distance(ASTRONOMICAL_UNIT * 2),
        scale.distance(ASTRONOMICAL_UNIT * 2)
      );
      break;
    case 'c':
    case 'C':
      isComparisonView = !isComparisonView;
      updatePlanetPositions();
      // Reset camera to view all planets
      currentFocusIndex = -1;
      controls.target.set(0, 0, 0);
      const viewDistance = isComparisonView ?
        scale.size(SUN_DIAMETER * 2) :
        scale.distance(ASTRONOMICAL_UNIT * 2);
      camera.position.set(0, viewDistance, viewDistance);
      break;
  }
}

/*
 * Update the zoom speed based on the current planet
 */
function updateZoomSpeed() {
  if (currentFocusIndex >= 0) {
    const targetPlanet = planetMeshes[currentFocusIndex].mesh;
    const planetRadius = targetPlanet.geometry.parameters.radius;

    // Adjust zoom speed based on planet size
    const zoomSpeed = Math.max(0.5, planetRadius * 0.5);
    controls.zoomSpeed = zoomSpeed;
  } else {
    // Default zoom speed for solar system view
    controls.zoomSpeed = 1.0;
  }
}

/*
 * Update the planet positions based on the current view
 */
function updatePlanetPositions() {
  if (isComparisonView) {
    // Place planets side by side with small gaps
    let currentX = 0;
    planetMeshes.forEach((planetMesh) => {
      const radius = planetMesh.geometry.parameters.radius;
      currentX += radius; // Start at edge of previous planet
      planetMesh.mesh.position.set(currentX, 0, 0);
      currentX += radius + scale.size(1000000); // Add gap between planets
    });
  } else {
    // Reset to original orbital positions
    Object.entries(CELESTIAL_BODIES).forEach(([name, data], index) => {
      planetMeshes[index].mesh.position.set(
        scale.distance(data.distance),
        0,
        0
      );
    });
  }
}

function initTimeControls() {
  const slider = document.getElementById('timeSlider');
  const timeValue = document.getElementById('timeValue');
  const pauseButton = document.getElementById('pauseButton');

  // Initialize slider to real-time
  slider.value = 0;
  timeScale = 1;

  slider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);

    if (value < 0) {
      // Slower than real-time
      timeScale = 1 / Math.pow(10, Math.abs(value));
    } else {
      // Real-time or faster
      timeScale = Math.pow(10, value);
    }

    // Update display text
    if (timeScale === 1) {
      timeValue.textContent = "Real-time";
    } else if (timeScale > 1) {
      timeValue.textContent = `${timeScale.toFixed(0)}x faster`;
    } else {
      timeValue.textContent = `${(1 / timeScale).toFixed(2)}x slower`;
    }
  });

  pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
  });
}

/*
 * Initialize the scene
 */
init();