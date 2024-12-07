import * as THREE from 'three';

export class Planet {
    constructor(size, texturePath, position, scale) {
        const geometry = new THREE.SphereGeometry(size * scale.size, 32, 32);
        const texture = new THREE.TextureLoader().load(texturePath);
        const material = new THREE.MeshStandardMaterial({ map: texture });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(...position.map(coord => coord * scale.distance));
    }
} 