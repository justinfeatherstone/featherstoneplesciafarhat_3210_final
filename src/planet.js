import * as THREE from 'three';

/*
 * Planet class
 */
export class Planet {
    /*
     * Constructor
     * @param {Number} size - The size  
     * @param {String} texturePath - The texture path
     * @param {String} normalMapPath - The normal map path
     * @param {String} specularMapPath - The specular map path
     * @param {String} bumpMapPath - The bump map path
     * @param {String} cloudsMapPath - The clouds texture path
     * @param {Array} position - The position
     * @param {Object} scale - The scale
     */
    constructor(size, texturePath, normalMapPath, specularMapPath, bumpMapPath, cloudsMapPath, position, scale) {
        // Validate size
        if (isNaN(size) || size <= 0) {
            console.error(`Invalid planet size: ${size}`);
            size = 0.01; // fallback size
        }

        // Create geometry with validated size
        const geometry = new THREE.SphereGeometry(size, 64, 64);

        // Load textures with proper settings
        const textureLoader = new THREE.TextureLoader();
        
        // Base color texture
        const texture = textureLoader.load(texturePath);
        texture.encoding = THREE.sRGBEncoding;
        
        // Normal map
        const normalMap = normalMapPath ? textureLoader.load(normalMapPath) : null;
        if (normalMap) normalMap.encoding = THREE.LinearEncoding;
        
        // Specular map
        const specularMap = specularMapPath ? textureLoader.load(specularMapPath) : null;
        if (specularMap) specularMap.encoding = THREE.LinearEncoding;
        
        // Bump map
        const bumpMap = bumpMapPath ? textureLoader.load(bumpMapPath) : null;
        if (bumpMap) bumpMap.encoding = THREE.LinearEncoding;

        // Define material properties
        const materialOptions = {
            normalMap: normalMap,
            map: texture,

            normalScale: new THREE.Vector2(2, 2), // Increased normal map effect
            bumpMap: bumpMap,
            bumpScale: 0.02,
            specularMap: specularMap,
            specular: new THREE.Color(0x333333),
            shininess: 25,
            side: THREE.FrontSide
        };

        // Create mesh with MeshPhongMaterial
        this.mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshPhongMaterial(materialOptions)
        );

        // Validate position
        const validPosition = position.map(coord => {
            if (isNaN(coord)) {
                console.error(`Invalid position coordinate: ${coord}`);
                return 0; // fallback position
            }
            return coord;
        });

        this.mesh.position.set(...validPosition);

        // Add clouds if cloudsMapPath is provided
        if (cloudsMapPath) {
            const cloudsGeometry = new THREE.SphereGeometry(size * 1.01, 64, 64); // Slightly larger to prevent z-fighting
            const cloudsMaterial = new THREE.MeshPhongMaterial({
                map: textureLoader.load(cloudsMapPath),
                transparent: true,
                opacity: 0.5
            });
            this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
            this.mesh.add(this.clouds);
        }
    }

    /*
     * Rotate the planet
     * @param {Number} delta - The rotation delta
     */
    rotatePlanet(delta) {
        // Rotate the planet itself
        this.mesh.rotation.y += delta;
        
        // Rotate clouds at a different speed and direction for more realism
        if (this.clouds) {
            // Make clouds rotate slightly faster and in a slightly different direction
            this.clouds.rotation.y += delta * 1.2;  // 20% faster than the planet
            this.clouds.rotation.x += delta * 0.1;  // Slight tilt in cloud movement
            this.clouds.rotation.z += delta * 0.05; // Very slight wobble
        }
    }
} 