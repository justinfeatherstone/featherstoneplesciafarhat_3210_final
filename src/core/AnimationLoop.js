import { CELESTIAL_BODIES } from "../data/celestialBodies.js";

export class AnimationLoop {
  constructor(
    sceneManager,
    planetManager,
    effectManager,
    timeScaleRef,
    isPausedRef
  ) {
    this.sceneManager = sceneManager;
    this.planetManager = planetManager;
    this.effectManager = effectManager;
    this.timeScale = timeScaleRef;
    this.isPaused = isPausedRef;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (!this.isPaused.value) {
      // Rotate each planet
      this.planetManager.planets.forEach((planet, index) => {
        const celestialBody = CELESTIAL_BODIES[Object.keys(CELESTIAL_BODIES)[index]];
        let rotationSpeed = 0.01;

        if (celestialBody.rotation_period) {
          switch (celestialBody.name.toLowerCase()) {
            case "sun":
              rotationSpeed = (1 / celestialBody.rotation_period) * 0.005 * this.timeScale.value;
              break;
            case "mercury":
              rotationSpeed = (1 / celestialBody.rotation_period) * 0.02 * this.timeScale.value;
              break;
            case "venus":
              rotationSpeed = (1 / Math.abs(celestialBody.rotation_period)) * 0.02 * this.timeScale.value;
              if (celestialBody.rotation_period < 0) rotationSpeed *= -1;
              break;
            case "earth":
              rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.04 * this.timeScale.value;
              break;
            case "mars":
              rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.04 * this.timeScale.value;
              break;
            case "jupiter":
              rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.06 * this.timeScale.value;
              break;
            case "saturn":
              rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.06 * this.timeScale.value;
              break;
            case "uranus":
              rotationSpeed = (1 / Math.abs(celestialBody.rotation_period / 24)) * 0.04 * this.timeScale.value;
              if (celestialBody.rotation_period < 0) rotationSpeed *= -1;
              break;
            case "neptune":
              rotationSpeed = (1 / (celestialBody.rotation_period / 24)) * 0.04 * this.timeScale.value;
              break;
            case "pluto":
              rotationSpeed = (1 / celestialBody.rotation_period) * 0.02 * this.timeScale.value;
              break;
            default:
              rotationSpeed = 0.001;
          }
        }

        planet.rotatePlanet(rotationSpeed);
      });
    }

    // Update UI shader
    if (this.sceneManager.uiShader) {
      this.sceneManager.uiShader.update();
    }

    // Update zoom speed
    this.planetManager.updateZoomSpeed();

    // Update controls
    this.sceneManager.controls.update();

    if (!this.isPaused.value) {
      // Update sun shader time uniform
      const sunMesh = this.planetManager.planets[0].mesh;
      if (sunMesh && sunMesh.material.uniforms) {
        sunMesh.material.uniforms.time.value += 0.01 * this.timeScale.value;
      }
    }

      const sunLight = this.planetManager.planets[0].mesh.children.find(
        (child) => child instanceof THREE.PointLight
      );
      if (sunLight) {
        // More subtle pulsing
        const pulseIntensity = 2.3 + Math.sin(Date.now() * 0.0005) * 0.2;
        sunLight.intensity = pulseIntensity;
      }

      this.effectManager.updateLights();

      // Update the light direction and camera position for Earth's shader material
      const earthPlanet = this.planetManager.planets.find(
        (planet) => planet.name.toLowerCase() === "earth"
      );
      if (earthPlanet && earthPlanet.mesh.material.uniforms) {
        const sunPlanet = this.planetManager.planets.find(
          (planet) => planet.name.toLowerCase() === "sun"
        );
        if (sunPlanet) {
          const sunPosition = new THREE.Vector3();
          sunPlanet.mesh.getWorldPosition(sunPosition);

          const earthPosition = new THREE.Vector3();
          earthPlanet.mesh.getWorldPosition(earthPosition);

          const lightDirection = new THREE.Vector3()
            .subVectors(sunPosition, earthPosition)
            .normalize();
          earthPlanet.mesh.material.uniforms.lightDirection.value.copy(
            lightDirection
          );
        }
      }

      this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
      this.sceneManager.controls.update();

      if (!this.isPaused) {
        // Update Earth's shader uniforms
        const earth = this.planetManager.planets.find(
          (planet) => planet.mesh.name === "earth"
        );
        if (earth && earth.mesh.material.uniforms.lightDirection) {
          const sunPosition = new THREE.Vector3(0, 0, 0); // Assuming the Sun is at the origin
          const earthPosition = new THREE.Vector3();
          earth.mesh.getWorldPosition(earthPosition);
          const lightDirection = sunPosition
            .clone()
            .sub(earthPosition)
            .normalize();
          earth.mesh.material.uniforms.lightDirection.value.copy(
            lightDirection
          );
          earth.mesh.material.uniforms.time.value += 0.1 * timeScale;
        }
      }
    

    // Update effects
    this.effectManager.updateLights();

    // Update controls
    this.sceneManager.controls.update();

    // Render the scene
    this.sceneManager.renderer.render(
      this.sceneManager.scene,
      this.sceneManager.camera
    );
  }
}
