import { Planet } from "../planet.js";
import { CELESTIAL_BODIES } from "../data/celestialBodies.js";
import { scale } from "./Utils.js";
import * as THREE from "three";

/**
 * Planet Manager Module
 *
 * Responsible for creating and managing planets in the scene
 **/
export class PlanetManager {
  /**
   * Constructor for PlanetManager
   * @param {Object} scale - The scale object
   * @param {Object} sceneManager - The scene manager object
   * @param {Object} scene - The scene object
   **/
  constructor(scale, sceneManager, scene) {
    this.scale = scale;
    this.sceneManager = sceneManager;
    this.scene = scene;
    this.planets = []; // Store instances of Planet
    this.currentFocusIndex = -1;
    this.currentViewDistance = null; // Add this line to store view distance
  }

  /**
   * Initialize planets
   **/
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

      // if earth, set applicable textures
      if (name.toLowerCase() === "earth") {
        normalMapPath = data.normalMap;
        specularMapPath = data.specularMap;
        cloudsMapPath = data.cloudMap;
        bumpMapPath = data.bumpMap;
        nightTexturePath = data.nightTexture;
      }

      // if saturn or uranus, set ring properties
      if (name.toLowerCase() === "saturn" || name.toLowerCase() === "uranus") {
        ringMapPath = data.ringMap; // Ensure this path is correct
        ringInnerRadius = scale.size(data.ringInnerRadius); // Define in kilometers
        ringOuterRadius = scale.size(data.ringOuterRadius); // Define in kilometers
      }

      // if orbital elements are available, set them
      if (data.orbitalElements) {
        orbitalElements = data.orbitalElements;
      } else {
        console.warn(
          `Orbital elements missing for ${name}. Planet motion will be static.`
        );
      }

      // create planet instance with orbital elements
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

      // if orbital elements are available, add orbit line
      if (orbitalElements) {
        planet.orbitLine = this.createOrbitPath(orbitalElements, name);
        this.sceneManager.scene.add(planet.orbitLine);
      }
    });
  }

  /***
   * Create a colored, visible orbit path for a planet
   * @param {Object} orbitalElements - Keplerian orbital elements.
   * @param {String} planetName - Name of the planet for color selection.
   * @returns {THREE.Line} - The orbit line object.
   ***/
  createOrbitPath(orbitalElements, planetName) {
    const {
      semiMajorAxis: a,
      eccentricity: e,
      inclination: i,
      longitudeOfAscendingNode: Ω,
      argumentOfPeriapsis: ω,
    } = orbitalElements;

    let segments = 10000;
    if (planetName.toLowerCase() === "pluto") {
      segments = 1000000;
    }
    let points = [];

    for (let t = 0; t <= 2 * Math.PI; t += (2 * Math.PI) / segments) {
      // Solve Kepler's Equation for Eccentric Anomaly (E)
      let E = t;
      let deltaE;
      do {
        deltaE = (t - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
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

      // Position in orbital plane
      const x_orb = r * Math.cos(ν);
      const y_orb = r * Math.sin(ν);
      const z_orb = 0;

      // Convert angles to radians
      const inclinationRad = THREE.MathUtils.degToRad(i);
      const longitudeOfAscendingNodeRad = THREE.MathUtils.degToRad(Ω);
      const argumentOfPeriapsisRad = THREE.MathUtils.degToRad(ω);

      // Create rotation matrices in correct order
      const rotationMatrix = new THREE.Matrix4();

      // First rotate around Z-axis by longitude of ascending node
      rotationMatrix.makeRotationZ(longitudeOfAscendingNodeRad);

      // Then rotate around X-axis by inclination
      const inclinationMatrix = new THREE.Matrix4().makeRotationX(
        inclinationRad
      );
      rotationMatrix.multiply(inclinationMatrix);

      // Finally rotate around Z-axis by argument of periapsis
      const periapsisMatrix = new THREE.Matrix4().makeRotationZ(
        argumentOfPeriapsisRad
      );
      rotationMatrix.multiply(periapsisMatrix);

      // Apply rotation to position vector
      const position = new THREE.Vector3(x_orb, y_orb, z_orb).applyMatrix4(
        rotationMatrix
      );

      // Scale the position
      const scaledPosition = this.scale.distanceVector(position);

      // Rotate the entire system around X-axis by 90 degrees
      const systemRotation = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      scaledPosition.applyMatrix4(systemRotation);

      points.push(scaledPosition);
    }

    if (points.length > 2) {
      // Ensure orbit closure
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      const gap = firstPoint.distanceTo(lastPoint);

      if (gap > 0.001) {
        points.push(firstPoint.clone());
      }

      // Add intermediate points in areas of high curvature
      const refinedPoints = [];
      for (let i = 0; i < points.length - 1; i++) {
        refinedPoints.push(points[i]);

        const current = points[i];
        const next = points[i + 1];
        const angle = current.angleTo(next);

        if (angle > 0.1) {
          const mid = new THREE.Vector3()
            .addVectors(current, next)
            .multiplyScalar(0.5);
          refinedPoints.push(mid);
        }
      }
      points = refinedPoints;
    }

    // create orbit geometry
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);

    // Define colors based on planet
    let color = 0xffffff; // Default white

    switch (planetName.toLowerCase()) {
      case "mercury":
        color = 0xaaaaaa; // Grey
        break;
      case "venus":
        color = 0xffaa00; // Orange
        break;
      case "earth":
        color = 0x0000ff; // Blue
        break;
      case "mars":
        color = 0xff0000; // Red
        break;
      case "jupiter":
        color = 0xffa500; // Orange
        break;
      case "saturn":
        color = 0xffd700; // Gold
        break;
      case "uranus":
        color = 0x40e0d0; // Turquoise
        break;
      case "neptune":
        color = 0x0000ff; // Blue
        break;
      case "pluto":
        color = 0x8a2be2; // BlueViolet
        break;
      default:
        color = 0xffffff; // White
    }

    const orbitMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
    });

    // **Use THREE.Line instead of THREE.LineLoop for elliptical orbits**
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);

    return orbitLine;
  }

  /**
   * Focus on a planet
   * @param {Number} index - The index of the planet
   **/
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
      this.currentViewDistance * 0.5, // Some X offset for perspective
      this.currentViewDistance * 0.3, // Some Y offset for elevation
      this.currentViewDistance // Z distance
    );

    // Update controls target to planet's position
    this.sceneManager.controls.target.copy(targetPlanet.group.position);

    // Position camera relative to planet
    this.sceneManager.camera.position
      .copy(targetPlanet.group.position)
      .add(cameraOffset);

    this.sceneManager.controls.update();
    this.sceneManager.ui.updatePlanetInfo(targetPlanet.mesh);
  }

  /**
   * Navigation callback for UI arrows
   * @param {Number} direction - -1 for previous, 1 for next
   **/
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

  /**
   * Update the zoom speed based on the current planet
   **/
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

  /**
   * Calculate the number of segments for an orbit
   * @param {Object} orbitalElements - Keplerian orbital elements
   * @param {String} planetName - Name of the planet
   * @returns {Number} - The number of segments
   **/
  calculateSegments(orbitalElements, planetName) {
    const { eccentricity, semiMajorAxis } = orbitalElements;

    // Base segments proportional to orbit size and eccentricity
    let segments = Math.floor(10000 * (1 + eccentricity * 5));

    // Additional segments for highly eccentric orbits
    if (eccentricity > 0.1) {
      segments *= 2;
    }

    // Special cases for outer planets
    switch (planetName.toLowerCase()) {
      case "pluto":
        segments = Math.max(segments, 1000000);
        break;
      case "neptune":
      case "uranus":
        segments = Math.max(segments, 50000);
        break;
    }

    return segments;
  }

  /**
   * Update the orbit visibility based on the camera distance
   * @param {Number} cameraDistance - The distance to the camera
   **/
  updateOrbitVisibility(cameraDistance) {
    this.planets.forEach((planet, index) => {
      if (!planet.orbitLine) return;

      // Set full opacity for all orbits
      let opacity = 1.0;

      // If a planet is focused, adjust its orbit opacity
      if (this.currentFocusIndex === index) {
        const planetRadius = planet.mesh.geometry.parameters.radius;
        const fadeDistance = planetRadius * 100;
        opacity = Math.max(0, 1 - fadeDistance / cameraDistance);
      }

      planet.orbitLine.material.opacity = opacity;
    });
  }
}
