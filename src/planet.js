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
     * @param {Number} axialTilt - The axial tilt angle
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
        scale,
        axialTilt
    ) {
        this.name = name; // Store the name for reference
        this.axialTilt = axialTilt;

        // Create a group to hold the planet and apply tilt to everything
        this.group = new THREE.Group();
        
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
                128, // Segments around the ring
                4    // Radial segments
            );

            // Modify UVs to wrap the texture correctly
            const pos = ringGeometry.attributes.position;
            const uv = ringGeometry.attributes.uv;
            const v3 = new THREE.Vector3();

            for (let i = 0; i < pos.count; i++) {
                v3.fromBufferAttribute(pos, i);
                
                // Calculate angle and normalize to 0-1 range
                const angle = Math.atan2(v3.y, v3.x);
                let u = angle / (Math.PI * 2);
                if (u < 0) u += 1; // Ensure u is in 0-1 range
                
                // Calculate normalized radius for v coordinate
                const radius = v3.length();
                const v = (radius - ringInnerRadius) / (ringOuterRadius - ringInnerRadius);
                
                // Rotate UVs by 90 degrees by swapping and adjusting coordinates
                uv.setXY(i, v, u);
            }

            const ringTexture = textureLoader.load(
                ringMapPath,
                () => console.log(`Loaded ring texture for ${name}`),
                undefined,
                (err) => console.error(`Error loading ring texture for ${name}:`, err)
            );

            ringTexture.encoding = THREE.sRGBEncoding;
            ringTexture.wrapS = THREE.RepeatWrapping;
            ringTexture.wrapT = THREE.RepeatWrapping;

            const ringMaterial = new THREE.MeshPhongMaterial({
                map: ringTexture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 1.0,
                alphaTest: 0.1,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });

            this.rings = new THREE.Mesh(ringGeometry, ringMaterial);

            // Apply proper rotation based on planet
            if (name.toLowerCase() === 'saturn') {
                this.rings.rotation.x = Math.PI / 2;
                ringMaterial.opacity = 0.9;
            } else if (name.toLowerCase() === 'uranus') {
                this.rings.rotation.x = Math.PI / 2;
                ringMaterial.opacity = 0.8;
            }

            this.mesh.add(this.rings);
        }
        
        this.applyAxialTilt();

        // Add mesh to group instead of directly using it
        this.group.add(this.mesh);
    }

    applyAxialTilt() {
        // Convert degrees to radians and apply tilt
        const tiltRadians = THREE.MathUtils.degToRad(this.axialTilt);
        this.group.rotation.z = tiltRadians;
    }

    rotatePlanet(speed) {
        // Rotate around the tilted axis
        this.mesh.rotation.y += speed;
    }

    rotateRings() {
        if (this.rings) {
            this.rings.rotation.y += 0.01;
        }
    }

    rotateClouds() {
        if (this.clouds) {
            this.clouds.rotation.y += 0.01;
        }
    }
}
