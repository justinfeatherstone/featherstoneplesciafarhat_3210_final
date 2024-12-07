import * as THREE from 'three';
import { createCamera } from './camera.js';
import { Planet } from './planet.js';

let scene, renderer, camera, controls;

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

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Sun
    const sun = new Planet(5, 'static/textures/8k_sun.jpg', [50, 0, 0]);
    scene.add(sun.mesh);

    // Mercury
    const mercury = new Planet(2, 'static/textures/8k_mercury.jpg', [40, 0, 0]);
    scene.add(mercury.mesh);

    // Venus
    const venus = new Planet(4, 'static/textures/venus/8k_venus_surface.jpg', [30, 0, 0]);
    scene.add(venus.mesh);

    // Mars
    const mars = new Planet(5, 'static/textures/8k_mars.jpg', [15, 0, 0]);
    scene.add(mars.mesh);

    // Jupiter
    const jupiter = new Planet(15, 'static/textures/8k_jupiter.jpg', [-10, 0, 0]);
    scene.add(jupiter.mesh);

    // Saturn
    const saturn = new Planet(15, 'static/textures/saturn/8k_saturn.jpg', [-45, 0, 0]);
    scene.add(saturn.mesh);

    // Uranus
    const uranus = new Planet(15, 'static/textures/2k_uranus.jpg', [-80, 0, 0]);
    scene.add(uranus.mesh);

    // Neptune
    const neptune = new Planet(15, 'static/textures/2k_neptune.jpg', [-115, 0, 0]);
    scene.add(neptune.mesh);




    

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init(); 