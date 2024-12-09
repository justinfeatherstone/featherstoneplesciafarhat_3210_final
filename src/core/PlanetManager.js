import { Planet } from "../planet.js";
import { CELESTIAL_BODIES } from "../data/celestialBodies.js";
import { scale } from "./Utils.js";
import * as THREE from 'three';

export class PlanetManager {
  constructor(scale, sceneManager, scene) {
    this.scale = scale;
    this.sceneManager = sceneManager;
    this.scene = scene;
    this.planets = []; // Store instances of Planet
    this.currentFocusIndex = -1;
    this.currentViewDistance = null; // Add this line to store view distance
  }

  initPlanets() {
    Object.entries(CELESTIAL_BODIES).forEach(([name, data]) => {
      let normalMapPath = null;
      let specularMapPath = null;
      let cloudsMapPath = null;
      let bumpMapPath = null;
      let ringMapPath = null;
      let ringInnerRadius = null;
      let ringOuterRadius = null;
      let nightTexturePath = null;
      let orbitalElements = null;

      if (name.toLowerCase() === "earth") {
        normalMapPath = data.normalMap;
        specularMapPath = data.specularMap;
        cloudsMapPath = data.cloudMap;
        bumpMapPath = data.bumpMap;
        nightTexturePath = data.nightTexture;
      }

      // Define ring properties for Saturn and Uranus
      if (name.toLowerCase() === "saturn" || name.toLowerCase() === "uranus") {
        ringMapPath = data.ringMap; // Ensure this path is correct
        ringInnerRadius = scale.size(data.ringInnerRadius); // Define in kilometers
        ringOuterRadius = scale.size(data.ringOuterRadius); // Define in kilometers
      }

      // Assign orbitalElements if available
      if (data.orbitalElements) {
        orbitalElements = data.orbitalElements;
      } else {
        console.warn(`Orbital elements missing for ${name}. Planet motion will be static.`);
      }

      // Create Planet instance with orbital elements
      const planet = new Planet(
        name,
        scale.size(data.diameter / 2),
        data.texture,
        nightTexturePath, // Pass the night texture path
        name.toLowerCase() === "earth" ? data.normalMap : null,
        name.toLowerCase() === "earth" ? data.specularMap : null,
        name.toLowerCase() === "earth" ? data.bumpMap : null,
        name.toLowerCase() === "earth" ? data.cloudMap : null,
        ringMapPath, // Added ringMapPath
        ringInnerRadius, // Added ringInnerRadius
        ringOuterRadius, // Added ringOuterRadius
        [scale.distance(data.distance), 0, 0],
        data.axialTilt || 0,
        orbitalElements // exclude sun
      );
      planet.mesh.name = name.toLowerCase();
      this.planets.push(planet);
      this.sceneManager.scene.add(planet.group);
      console.log(planet);
      console.log(data.orbitalElements);

      // **Add Orbit Line**
      if (orbitalElements) {
        const orbit = this.createOrbitPath(orbitalElements, name);
        console.log("ORBIT", orbit);
        this.sceneManager.scene.add(orbit);
      }
    });
  }

  /**
   * Enhanced createOrbitPath with color differentiation.
   * @param {Object} orbitalElements - Keplerian orbital elements.
   * @param {String} planetName - Name of the planet for color selection.
   * @returns {THREE.Line} - The orbit line object.
   */
  createOrbitPath(orbitalElements, planetName) {
    const {
      semiMajorAxis: a,
      eccentricity: e,
      inclination: i,
      longitudeOfAscendingNode: Ω,
      argumentOfPeriapsis: ω,
      // orbitalPeriod: T, // Not needed for static orbit path
    } = orbitalElements;

    // Number of points to approximate the orbit
    const segments = 100;
    const points = [];

    for (let t = 0; t <= 2 * Math.PI; t += (2 * Math.PI) / segments) {
      // Solve Kepler's Equation for Eccentric Anomaly (E)
      let E = t;
      let deltaE;
      do {
        deltaE = (t - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
        E += deltaE;
      } while (Math.abs(deltaE) > 1e-6);

      // True Anomaly (ν)
      const ν = 2 * Math.atan2(
        Math.sqrt(1 + e) * Math.sin(E / 2),
        Math.sqrt(1 - e) * Math.cos(E / 2)
      );

      // Distance (r)
      const r = a * (1 - e * Math.cos(E));

      // Heliocentric coordinates in orbital plane
      const x_orb = r * Math.cos(ν);
      const y_orb = r * Math.sin(ν);
      const z_orb = 0;

      // Rotate to ecliptic coordinates
      const inclinationRad = THREE.MathUtils.degToRad(i);
      const longitudeOfAscendingNodeRad = THREE.MathUtils.degToRad(Ω);
      const argumentOfPeriapsisRad = THREE.MathUtils.degToRad(ω);

      // Rotation matrices
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationZ(-argumentOfPeriapsisRad);
      rotationMatrix.multiply(new THREE.Matrix4().makeRotationX(-inclinationRad));
      rotationMatrix.multiply(new THREE.Matrix4().makeRotationZ(-longitudeOfAscendingNodeRad));

      const position = new THREE.Vector3(x_orb, y_orb, z_orb).applyMatrix4(rotationMatrix);

      // **Scale the position to match scene scale**
      const scaledPosition = this.scale.distanceVector(position);
      points.push(scaledPosition);
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);

    // Define colors based on planet categories
    let color = 0xffffff; // Default white

    switch (planetName.toLowerCase()) {
      case 'mercury':
        color = 0xaaaaaa; // Grey
        break;
      case 'venus':
        color = 0xffaa00; // Orange
        break;
      case 'earth':
        color = 0x0000ff; // Blue
        break;
      case 'mars':
        color = 0xff0000; // Red
        break;
      case 'jupiter':
        color = 0xffa500; // Orange
        break;
      case 'saturn':
        color = 0xffd700; // Gold
        break;
      case 'uranus':
        color = 0x40e0d0; // Turquoise
        break;
      case 'neptune':
        color = 0x0000ff; // Blue
        break;
      case 'pluto':
        color = 0x8a2be2; // BlueViolet
        break;
      default:
        color = 0xffffff; // White
    }

    const orbitMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });
    
    // **Use THREE.Line instead of THREE.LineLoop for elliptical orbits**
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);

    return orbitLine;
  }

  /*
   * Focus on a planet
   * @param {Number} index - The index of the planet
   */
  focusOnPlanet(index) {
    if (index < 0 || index >= this.planets.length) return;

    this.currentFocusIndex = index;
    const targetPlanet = this.planets[index];

    // Calculate appropriate viewing distance based on planet size
    const planetRadius = targetPlanet.mesh.geometry.parameters.radius;
    
    if (targetPlanet.mesh.name === "sun") {
        this.currentViewDistance = planetRadius * 5;
    } else if (["jupiter", "saturn"].includes(targetPlanet.mesh.name)) {
        this.currentViewDistance = planetRadius * 8;
    } else if (["uranus", "neptune"].includes(targetPlanet.mesh.name)) {
        this.currentViewDistance = planetRadius * 12;
    } else {
        this.currentViewDistance = planetRadius * 15;
    }

    // Set initial camera position with an offset
    const cameraOffset = new THREE.Vector3(
        this.currentViewDistance * 0.5,  // Some X offset for perspective
        this.currentViewDistance * 0.3,  // Some Y offset for elevation
        this.currentViewDistance         // Z distance
    );

    // Update controls target to planet's position
    this.sceneManager.controls.target.copy(targetPlanet.group.position);
    
    // Position camera relative to planet
    this.sceneManager.camera.position.copy(targetPlanet.group.position).add(cameraOffset);
    
    this.sceneManager.controls.update();
    this.sceneManager.ui.updatePlanetInfo(targetPlanet.mesh);
  }

  /*
   * Navigation callback for UI arrows
   * @param {Number} direction - -1 for previous, 1 for next
   */
  handleNavigate(direction) {
    let newIndex;
    if (direction === -1) {
      newIndex =
        this.currentFocusIndex <= 0
          ? this.planets.length - 1
          : this.currentFocusIndex - 1;
    } else if (direction === 1) {
      newIndex = (this.currentFocusIndex + 1) % this.planets.length;
    } else {
      return;
    }
    this.focusOnPlanet(newIndex);
  }

  /*
 * Update the zoom speed based on the current planet
   */
  updateZoomSpeed() {
    if (this.currentFocusIndex >= 0) {
      const targetPlanet = this.planets[this.currentFocusIndex].mesh;
      const planetRadius = targetPlanet.geometry.parameters.radius;

      // Adjust zoom speed based on planet size
      const zoomSpeed = Math.max(0.5, planetRadius * 0.5);
      this.sceneManager.controls.zoomSpeed = zoomSpeed;
    } else {
      // Default zoom speed for solar system view
      this.sceneManager.controls.zoomSpeed = 1.0;
    }
  }
}
