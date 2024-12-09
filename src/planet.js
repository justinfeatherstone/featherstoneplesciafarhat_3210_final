import * as THREE from 'three';

/*
 * Planet class
 */
export class Planet {
    /*
     * Constructor
     * @param {String} name - The name of the planet
     * @param {Number} size - The size
     * @param {String} texturePath - The day texture path
     * @param {String} nightTexturePath - The night texture path (optional)
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
        nightTexturePath = null,
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

        // Load the day texture
        const dayTexture = textureLoader.load(
            texturePath,
            () => console.log(`Loaded day texture for ${name}`),
            undefined,
            (err) => console.error(`Error loading day texture for ${name}:`, err)
        );
        dayTexture.encoding = THREE.sRGBEncoding;

        // Load the night texture if provided
        const nightTexture = nightTexturePath
            ? textureLoader.load(
                  nightTexturePath,
                  () => console.log(`Loaded night texture for ${name}`),
                  undefined,
                  (err) => console.error(`Error loading night texture for ${name}:`, err)
              )
            : null;
        if (nightTexture) nightTexture.encoding = THREE.sRGBEncoding;

        // Load other maps
        const normalMap = normalMapPath
            ? textureLoader.load(
                  normalMapPath,
                  () => console.log(`Loaded normal map for ${name}`),
                  undefined,
                  (err) => console.error(`Error loading normal map for ${name}:`, err)
              )
            : null;
        if (normalMap) normalMap.encoding = THREE.LinearEncoding;

        const specularMap = specularMapPath
            ? textureLoader.load(
                  specularMapPath,
                  () => console.log(`Loaded specular map for ${name}`),
                  undefined,
                  (err) => console.error(`Error loading specular map for ${name}:`, err)
              )
            : null;
        if (specularMap) specularMap.encoding = THREE.LinearEncoding;

        const bumpMap = bumpMapPath
            ? textureLoader.load(
                  bumpMapPath,
                  () => console.log(`Loaded bump map for ${name}`),
                  undefined,
                  (err) => console.error(`Error loading bump map for ${name}:`, err)
              )
            : null;
        if (bumpMap) bumpMap.encoding = THREE.LinearEncoding;

        // Load the clouds map if provided
        const cloudsMap = cloudsMapPath
            ? textureLoader.load(
                cloudsMapPath,
                () => console.log(`Loaded clouds map for ${name}`),
                undefined,
                (err) => console.error(`Error loading clouds map for ${name}:`, err)
            )
            : null;

        if (cloudsMap) {
            cloudsMap.encoding = THREE.sRGBEncoding;
        }

        // For Earth, if we have both day and night textures, use a custom shader material
        if (name.toLowerCase() === 'earth' && nightTexture) {
            this.mesh = new THREE.Mesh(
                geometry,
                this.createEarthMaterial(dayTexture, nightTexture, specularMap, normalMap, cloudsMap)
            );
        } else {
            // Use standard material for other planets
            const materialOptions = {
                map: dayTexture,
                normalMap: normalMap,
                normalScale: new THREE.Vector2(2, 2),
                bumpMap: bumpMap,
                bumpScale: 0.02,
                specularMap: specularMap,
                specular: new THREE.Color(0x333333),
                shininess: 25,
                side: THREE.FrontSide,
            };

            this.mesh = new THREE.Mesh(
                geometry,
                new THREE.MeshPhongMaterial(materialOptions)
            );
        }

        // Set up proper rotation order and axial tilt
        this.mesh.rotation.order = 'ZYX';
        this.mesh.rotation.x = THREE.MathUtils.degToRad(0);
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

    /*
     * Create custom shader material for Earth
     * @param {THREE.Texture} dayTexture - The day texture
     * @param {THREE.Texture} nightTexture - The night texture
     * @param {THREE.Texture} specularMap - The specular map
     * @param {THREE.Texture} normalMap - The normal map
     * @param {THREE.Texture} cloudsMap - The clouds map
     * @returns {THREE.ShaderMaterial} - The shader material
     */
    createEarthMaterial(dayTexture, nightTexture, specularMap, normalMap, cloudsMap) {
        return new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                specularMap: { value: specularMap },
                normalMap: { value: normalMap },
                cloudsMap: { value: cloudsMap },
                lightDirection: { value: new THREE.Vector3() },
                time: { value: 0.0 },
                cloudRotationSpeed: { value: 0.1 },
                specularIntensity: { value: 0.5 },
                axialTilt: { value: THREE.MathUtils.degToRad(this.axialTilt || 0) },
            },
            vertexShader: `
                precision highp float;

                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {
                    vUv = uv;
                    vNormal = normalize(mat3(modelMatrix) * normal);
                    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;

                    gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;

                uniform sampler2D dayTexture;
                uniform sampler2D nightTexture;
                uniform sampler2D specularMap;
                uniform sampler2D normalMap;
                uniform sampler2D cloudsMap;
                uniform vec3 lightDirection;
                uniform float time;
                uniform float cloudRotationSpeed;
                uniform float specularIntensity;
                uniform float axialTilt;

                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;

                // Function to apply rotation around an arbitrary axis
                vec3 rotateAroundAxis(vec3 position, vec3 axis, float angle) {
                    float cosAngle = cos(angle);
                    float sinAngle = sin(angle);
                    return position * cosAngle + cross(axis, position) * sinAngle + axis * dot(axis, position) * (1.0 - cosAngle);
                }

                void main() {
                    // Normalize interpolated normal
                    vec3 normal = normalize(vNormal);

                    // Compute the direction to the light source
                    vec3 lightDir = normalize(lightDirection);

                    // Compute diffuse lighting
                    float dotNL = max(dot(normal, lightDir), 0.0);

                    // Sample textures
                    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
                    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
                    vec3 specularColor = texture2D(specularMap, vUv).rgb;

                    // Blend between day and night textures based on illumination
                    vec3 color = mix(nightColor, dayColor, dotNL);

                    // Rotate cloud UV coordinates with axial tilt
                    float angle = time * cloudRotationSpeed;

                    // Convert vUv to 3D sphere coordinates
                    float theta = vUv.y * 3.1415926; // Latitudinal angle
                    float phi = vUv.x * 2.0 * 3.1415926; // Longitudinal angle

                    vec3 spherePosition = vec3(
                        sin(theta) * cos(phi),
                        sin(theta) * sin(phi),
                        cos(theta)
                    );

                    // Define the rotation axis accounting for axial tilt
                    vec3 tiltAxis = vec3(0.0, sin(axialTilt), cos(axialTilt));

                    // Rotate the point around the tilted axis
                    vec3 rotatedPosition = rotateAroundAxis(spherePosition, tiltAxis, angle);

                    // Convert back to spherical coordinates
                    float newTheta = acos(rotatedPosition.z);
                    float newPhi = atan(rotatedPosition.y, rotatedPosition.x);

                    // Convert back to UV coordinates
                    vec2 rotatedUV = vec2(newPhi / (2.0 * 3.1415926), newTheta / 3.1415926);

                    // Ensure UVs are in [0,1] range
                    rotatedUV = fract(rotatedUV);

                    // Sample rotated clouds
                    vec4 rotatedCloudsColor = texture2D(cloudsMap, rotatedUV);

                    // Adjust cloud opacity based on illumination, limiting max opacity to 0.7
                    float maxCloudOpacity = 0.7;
                    float baseCloudOpacity = 0.2;
                    float cloudOpacity = mix(baseCloudOpacity, min(rotatedCloudsColor.a, maxCloudOpacity), dotNL);

                    // Calculate cloud contribution
                    vec3 cloudContribution = rotatedCloudsColor.rgb * cloudOpacity;

                    // Blend clouds additively to brighten the base color
                    color += cloudContribution;

                    // Add specular highlights with reduced intensity
                    vec3 viewDir = normalize(cameraPosition - vPosition);
                    vec3 reflectDir = reflect(-lightDir, normal);
                    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
                    vec3 specular = specularColor * spec * specularIntensity;

                    color += specular;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            transparent: false,
            depthWrite: true,
        });
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
