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
     * @param {Number} axialTilt - The axial tilt angle
     */
    constructor(
        name,
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
        axialTilt
    ) {
        this.name = name;
        this.axialTilt = axialTilt;

        // Create a group to hold the planet
        this.group = new THREE.Group();

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
        const normalMap = normalMapPath
            ? textureLoader.load(
                  normalMapPath,
                  () => console.log(`Loaded normal map for ${name}`),
                  undefined,
                  (err) => console.error(`Error loading normal map for ${name}:`, err)
              )
            : null;
        if (normalMap) normalMap.encoding = THREE.LinearEncoding;

        // Specular map
        const specularMap = specularMapPath
            ? textureLoader.load(
                  specularMapPath,
                  () => console.log(`Loaded specular map for ${name}`),
                  undefined,
                  (err) => console.error(`Error loading specular map for ${name}:`, err)
              )
            : null;
        if (specularMap) specularMap.encoding = THREE.LinearEncoding;

        // Bump map
        const bumpMap = bumpMapPath
            ? textureLoader.load(
                  bumpMapPath,
                  () => console.log(`Loaded bump map for ${name}`),
                  undefined,
                  (err) => console.error(`Error loading bump map for ${name}:`, err)
              )
            : null;
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
            side: THREE.FrontSide,
        };

        // Create mesh with MeshPhongMaterial
        this.mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshPhongMaterial(materialOptions)
        );

        // Set up proper rotation order
        this.mesh.rotation.order = 'ZYX';

        // First rotate to align poles with Y-axis
        this.mesh.rotation.x = THREE.MathUtils.degToRad(0);

        // Then apply axial tilt around Z-axis
        this.mesh.rotation.z = THREE.MathUtils.degToRad(-this.axialTilt);



        // Add mesh to group
        this.group.add(this.mesh);

        // Set position on the group
        const validPosition = position.map((coord) => {
            if (isNaN(coord)) {
                console.error(`Invalid position coordinate for ${name}: ${coord}`);
                return 0;
            }
            return coord;
        });
        this.group.position.set(...validPosition);

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
                opacity: 0.5,
            });
            this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
            this.mesh.add(this.clouds); // Add clouds as a child of the planet mesh
        }

        // Add rings if ringMapPath is provided
        if (ringMapPath && ringInnerRadius && ringOuterRadius) {
            console.log(`Creating rings for ${name} with dimensions:`, {
                inner: ringInnerRadius,
                outer: ringOuterRadius,
            });

            const ringGeometry = new THREE.RingGeometry(
                ringInnerRadius,
                ringOuterRadius,
                128, // Segments around the ring
                4 // Radial segments
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

            // Rotate the rings to align with the planet's equatorial plane
            this.rings.rotation.x = Math.PI / 2;

            this.mesh.add(this.rings); // Add rings as a child of the planet mesh
        }
    }

    rotatePlanet(speed) {
        // Create the rotation quaternion
        const quaternion = new THREE.Quaternion();
        
        // Calculate the tilted rotation axis
        const axis = new THREE.Vector3(
            Math.sin(THREE.MathUtils.degToRad(this.axialTilt)), // X component
            Math.cos(THREE.MathUtils.degToRad(this.axialTilt)), // Y component
            0  // Z component
        );
        axis.normalize();
        
        // Create the rotation around the tilted axis
        quaternion.setFromAxisAngle(axis, speed);
        
        // Apply the rotation to the mesh
        this.mesh.quaternion.premultiply(quaternion);
    }

    rotateClouds() {
        if (this.clouds) {
            // Rotate clouds around the planet's Y-axis
            this.clouds.rotation.y += 0.01;
        }
    }
}
