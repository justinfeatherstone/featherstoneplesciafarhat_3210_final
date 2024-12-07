import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ASTRONOMICAL_UNIT } from './constants.js';

export function createCamera(renderer, scale) {
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.0001,
        scale.distance(ASTRONOMICAL_UNIT * 50)
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.0001;
    controls.maxDistance = scale.distance(ASTRONOMICAL_UNIT * 40);
    controls.enableZoom = true;
    
    return { camera, controls };
}
