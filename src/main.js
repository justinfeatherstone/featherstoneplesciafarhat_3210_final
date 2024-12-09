import * as THREE from "three";
import { createCamera } from "./camera.js";
import { Planet } from "./planet.js";
import { SCALE_FACTOR, ASTRONOMICAL_UNIT, SUN_DIAMETER } from "./constants.js";
import { UI } from "./ui/UI.js";
import { UIShader } from "./ui/UIShader.js";
import { CELESTIAL_BODIES } from "./data/celestialBodies.js";
import { Lensflare, LensflareElement } from "three/addons/objects/Lensflare.js";

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
    "static/textures/stars_milky_way/px.jpg", // right
    "static/textures/stars_milky_way/nx.jpg", // left
    "static/textures/stars_milky_way/py.jpg", // top
    "static/textures/stars_milky_way/ny.jpg", // bottom
    "static/textures/stars_milky_way/pz.jpg", // front
    "static/textures/stars_milky_way/nz.jpg", // back
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
  },
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
  document.getElementById("canvas-container").appendChild(renderer.domElement);

  // Now create camera with renderer
  const cameraSetup = createCamera(renderer, scale);
  camera = cameraSetup.camera;
  controls = cameraSetup.controls;

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Slightly increased intensity
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
    let nightTexturePath = null;

    if (name.toLowerCase() === "earth") {
      normalMapPath = data.normalMap;
      specularMapPath = data.specularMap;
      cloudsMapPath = data.cloudMap;
      bumpMapPath = data.bumpMap;
      nightTexturePath = data.nightTexture;
    }

    // Define ring properties for Saturn and Uranus
    if (name.toLowerCase() === "saturn" || name.toLowerCase() === "uranus") {
      ringMapPath = data.ringMap; // Ensure this path is correct
      console.log("Planet:", name);
      console.log("Ring inner radius:", data.ringInnerRadius);
      console.log("Ring outer radius:", data.ringOuterRadius);
      ringInnerRadius = scale.size(data.ringInnerRadius); // Define in kilometers
      ringOuterRadius = scale.size(data.ringOuterRadius); // Define in kilometers
    }

    // Validation: Check if ring properties are defined if ringMapPath is provided
    if (ringMapPath && (!data.ringInnerRadius || !data.ringOuterRadius)) {
      console.error(
        `Ring properties missing for ${name}. Rings will not be created.`
      );
      ringMapPath = null;
      ringInnerRadius = null;
      ringOuterRadius = null;
    }

    // Create Planet instance with the name
    const planet = new Planet(
      name, // Pass the name
      scale.size(data.diameter / 2),
      data.texture,
      nightTexturePath, // Pass the night texture path
      name.toLowerCase() === "earth" ? data.normalMap : null,
      name.toLowerCase() === "earth" ? data.specularMap : null,
      name.toLowerCase() === "earth" ? data.bumpMap : null,
      name.toLowerCase() === "earth" ? data.cloudMap : null,
      ringMapPath, // Added ringMapPath
      ringInnerRadius, // Added ringInnerRadius
      ringOuterRadius, // Added ringOuterRadius
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
  const sunLight = new THREE.PointLight(0xffffff, 2.5, 0);
  sunLight.position.set(0, 0, 0);
  sunLight.color.setHSL(0.1, 0.7, 0.95);
  sunLight.decay = 0;

  // Get the sun's center position
  const sunCenter = new THREE.Vector3();
  planetMeshes[0].mesh.getWorldPosition(sunCenter);
  sunLight.position.copy(sunCenter);

  planetMeshes[0].mesh.add(sunLight);

  // Add a secondary light for better coverage
  const secondarySunLight = new THREE.DirectionalLight(0xffffff, 0.5);
  secondarySunLight.position.set(0, 0, 0);
  scene.add(secondarySunLight);

  // Initialize UI with navigation callback before focusing on a planet
  ui = new UI(CELESTIAL_BODIES, handleNavigate);

  // Focus on the initial planet (Sun) after UI is initialized
  updatePlanetPositions();
  focusOnPlanet(currentFocusIndex);

  animate();
  window.addEventListener("keydown", handleKeyPress);
  console.log("Press 'C' to toggle comparison view");

  uiShader = new UIShader();

  // Add event listeners for UI buttons
  document.querySelectorAll(".control-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const action = event.target.dataset.action;
      switch (action) {
        case "compare":
          handleKeyPress({ key: "c" });
          break;
        case "reset":
          handleKeyPress({ key: "Escape" });
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
    newIndex =
      currentFocusIndex <= 0 ? planetMeshes.length - 1 : currentFocusIndex - 1;
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
      const celestialBody =
        CELESTIAL_BODIES[Object.keys(CELESTIAL_BODIES)[index]];
      let rotationSpeed = 0;

      if (celestialBody.rotation_period) {
        switch (celestialBody.name.toLowerCase()) {
          case "sun":
            // Sun rotates every 27 Earth days - very slow rotation
            rotationSpeed =
              (1 / celestialBody.rotation_period) * 0.005 * timeScale;
            break;
          case "mercury":
            // Mercury: 58.646 Earth days
            rotationSpeed =
              (1 / celestialBody.rotation_period) * 0.02 * timeScale;
            break;
          case "venus":
            // Venus: -243 Earth days (retrograde)
            rotationSpeed =
              (1 / Math.abs(celestialBody.rotation_period)) * 0.02 * timeScale;
            if (celestialBody.rotation_period < 0) rotationSpeed *= -1;
            break;
          case "earth":
            // Earth: 23.934 hours
            rotationSpeed =
              (1 / (celestialBody.rotation_period / 24)) * 0.04 * timeScale;
            break;
          case "mars":
            // Mars: 24.62 hours
            rotationSpeed =
              (1 / (celestialBody.rotation_period / 24)) * 0.04 * timeScale;
            break;
          case "jupiter":
            // Jupiter: 9.93 hours (fastest rotating planet)
            rotationSpeed =
              (1 / (celestialBody.rotation_period / 24)) * 0.06 * timeScale;
            break;
          case "saturn":
            // Saturn: 10.66 hours
            rotationSpeed =
              (1 / (celestialBody.rotation_period / 24)) * 0.06 * timeScale;
            break;
          case "uranus":
            // Uranus: -17 hours (retrograde)
            rotationSpeed =
              (1 / Math.abs(celestialBody.rotation_period / 24)) *
              0.04 *
              timeScale;
            if (celestialBody.rotation_period < 0) rotationSpeed *= -1;
            break;
          case "neptune":
            // Neptune: 16.08 hours
            rotationSpeed =
              (1 / (celestialBody.rotation_period / 24)) * 0.04 * timeScale;
            break;
          case "pluto":
            // Pluto: 6.39 Earth days
            rotationSpeed =
              (1 / celestialBody.rotation_period) * 0.02 * timeScale;
            break;
          default:
            rotationSpeed = 0.001; // reduced fallback rotation speed
        }
      }

      planet.rotatePlanet(rotationSpeed);
    });
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
    }
  }

  const sunLight = planetMeshes[0].mesh.children.find(
    (child) => child instanceof THREE.PointLight
  );
  if (sunLight) {
    // More subtle pulsing
    const pulseIntensity = 2.3 + Math.sin(Date.now() * 0.0005) * 0.2;
    sunLight.intensity = pulseIntensity;
  }

  updateLights();

  // Update the light direction and camera position for Earth's shader material
  const earthPlanet = planetMeshes.find(
    (planet) => planet.name.toLowerCase() === "earth"
  );
  if (earthPlanet && earthPlanet.mesh.material.uniforms) {
    const sunPlanet = planetMeshes.find(
      (planet) => planet.name.toLowerCase() === "sun"
    );
    if (sunPlanet) {
      const sunPosition = new THREE.Vector3();
      sunPlanet.mesh.getWorldPosition(sunPosition);

      const earthPosition = new THREE.Vector3();
      earthPlanet.mesh.getWorldPosition(earthPosition);

      const lightDirection = new THREE.Vector3()
        .subVectors(sunPosition, earthPosition)
        .normalize();
      earthPlanet.mesh.material.uniforms.lightDirection.value.copy(
        lightDirection
      );
    }
  }

  renderer.render(scene, camera);
  controls.update();

  if (!isPaused) {
    // Update Earth's shader uniforms
    const earth = planetMeshes.find((planet) => planet.mesh.name === "earth");
    if (earth && earth.mesh.material.uniforms.lightDirection) {
      const sunPosition = new THREE.Vector3(0, 0, 0); // Assuming the Sun is at the origin
      const earthPosition = new THREE.Vector3();
      earth.mesh.getWorldPosition(earthPosition);
      const lightDirection = sunPosition.clone().sub(earthPosition).normalize();
      earth.mesh.material.uniforms.lightDirection.value.copy(lightDirection);
      earth.mesh.material.uniforms.time.value += 0.1 * timeScale;
    }
  }
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

  if (targetPlanet.mesh.name === "sun") {
    viewDistance = planetRadius * 5;
  } else if (["jupiter", "saturn"].includes(targetPlanet.mesh.name)) {
    viewDistance = planetRadius * 8;
  } else if (["uranus", "neptune"].includes(targetPlanet.mesh.name)) {
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
    case "ArrowRight":
      handleNavigate(1);
      console.log("Planet:", planetMeshes[currentFocusIndex].name);
      break;
    case "ArrowLeft":
      console.log("ArrowLeft");
      handleNavigate(-1);
      break;
    case "Escape":
      // Reset to default view
      currentFocusIndex = -1;
      controls.target.set(0, 0, 0);
      camera.position.set(
        scale.distance(ASTRONOMICAL_UNIT * 2),
        scale.distance(ASTRONOMICAL_UNIT * 2),
        scale.distance(ASTRONOMICAL_UNIT * 2)
      );
      break;
    case "c":
    case "C":
      isComparisonView = !isComparisonView;
      updatePlanetPositions();
      // Reset camera to view all planets
      currentFocusIndex = -1;
      controls.target.set(0, 0, 0);
      const viewDistance = isComparisonView
        ? scale.size(SUN_DIAMETER * 2)
        : scale.distance(ASTRONOMICAL_UNIT * 2);
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
  const slider = document.getElementById("timeSlider");
  const timeValue = document.getElementById("timeValue");
  const pauseButton = document.getElementById("pauseButton");

  // Initialize slider to real-time
  slider.value = 0;
  timeScale = 1;

  slider.addEventListener("input", (e) => {
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

  pauseButton.addEventListener("click", () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
  });
}

function addSunFlare() {
  const textureLoader = new THREE.TextureLoader();
  const textureFlare = textureLoader.load(
    "static/textures/lensflare/flare.png"
  );

  const lensflare = new Lensflare();

  // Create a single, stronger main flare
  const mainFlare = new LensflareElement(
    textureFlare,
    600, // Slightly larger size
    0, // Distance from center
    new THREE.Color(1, 0.8, 0.5)
  );
  lensflare.addElement(mainFlare);

  // Add secondary flares with carefully chosen distances
  lensflare.addElement(
    new LensflareElement(
      textureFlare,
      120,
      0.6, // Distance from center
      new THREE.Color(1, 0.9, 0.6)
    )
  );

  lensflare.addElement(
    new LensflareElement(
      textureFlare,
      80,
      0.9, // Distance from center
      new THREE.Color(1, 0.8, 0.5)
    )
  );

  lensflare.addElement(
    new LensflareElement(
      textureFlare,
      60,
      1.2, // Distance from center
      new THREE.Color(0.9, 0.7, 0.4)
    )
  );

  // Position the flare at the sun's center
  lensflare.position.set(0, 0, 0);

  planetMeshes[0].mesh.add(lensflare);
}

function createSunGlow() {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: new THREE.TextureLoader().load("static/textures/glow.png"),
    color: 0xffaa33,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.3,
    depthTest: false, // Prevent z-fighting
    depthWrite: false, // Prevent z-fighting
  });

  const sunRadius = planetMeshes[0].mesh.geometry.parameters.radius;

  // Create multiple layers with different scales and slightly different positions
  const layers = [
    { scale: 4.0, opacity: 0.2, z: 0.1 },
    { scale: 3.0, opacity: 0.3, z: 0.05 },
    { scale: 2.5, opacity: 0.4, z: 0 },
  ];

  layers.forEach((layer) => {
    const sprite = new THREE.Sprite(spriteMaterial.clone());
    sprite.scale.set(sunRadius * layer.scale, sunRadius * layer.scale, 1.0);
    sprite.material.opacity = layer.opacity;
    sprite.position.z = layer.z;
    planetMeshes[0].mesh.add(sprite);
  });
}

function createSunMaterial(radius) {
  const textureLoader = new THREE.TextureLoader();
  const sunTexture = textureLoader.load(CELESTIAL_BODIES.sun.texture);

  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      radius: { value: radius },
      sunTexture: { value: sunTexture },
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
            
            void main() {
                // Sample the base texture
                vec4 texColor = texture2D(sunTexture, vUv);
                
                // Add pulsing effect
                float r = 0.95 + 0.05 * sin(vUv.y * 20.0 + time);
                
                // Mix texture with glow effects
                vec3 color = texColor.rgb * r;
                
                // Add pulsing glow
                float glow = 0.5 + 0.5 * sin(time * 2.0);
                color += vec3(0.8, 0.6, 0.3) * glow * 0.3;
                
                // Add edge glow
                float rim = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 3.0);
                color += vec3(1.0, 0.6, 0.3) * rim * 0.5;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    transparent: true,
  });
}

function updateLights() {
  if (!planetMeshes[0]) return;

  const sunCenter = new THREE.Vector3();
  planetMeshes[0].mesh.getWorldPosition(sunCenter);

  // Update point light position
  const sunLight = planetMeshes[0].mesh.children.find(
    (child) => child instanceof THREE.PointLight
  );
  if (sunLight) {
    sunLight.position.set(0, 0, 0);
  }

  // Update lens flare visibility and intensity
  const lensflare = planetMeshes[0].mesh.children.find(
    (child) => child instanceof Lensflare
  );
  if (!lensflare || !lensflare.elements) return;

  // Calculate angle between camera and sun
  const dirToCamera = new THREE.Vector3()
    .subVectors(camera.position, sunCenter)
    .normalize();
  const sunForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
    planetMeshes[0].mesh.quaternion
  );
  const angle = dirToCamera.dot(sunForward);

  // Adjust flare elements based on viewing angle
  const visibility = Math.max(0, (angle + 1) / 2); // Convert from [-1,1] to [0,1]

  // Check if elements array exists and has items
  if (Array.isArray(lensflare.elements) && lensflare.elements.length > 0) {
    lensflare.elements.forEach((element, index) => {
      if (element) {
        // Check if element exists
        if (index === 0) {
          // Main flare
          element.size = 600 * visibility;
        } else {
          // Secondary flares
          element.size = (120 / (index + 1)) * visibility;
        }
      }
    });
  }

  // Update directional light
  const secondarySunLight = scene.children.find(
    (child) => child instanceof THREE.DirectionalLight
  );
  if (secondarySunLight) {
    secondarySunLight.position.copy(sunCenter);
  }
}

/*
 * Initialize the scene
 */
init();
