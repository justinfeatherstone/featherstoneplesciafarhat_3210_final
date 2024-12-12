import * as THREE from "three";
import { CELESTIAL_BODIES } from "./data/CelestialBodies.js";
/**
 * Planet class
 **/
export class Planet {
  /**
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
   **/
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
    axialTilt,
    orbitalElements
  ) {
    // Set the name of the planet
    this.name = name;

    // Set the axial tilt of the planet
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
          (err) =>
            console.error(`Error loading night texture for ${name}:`, err)
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
    if (name.toLowerCase() === "earth" && nightTexture) {
      this.mesh = new THREE.Mesh(
        geometry,
        this.createEarthMaterial(
          dayTexture,
          nightTexture,
          specularMap,
          normalMap,
          cloudsMap
        )
      );
    } else if (name.toLowerCase() === "sun") {
      // Create a mesh for the sun with the sun material
      this.mesh = new THREE.Mesh(geometry, this.createSunMaterial(size));
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

      // Create a mesh for the planet with the standard material
      this.mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshPhongMaterial(materialOptions)
      );
    }

    // Set up proper rotation order and axial tilt
    this.mesh.rotation.order = "ZYX";
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

      // Create a ring geometry
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
        const v =
          (radius - ringInnerRadius) / (ringOuterRadius - ringInnerRadius);

        // Rotate UVs by 90 degrees by swapping and adjusting coordinates
        uv.setXY(i, v, u);
      }

      // Load the ring texture
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

      // Create a mesh for the rings
      this.rings = new THREE.Mesh(ringGeometry, ringMaterial);

      // Rotate the rings to align with the planet's equatorial plane
      this.rings.rotation.x = Math.PI / 2;

      this.mesh.add(this.rings); // Add rings as a child of the planet mesh
    }

    // Set the orbital elements
    this.orbitalElements = orbitalElements;

    // Set the orbital position
    this.orbitalPosition = new THREE.Vector3();
  }

  /**
   * Create custom shader material for Earth
   * @param {THREE.Texture} dayTexture - The day texture
   * @param {THREE.Texture} nightTexture - The night texture
   * @param {THREE.Texture} specularMap - The specular map
   * @param {THREE.Texture} normalMap - The normal map
   * @param {THREE.Texture} cloudsMap - The clouds map
   * @returns {THREE.ShaderMaterial} - The shader material
   **/
  createEarthMaterial(
    dayTexture,
    nightTexture,
    specularMap,
    normalMap,
    cloudsMap
  ) {
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
      // Vertex shader for the planet earth
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
      // Fragment shader for the planet earth
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

  /**
   * Create custom shader material for the sun
   * @param {Number} radius - The radius of the sun
   * @returns {THREE.ShaderMaterial} - The shader material
   **/
  createSunMaterial(radius) {
    const textureLoader = new THREE.TextureLoader();
    const sunTexture = textureLoader.load(CELESTIAL_BODIES.sun.texture);

    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        radius: { value: radius },
        sunTexture: { value: sunTexture },
      },
      // Vertex shader for the sun
      vertexShader: `
                  varying vec3 vNormal;
                  varying vec2 vUv;
                  
                  void main() {
                      vNormal = normalize(normalMatrix * normal);
                      vUv = uv;
                      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
              `,
      // Fragment shader for the sun
      fragmentShader: `
                  uniform float time;
                  uniform float radius;
                  uniform sampler2D sunTexture;
                  varying vec3 vNormal;
                  varying vec2 vUv;
                  
                  void main() {
                      // Sample the base texture
                      vec4 texColor = texture2D(sunTexture, vUv);
                      
                      // Add pulsing effect
                      float r = 0.95 + 0.05 * sin(vUv.y * 20.0 + time);
                      
                      // Mix texture with glow effects
                      vec3 color = texColor.rgb * r;
                      
                      // Add pulsing glow
                      float glow = 0.5 + 0.5 * sin(time * 2.0);
                      color += vec3(0.8, 0.6, 0.3) * glow * 0.3;
                      
                      // Add edge glow
                      float rim = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 3.0);
                      color += vec3(1.0, 0.6, 0.3) * rim * 0.5;
                      
                      gl_FragColor = vec4(color, 1.0);
                  }
              `,
      transparent: true,
    });
  }

  /**
   * Rotate the planet around its own axis
   * @param {Number} speed - The speed of the rotation
   **/
  rotatePlanet(speed) {
    // Create the rotation quaternion
    const quaternion = new THREE.Quaternion();

    // Calculate the tilted rotation axis
    const axis = new THREE.Vector3(
      Math.sin(THREE.MathUtils.degToRad(this.axialTilt)), // X component
      Math.cos(THREE.MathUtils.degToRad(this.axialTilt)), // Y component
      0 // Z component
    );
    axis.normalize();

    // Create the rotation around the tilted axis
    quaternion.setFromAxisAngle(axis, speed);

    // Apply the rotation to the mesh
    this.mesh.quaternion.premultiply(quaternion);
  }

  /**
   * Rotate the clouds around the planet's Y-axis
   **/
  rotateClouds() {
    if (this.clouds) {
      // Rotate clouds around the planet's Y-axis
      this.clouds.rotation.y += 0.01;
    }
  }

  /**
   * Calculate the planet's position based on Keplerian orbital elements
   * @param {Number} timeElapsed - Elapsed time in days
   **/
  calculateOrbitalPosition(timeElapsed) {
    const {
      semiMajorAxis: a,
      eccentricity: e,
      inclination: i,
      longitudeOfAscendingNode: Ω,
      argumentOfPeriapsis: ω,
      orbitalPeriod: T,
      meanAnomalyAtEpoch: M0,
    } = this.orbitalElements;

    // Convert angles from degrees to radians
    const inclination = THREE.MathUtils.degToRad(i);
    const longitudeOfAscendingNode = THREE.MathUtils.degToRad(Ω);
    const argumentOfPeriapsis = THREE.MathUtils.degToRad(ω);
    const meanAnomalyAtEpoch = THREE.MathUtils.degToRad(M0);

    // Calculate mean anomaly (M)
    const meanMotion = (2 * Math.PI) / T; // Mean motion (rad/day)
    const M = meanMotion * timeElapsed + meanAnomalyAtEpoch;

    // Solve Kepler's Equation for Eccentric Anomaly (E)
    let E = M;
    let deltaE;
    do {
      deltaE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
      E += deltaE;
    } while (Math.abs(deltaE) > 1e-6);

    // True Anomaly (ν)
    const ν =
      2 *
      Math.atan2(
        Math.sqrt(1 + e) * Math.sin(E / 2),
        Math.sqrt(1 - e) * Math.cos(E / 2)
      );

    // Distance (r)
    const r = a * (1 - e * Math.cos(E));

    // Heliocentric coordinates in orbital plane
    const x_orb = r * Math.cos(ν);
    const y_orb = r * Math.sin(ν);

    // Create rotation matrices in correct order
    const rotationMatrix = new THREE.Matrix4();

    // Then apply the orbital element rotations
    rotationMatrix.multiply(
      new THREE.Matrix4().makeRotationZ(longitudeOfAscendingNode)
    );
    rotationMatrix.multiply(new THREE.Matrix4().makeRotationX(inclination));
    rotationMatrix.multiply(
      new THREE.Matrix4().makeRotationZ(argumentOfPeriapsis)
    );

    // Apply rotation to position vector
    const position = new THREE.Vector3(x_orb, y_orb, 0).applyMatrix4(
      rotationMatrix
    );

    // Rotate the entire system around X-axis by 90 degrees
    const systemRotation = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    position.applyMatrix4(systemRotation);

    this.orbitalPosition.copy(position);

    // Update the planet's group position
    this.group.position.copy(this.orbitalPosition);
  }
}
