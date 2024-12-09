import * as THREE from "three";
import { createCamera } from "./camera.js";
import { Planet } from "./planet.js";
import { SCALE_FACTOR, ASTRONOMICAL_UNIT, SUN_DIAMETER } from "./constants.js";
import { UI } from "./ui/UI.js";
import { UIShader } from './ui/UIShader.js';
import { CELESTIAL_BODIES } from './data/celestialBodies.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

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
      console.log(CELESTIAL_BODIES.saturn.ringInnerRadius);
      console.log(CELESTIAL_BODIES.saturn.ringOuterRadius);
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

/*
 * Initialize the scene
 */
function init() {
  // Create scene
  scene = new THREE.Scene();
  
  // Add background
  addCubeBackground(scene);
  
  // Initialize renderer first
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById('canvas-container').appendChild(renderer.domElement);
  
  // Now create camera with renderer
  const cameraSetup = createCamera(renderer, scale);
  camera = cameraSetup.camera;
  controls = cameraSetup.controls;
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // Reduced intensity
  scene.add(ambientLight);
  
  // Initialize planets
  Object.entries(CELESTIAL_BODIES).forEach(([name, data]) => {
    let normalMapPath = null;
    let specularMapPath = null;
    let cloudsMapPath = null;
    let bumpMapPath = null;
    let ringMapPath = null;
    let ringInnerRadius = null;
    let ringOuterRadius = null;

    if (name.toLowerCase() === 'earth') {
      normalMapPath = data.normalMap;
      specularMapPath = data.specularMap;
      cloudsMapPath = data.cloudMap;
      bumpMapPath = data.bumpMap;
    }

    // Define ring properties for Saturn and Uranus
    if (name.toLowerCase() === 'saturn' || name.toLowerCase() === 'uranus') {
      ringMapPath = data.ringMap; // Ensure this path is correct
      console.log("Planet:", name);
      console.log("Ring inner radius:", data.ringInnerRadius);
      console.log("Ring outer radius:", data.ringOuterRadius);
      ringInnerRadius = scale.size(data.ringInnerRadius); // Define in kilometers
      ringOuterRadius = scale.size(data.ringOuterRadius); // Define in kilometers
    }

    // Validation: Check if ring properties are defined if ringMapPath is provided
    if (ringMapPath && (!data.ringInnerRadius || !data.ringOuterRadius)) {
      console.error(`Ring properties missing for ${name}. Rings will not be created.`);
      ringMapPath = null;
      ringInnerRadius = null;
      ringOuterRadius = null;
    }

    // Create Planet instance with the name
    const planet = new Planet(
      name, // Pass the name
      scale.size(data.diameter / 2),
      data.texture,
      name.toLowerCase() === 'earth' ? data.normalMap : null,
      name.toLowerCase() === 'earth' ? data.specularMap : null,
      name.toLowerCase() === 'earth' ? data.bumpMap : null,
      name.toLowerCase() === 'earth' ? data.cloudMap : null,
      ringMapPath,          // Added ringMapPath
      ringInnerRadius,      // Added ringInnerRadius
      ringOuterRadius,      // Added ringOuterRadius
      [scale.distance(data.distance), 0, 0],
      data.axialTilt || 0
    );
    planet.mesh.name = name.toLowerCase();
    planetMeshes.push(planet);
    scene.add(planet.group);
  });

  // Create a custom material for the sun
  const sunRadius = planetMeshes[0].mesh.geometry.parameters.radius;
  const sunMaterial = createSunMaterial(sunRadius);
  planetMeshes[0].mesh.material = sunMaterial;

  // Add point light with adjusted properties
  const sunLight = new THREE.PointLight(0xffffff, 2, 0, 1);
  sunLight.position.set(0, 0, 0);
  sunLight.color.setHSL(0.1, 0.7, 0.95);
  planetMeshes[0].mesh.add(sunLight);

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

  // Add sun flare
  addSunFlare();

  createSunGlow();
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
    const target = planetMeshes[currentFocusIndex].group;
    controls.target.copy(target.position);
  }

  // Update UI shader
  if (uiShader) {
    uiShader.update();
  }

  updateZoomSpeed();
  controls.update();

  if (!isPaused) {
    // Update sun shader time uniform
    if (planetMeshes[0] && planetMeshes[0].mesh.material.uniforms) {
        planetMeshes[0].mesh.material.uniforms.time.value += 0.01 * timeScale;
        
        // Stabilize lens flare
        const sunMesh = planetMeshes[0].mesh;
        const lensflare = sunMesh.children.find(child => child instanceof Lensflare);
        if (lensflare) {
            lensflare.position.z = sunMesh.geometry.parameters.radius * 0.1;
        }
    }
  }

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
  const targetPlanet = planetMeshes[index];

  // Reset controls target to planet position
  controls.target.copy(targetPlanet.group.position);

  // Calculate appropriate viewing distance based on planet size
  const planetRadius = targetPlanet.mesh.geometry.parameters.radius;
  let viewDistance;

  if (targetPlanet.mesh.name === 'sun') {
    viewDistance = planetRadius * 5;
  } else if (['jupiter', 'saturn'].includes(targetPlanet.mesh.name)) {
    viewDistance = planetRadius * 8;
  } else if (['uranus', 'neptune'].includes(targetPlanet.mesh.name)) {
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
  camera.position.copy(targetPlanet.group.position).add(offset);

  // Update camera and controls
  camera.lookAt(targetPlanet.group.position);
  controls.update();

  // Update UI
  ui.updatePlanetInfo(targetPlanet.mesh);
  // Log info for debugging
  console.log(`Focused on ${targetPlanet.mesh.name}`);
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
    planetMeshes.forEach((planet) => {
      const radius = planet.mesh.geometry.parameters.radius;
      currentX += radius;
      planet.group.position.set(currentX, 0, 0);
      currentX += radius + scale.size(1000000);
    });
  } else {
    // Reset to original orbital positions
    Object.entries(CELESTIAL_BODIES).forEach(([name, data], index) => {
      planetMeshes[index].group.position.set(
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

function addSunFlare() {
    const textureLoader = new THREE.TextureLoader();
    const textureFlare = textureLoader.load('static/textures/lensflare/flare.png');
    
    const lensflare = new Lensflare();
    
    // Add main flare with reduced size and adjusted distance
    const mainFlare = new LensflareElement(textureFlare, 500, 0, new THREE.Color(1, 0.8, 0.5));
    lensflare.addElement(mainFlare);
    
    // Add more subtle secondary flares with better spacing
    lensflare.addElement(new LensflareElement(textureFlare, 150, 0.3, new THREE.Color(1, 0.9, 0.6)));
    lensflare.addElement(new LensflareElement(textureFlare, 100, 0.6, new THREE.Color(1, 0.8, 0.5)));
    lensflare.addElement(new LensflareElement(textureFlare, 80, 0.9, new THREE.Color(0.9, 0.7, 0.4)));
    
    // Position the flare slightly in front of the sun to prevent z-fighting
    lensflare.position.z = planetMeshes[0].mesh.geometry.parameters.radius * 0.1;
    
    planetMeshes[0].mesh.add(lensflare);
}

function createSunGlow() {
    const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load('static/textures/glow.png'),
        color: 0xffaa33,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.4
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    const sunRadius = planetMeshes[0].mesh.geometry.parameters.radius;
    sprite.scale.set(sunRadius * 4, sunRadius * 4, 1.0);
    
    // Create multiple layers of glow
    const innerGlow = sprite.clone();
    innerGlow.scale.set(sunRadius * 2.5, sunRadius * 2.5, 1.0);
    innerGlow.material = spriteMaterial.clone();
    innerGlow.material.opacity = 0.6;
    
    planetMeshes[0].mesh.add(sprite);
    planetMeshes[0].mesh.add(innerGlow);
}

function createSunMaterial(radius) {
    const textureLoader = new THREE.TextureLoader();
    const sunTexture = textureLoader.load(CELESTIAL_BODIES.sun.texture);
    
    return new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            radius: { value: radius },
            sunTexture: { value: sunTexture }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec2 vUv;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float radius;
            uniform sampler2D sunTexture;
            varying vec3 vNormal;
            varying vec2 vUv;
            
            // Noise functions
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            void main() {
                // Sample the base texture
                vec4 texColor = texture2D(sunTexture, vUv);
                
                // Create dynamic noise pattern
                float n = noise(vUv * 10.0 + time * 0.5);
                float n2 = noise(vUv * 20.0 - time * 0.3);
                
                // Create color variations
                vec3 color1 = vec3(1.0, 0.6, 0.1); // Bright orange
                vec3 color2 = vec3(1.0, 0.9, 0.3); // Bright yellow
                vec3 color3 = vec3(1.0, 0.4, 0.1); // Deep orange
                
                // Mix colors based on noise
                vec3 finalColor = mix(color1, color2, n);
                finalColor = mix(finalColor, color3, n2 * 0.5);
                
                // Add explosive patterns
                float explosion = noise(vUv * 15.0 + time * 0.8) * 
                                noise(vUv * 8.0 - time * 0.6);
                finalColor += vec3(1.0, 0.8, 0.3) * explosion * 0.3;
                
                // Add edge glow
                float rim = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 2.0);
                finalColor += vec3(1.0, 0.6, 0.2) * rim * 0.4;
                
                // Combine with original texture
                finalColor = mix(finalColor, texColor.rgb, 0.3);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
        transparent: true
    });
}

/*
 * Initialize the scene
 */
init();