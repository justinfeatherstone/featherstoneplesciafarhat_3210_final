import { Planet } from "../planet.js";
import { CELESTIAL_BODIES } from "../data/celestialBodies.js";
import { scale } from "./Utils.js";

export class PlanetManager {
  constructor(scale, sceneManager, scene) {
    this.scale = scale;
    this.sceneManager = sceneManager;
    this.scene = scene;
    this.planets = []; // Store instances of Planet
    this.currentFocusIndex = -1;
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

      // Validation: Check if ring properties are defined if ringMapPath is provided
      if (ringMapPath && (!data.ringInnerRadius || !data.ringOuterRadius)) {
        console.error(
          `Ring properties missing for ${name}. Rings will not be created.`
        );
        ringMapPath = null;
        ringInnerRadius = null;
        ringOuterRadius = null;
      }

      // Create Planet instance with the name
      const planet = new Planet(
        name, // Pass the name
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
        data.axialTilt || 0
      );
      planet.mesh.name = name.toLowerCase();
      this.planets.push(planet);
      console.log(this.sceneManager);
      this.sceneManager.scene.add(planet.group);
      console.log(planet);
    });
  }

  /*
   * Focus on a planet
   * @param {Number} index - The index of the planet
   */
  focusOnPlanet(index) {
    if (index < 0 || index >= this.planets.length) return;

    this.currentFocusIndex = index;
    const targetPlanet = this.planets[index];

    // Reset controls target to planet position
    this.sceneManager.controls.target.copy(targetPlanet.group.position);

    // Calculate appropriate viewing distance based on planet size
    const planetRadius = targetPlanet.mesh.geometry.parameters.radius;
    let viewDistance;

    if (targetPlanet.mesh.name === "sun") {
      viewDistance = planetRadius * 5;
    } else if (["jupiter", "saturn"].includes(targetPlanet.mesh.name)) {
      viewDistance = planetRadius * 8;
    } else if (["uranus", "neptune"].includes(targetPlanet.mesh.name)) {
      viewDistance = planetRadius * 12;
    } else {
      // Smaller planets (Mercury, Venus, Earth, Mars)
      viewDistance = planetRadius * 15;
    }

    // Calculate camera position with offset
    const offsetRatio = 0.5;
    const offset = new THREE.Vector3(
      viewDistance * offsetRatio,
      viewDistance * offsetRatio,
      viewDistance
    );

    // Set camera position relative to planet
    this.sceneManager.camera.position.copy(targetPlanet.group.position).add(offset);

    // Update camera and controls
    this.sceneManager.camera.lookAt(targetPlanet.group.position);
    this.sceneManager.controls.update();

    // Update UI
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
