import * as THREE from 'three';

/*
 * Planet class
 */
export class Planet {
    /*
     * Constructor
     * @param {String} name - The name of the planet
     * @param {Number} size - The size
     * @param {String} texturePath - The texture path
     * @param {String} normalMapPath - The normal map path
     * @param {String} specularMapPath - The specular map path
     * @param {String} bumpMapPath - The bump map path
     * @param {String} cloudsMapPath - The clouds texture path
     * @param {String} ringMapPath - The ring texture path (optional)
     * @param {Number} ringInnerRadius - Inner radius of the ring (optional)
     * @param {Number} ringOuterRadius - Outer radius of the ring (optional)
     * @param {Array} position - The position
     * @param {Object} scale - The scale
     */
    constructor(
        name, // Added name parameter
        size,
        texturePath,
        normalMapPath,
        specularMapPath,
        bumpMapPath,
        cloudsMapPath,
        ringMapPath = null,
        ringInnerRadius = null,
        ringOuterRadius = null,
        position,
        scale
    ) {
        this.name = name; // Store the name for reference

        // Validate size
        if (isNaN(size) || size <= 0) {
            console.error(`Invalid planet size for ${name}: ${size}`);
            size = 0.01; // fallback size
        }

        // Create geometry with validated size
        const geometry = new THREE.SphereGeometry(size, 64, 64);

        // Load textures with proper settings
        const textureLoader = new THREE.TextureLoader();
        
        // Base color texture
        const texture = textureLoader.load(
            texturePath,
            () => console.log(`Loaded texture for ${name}`),
            undefined,
            (err) => console.error(`Error loading texture for ${name}:`, err)
        );
        texture.encoding = THREE.sRGBEncoding;
        
        // Normal map
        const normalMap = normalMapPath ? textureLoader.load(
            normalMapPath,
            () => console.log(`Loaded normal map for ${name}`),
            undefined,
            (err) => console.error(`Error loading normal map for ${name}:`, err)
        ) : null;
        if (normalMap) normalMap.encoding = THREE.LinearEncoding;
        
        // Specular map
        const specularMap = specularMapPath ? textureLoader.load(
            specularMapPath,
            () => console.log(`Loaded specular map for ${name}`),
            undefined,
            (err) => console.error(`Error loading specular map for ${name}:`, err)
        ) : null;
        if (specularMap) specularMap.encoding = THREE.LinearEncoding;
        
        // Bump map
        const bumpMap = bumpMapPath ? textureLoader.load(
            bumpMapPath,
            () => console.log(`Loaded bump map for ${name}`),
            undefined,
            (err) => console.error(`Error loading bump map for ${name}:`, err)
        ) : null;
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
                console.error(`Invalid position coordinate for ${name}: ${coord}`);
                return 0; // fallback position
            }
            return coord;
        });

        this.mesh.position.set(...validPosition);

        // Add clouds if cloudsMapPath is provided
        if (cloudsMapPath) {
            const cloudsGeometry = new THREE.SphereGeometry(size * 1.01, 64, 64); // Slightly larger to prevent z-fighting
            const cloudsMaterial = new THREE.MeshPhongMaterial({
                map: textureLoader.load(
                    cloudsMapPath,
                    () => console.log(`Loaded clouds map for ${name}`),
                    undefined,
                    (err) => console.error(`Error loading clouds map for ${name}:`, err)
                ),
                transparent: true,
                opacity: 0.5
            });
            this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
            this.mesh.add(this.clouds);
        }

        // Add rings if ringMapPath is provided
        if (ringMapPath && ringInnerRadius && ringOuterRadius) {
            console.log(`Creating rings for ${name} with dimensions:`, {
                inner: ringInnerRadius,
                outer: ringOuterRadius
            });

            const ringGeometry = new THREE.RingGeometry(
                ringInnerRadius,
                ringOuterRadius,
                128, // Increased segments for smoothness
                16,  // Increased segments for smoothness
                0,
                Math.PI * 2
            );

            const ringTexture = textureLoader.load(
                ringMapPath,
                () => console.log(`Loaded ring texture for ${name}`),
                undefined,
                (err) => console.error(`Error loading ring texture for ${name}:`, err)
            );
            ringTexture.encoding = THREE.sRGBEncoding;
            ringTexture.wrapS = THREE.RepeatWrapping;
            ringTexture.wrapT = THREE.RepeatWrapping;

            // Use MeshPhongMaterial for lighting effects
            const ringMaterial = new THREE.MeshPhongMaterial({
                map: ringTexture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                alphaTest: 0.5,
                blending: THREE.NormalBlending,
                depthWrite: false,
            });

            this.rings = new THREE.Mesh(ringGeometry, ringMaterial);

            // Rotate the ring based on the planet's name
            if (name.toLowerCase() === 'saturn') {
                // Rotate Saturn's rings to lie flat on the equatorial plane
                this.rings.rotation.x = -Math.PI / 2;
            } else if (name.toLowerCase() === 'uranus') {
                // Rotate Uranus's rings to be tilted at 90 degrees
                this.rings.rotation.y = Math.PI / 2;
            }

            // Ensure no scaling is initially applied
            this.rings.scale.set(1, 1, 1);

            this.mesh.add(this.rings);
            console.log(`Added rings to ${name}`);
        }
    }

    rotateRings() {
        if (this.rings) {
            this.rings.rotation.y += 0.01;
        }
    }

    rotatePlanet() {
        this.mesh.rotation.y += 0.01;
    }

    rotateClouds() {
        if (this.clouds) {
            this.clouds.rotation.y += 0.01;
        }
    }
}
