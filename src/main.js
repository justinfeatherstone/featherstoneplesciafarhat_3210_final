import * as THREE from "three";
import { createCamera } from "./camera.js";
import { Planet } from "./planet.js";
import { SCALE_FACTOR, ASTRONOMICAL_UNIT, SUN_DIAMETER } from "./constants.js";
let scene, renderer, camera, controls;

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
        diameter: 1392700,
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
        scale.size(data.diameter / 2), // Convert diameter to radius
        data.texture,
        [scale.distance(data.distance), 0, 0],
        scale
    );
    scene.add(planet.mesh);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
