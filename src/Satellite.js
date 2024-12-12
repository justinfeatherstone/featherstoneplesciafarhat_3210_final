import * as THREE from "three";

export class Satellite {
  constructor(
    name,
    size,
    texturePath,
    axialTilt,
    orbitalElements,
    parentPlanet,
    scale
  ) {
    this.name = name;
    this.size = size;
    this.axialTilt = axialTilt;
    this.orbitalElements = orbitalElements;
    this.parentPlanet = parentPlanet;
    this.scale = scale;

    // Create a group for the satellite
    this.group = new THREE.Group();
    this.group.name = name.toLowerCase();

    // Create the satellite mesh
    const geometry = new THREE.SphereGeometry(this.size, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(texturePath);
    const material = new THREE.MeshPhongMaterial({ map: texture });
    this.mesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mesh);

    // Add the satellite group to the parent planet's group
    this.parentPlanet.group.add(this.group);
  }

  /**
   * Calculate the satellite's position based on Keplerian orbital elements
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
    const iRad = THREE.MathUtils.degToRad(i);
    const ΩRad = THREE.MathUtils.degToRad(Ω);
    const ωRad = THREE.MathUtils.degToRad(ω);
    const M0Rad = THREE.MathUtils.degToRad(M0);

    // Calculate mean anomaly (M) using the satellite's orbital period
    const meanMotion = (2 * Math.PI) / T; // Mean motion (rad/day)
    const M = meanMotion * timeElapsed + M0Rad;

    // Solve Kepler's Equation for Eccentric Anomaly (E)
    let E = M;
    let deltaE;
    do {
      deltaE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
      E += deltaE;
    } while (Math.abs(deltaE) > 1e-6);

    // Calculate true anomaly (ν)
    const ν = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );

    // Calculate distance from parent planet (r)
    const r = a * (1 - e * Math.cos(E));

    // Calculate position in satellite's orbital plane
    const x_orb = r * Math.cos(ν);
    const y_orb = r * Math.sin(ν);
    const z_orb = 0;

    // Create rotation matrix for orbital orientation
    const rotationMatrix = new THREE.Matrix4();
    
    // Apply rotations in correct order for satellite orbit
    rotationMatrix.makeRotationZ(ΩRad);                                    // Longitude of ascending node
    rotationMatrix.multiply(new THREE.Matrix4().makeRotationX(iRad));      // Inclination
    rotationMatrix.multiply(new THREE.Matrix4().makeRotationZ(ωRad));      // Argument of periapsis

    // Apply rotation to position vector
    const position = new THREE.Vector3(x_orb, y_orb, z_orb).applyMatrix4(rotationMatrix);

    // Scale the position to match the scene scale
    const scaledPosition = this.scale.distanceVector(position.multiplyScalar(0.001)); // Scale down for satellite orbits

    // Set the satellite's position relative to parent's center
    this.group.position.copy(scaledPosition);
  }

  /**
   * Rotate the satellite around its own axis
   * @param {Number} speed - Rotation speed
   **/
  rotateSatellite(speed) {
    const quaternion = new THREE.Quaternion();
    const axis = new THREE.Vector3(
      Math.sin(THREE.MathUtils.degToRad(this.axialTilt)),
      Math.cos(THREE.MathUtils.degToRad(this.axialTilt)),
      0
    ).normalize();
    
    quaternion.setFromAxisAngle(axis, speed);
    this.mesh.quaternion.premultiply(quaternion);
  }
}
