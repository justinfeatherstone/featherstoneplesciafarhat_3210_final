import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ASTRONOMICAL_UNIT, SUN_DIAMETER, SCALE_FACTOR } from './constants.js';

export function createCamera(renderer, scale) {
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        scale.distance(ASTRONOMICAL_UNIT * 50) // View distance that covers the solar system
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = scale.distance(SUN_DIAMETER);
    controls.maxDistance = scale.distance(ASTRONOMICAL_UNIT * 40);
    controls.enableZoom = true;
    // Position camera at a good initial viewing distance
    camera.position.set(0, scale.distance(ASTRONOMICAL_UNIT * 2), scale.distance(ASTRONOMICAL_UNIT * 2));
    
    return { camera, controls };
}
