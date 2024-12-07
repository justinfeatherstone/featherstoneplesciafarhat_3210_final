import * as THREE from "three";
import { createCamera } from "./camera.js";
import { Planet } from "./planet.js";
import { SCALE_FACTOR, ASTRONOMICAL_UNIT, SUN_DIAMETER } from "./constants.js";
let scene, renderer, camera, controls;
let currentFocusIndex = 0; // -1 means no focus
let planetMeshes = []; // Array to store all planet meshes in order
let isComparisonView = false;

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

// Real planet data
const PLANETS = {
    sun: {
        diameter: 1392684,
        distance: 0,
        texture: "static/textures/8k_sun.jpg"
    },
    mercury: {
        diameter: 4879,
        distance: 57909175,
        texture: "static/textures/8k_mercury.jpg"
    },
    venus: {
        diameter: 12104,
        distance: 108208930,
        texture: "static/textures/venus/8k_venus_surface.jpg"
    },
    earth: {
        diameter: 12742,
        distance: 149597890,
        texture: "static/textures/earth/8k_earth_daymap.jpg"
    },
    mars: {
        diameter: 6779,
        distance: 227936640,
        texture: "static/textures/8k_mars.jpg"
    },
    jupiter: {
        diameter: 139820,
        distance: 778412010,
        texture: "static/textures/8k_jupiter.jpg"
    },
    saturn: {
        diameter: 116460,
        distance: 1426725400,
        texture: "static/textures/saturn/8k_saturn.jpg"
    },
    uranus: {
        diameter: 50724,
        distance: 2870972200,
        texture: "static/textures/2k_uranus.jpg"
    },
    neptune: {
        diameter: 49244,
        distance: 4498252900,
        texture: "static/textures/2k_neptune.jpg"
    }
};

// REFACTOR LATER
// Optimization? When first loading a planet its slow to load, 
// but once loaded it's fast, we should preload all the textures
// and then just animate them in and out.
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

  //ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  addCubeBackground(scene);

  // Create planets
  Object.entries(PLANETS).forEach(([name, data]) => {
    const planet = new Planet(
        scale.size(data.diameter / 2),
        data.texture,
        [scale.distance(data.distance), 0, 0],
        scale
    );
    planet.mesh.name = name;
    planetMeshes.push(planet.mesh);
    scene.add(planet.mesh);
  });
  updatePlanetPositions();
  focusOnPlanet(currentFocusIndex);

  animate();
  window.addEventListener('keydown', handleKeyPress);
  console.log("Press 'C' to toggle comparison view");
}

function animate() {
    requestAnimationFrame(animate);
    
    updateZoomSpeed();
    controls.update();
    
    if (currentFocusIndex >= 0) {
        const target = planetMeshes[currentFocusIndex];
        controls.target.copy(target.position);
    }
    
    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function focusOnPlanet(index) {
    if (index < 0 || index >= planetMeshes.length) return;
    
    currentFocusIndex = index;
    const targetPlanet = planetMeshes[index];
    
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
    const offsetRatio = 0.5; // Adjust this to change viewing angle
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
    
    // Log info for debugging
    console.log(`Focused on ${targetPlanet.name}`);
    console.log(`Planet radius: ${planetRadius}`);
    console.log(`View distance: ${viewDistance}`);
}

function handleKeyPress(event) {
    switch(event.key) {
        case 'ArrowRight':
            focusOnPlanet((currentFocusIndex + 1) % planetMeshes.length);
            console.log("Planet:", planetMeshes[currentFocusIndex]);
            break;
        case 'ArrowLeft':
            console.log("ArrowLeft");
            focusOnPlanet(currentFocusIndex <= 0 ? 
                planetMeshes.length - 1 : currentFocusIndex - 1);
            break;
        case 'Escape':
            // Reset to default view
            currentFocusIndex = -1;
            controls.target.set(0, 0, 0);
            camera.position.set(0, scale.distance(ASTRONOMICAL_UNIT * 2), 
                              scale.distance(ASTRONOMICAL_UNIT * 2));
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

function updateZoomSpeed() {
    if (currentFocusIndex >= 0) {
        const targetPlanet = planetMeshes[currentFocusIndex];
        const planetRadius = targetPlanet.geometry.parameters.radius;
        
        // Adjust zoom speed based on planet size
        const zoomSpeed = Math.max(0.5, planetRadius * 0.5);
        controls.zoomSpeed = zoomSpeed;
    } else {
        // Default zoom speed for solar system view
        controls.zoomSpeed = 1.0;
    }
}

function updatePlanetPositions() {
    if (isComparisonView) {
        // Place planets side by side with small gaps
        let currentX = 0;
        planetMeshes.forEach((planetMesh) => {
            const radius = planetMesh.geometry.parameters.radius;
            currentX += radius; // Start at edge of previous planet
            planetMesh.position.set(currentX, 0, 0);
            currentX += radius + scale.size(1000000); // Add gap between planets
        });
    } else {
        // Reset to original orbital positions
        Object.entries(PLANETS).forEach(([name, data], index) => {
            planetMeshes[index].position.set(
                scale.distance(data.distance),
                0,
                0
            );
        });
    }
}

init();
