import * as THREE from 'three';

/*
 * Planet class
 */
export class Planet {
    /*
     * Constructor
     * @param {Number} size - The size  
     * @param {String} texturePath - The texture path
     * @param {Array} position - The position
     * @param {Object} scale - The scale
     */
    constructor(size, texturePath, position, scale) {
        // Validate size
        if (isNaN(size) || size <= 0) {
            console.error(`Invalid planet size: ${size}`);
            size = 0.01; // fallback size
        }

        // Create geometry with validated size
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const texture = new THREE.TextureLoader().load(texturePath);
        const material = new THREE.MeshStandardMaterial({ map: texture });
        this.mesh = new THREE.Mesh(geometry, material);

        // Validate position
        const validPosition = position.map(coord => {
            if (isNaN(coord)) {
                console.error(`Invalid position coordinate: ${coord}`);
                return 0; // fallback position
            }
            return coord;
        });

        this.mesh.position.set(...validPosition);
    }
} 