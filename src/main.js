import * as THREE from "three";
import { createCamera } from "./camera.js";
import { Planet } from "./planet.js";

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

// REFACTOR LATER
function init() {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const { camera: cam, controls: ctrl } = createCamera(renderer);
  camera = cam;
  controls = ctrl;

  const light = new THREE.PointLight(0xffffff, 1, 0);
  light.position.set(0, 0, 0);
  scene.add(light);

  //ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  addCubeBackground(scene);

  // Define scaling factors
  const scale = {
    size: 10, // Adjust this to scale planet sizes
    distance: 10, // Adjust this to scale distances
  };

  //Sun
  const sun = new Planet(
    109,
    "static/textures/8k_sun.jpg",
    [200, 0, 0],
    scale
  );
  scene.add(sun.mesh);

  // Mercury
  const mercury = new Planet(
    0.38,
    "static/textures/8k_mercury.jpg",
    [40, 0, 0],
    scale
  );
  scene.add(mercury.mesh);

  // Venus
  const venus = new Planet(
    0.95,
    "static/textures/venus/8k_venus_surface.jpg",
    [30, 0, 0],
    scale
  );
  scene.add(venus.mesh);

  const earth = new Planet(
    1,
    "static/textures/earth/8k_earth_daymap.jpg",
    [10, 0, 0],
    scale
  );
  scene.add(earth.mesh);

  // Mars
  const mars = new Planet(
    0.53,
    "static/textures/8k_mars.jpg",
    [15, 0, 0],
    scale
  );
  scene.add(mars.mesh);

  // Jupiter
  const jupiter = new Planet(
    11.2,
    "static/textures/8k_jupiter.jpg",
    [-10, 0, 0],
    scale
  );
  scene.add(jupiter.mesh);

  // Saturn
  const saturn = new Planet(
    9.45,
    "static/textures/saturn/8k_saturn.jpg",
    [-45, 0, 0],
    scale
  );
  scene.add(saturn.mesh);

  // Uranus
  const uranus = new Planet(
    4.01,
    "static/textures/2k_uranus.jpg",
    [-80, 0, 0],
    scale
  );
  scene.add(uranus.mesh);

  // Neptune
  const neptune = new Planet(
    3.88,
    "static/textures/2k_neptune.jpg",
    [-115, 0, 0],
    scale
  );
  scene.add(neptune.mesh);

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
