import { scale } from "../core/Utils.js";
import * as THREE from 'three';

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
    this.simulationTime = 0; // Accumulated simulation time in days
    this.lastFrameTime = Date.now(); // Timestamp of the last frame
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const currentTime = Date.now();
    const deltaTimeMs = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    const deltaTimeDays = deltaTimeMs / 86400000;

    if (!this.isPaused.value) {
        this.simulationTime += deltaTimeDays * this.timeScale.value;

        // Update planet positions
        this.planetManager.planets.forEach((planet) => {
            if (planet.orbitalElements) {
                planet.calculateOrbitalPosition(this.simulationTime);
            }
            planet.group.position.copy(
                scale.distanceVector(planet.orbitalPosition)
            );
        });

        // Update planet rotations
        this.planetManager.planets.forEach((planet) => {
            planet.rotatePlanet(0.001 * this.timeScale.value);
        });

        // Update sun shader
        const sunMesh = this.planetManager.planets.find(p => p.name.toLowerCase() === 'sun')?.mesh;
        if (sunMesh && sunMesh.material.uniforms) {
            sunMesh.material.uniforms.time.value += 0.01 * this.timeScale.value;
        }
    }

    // Update UI shader
    if (this.sceneManager.uiShader) {
      this.sceneManager.uiShader.update();
    }

    // **Update Camera Controls Target and Position if a Planet is Focused**
    if (this.planetManager.currentFocusIndex !== -1) {
        const targetPlanet = this.planetManager.planets[this.planetManager.currentFocusIndex];
        const planetPosition = targetPlanet.group.position;

        // Update only the target position, not the camera position
        this.sceneManager.controls.target.copy(planetPosition);
        
        // Let OrbitControls handle the camera position naturally
        this.sceneManager.controls.update();
    }

    // Update UI shader
    if (this.sceneManager.uiShader) {
      this.sceneManager.uiShader.update();
    }

    // Update zoom speed
    this.planetManager.updateZoomSpeed();

    // Update controls
    this.sceneManager.controls.update();

    // Update sun light intensity
    const sunLight = this.planetManager.planets.find(p => p.name.toLowerCase() === 'sun')?.mesh.children.find(
      (child) => child instanceof THREE.PointLight
    );
    if (sunLight) {
      // More subtle pulsing
      const pulseIntensity = 2.3 + Math.sin(Date.now() * 0.0005) * 0.2;
      sunLight.intensity = pulseIntensity;
    }

    // Update effects
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

    // Render the scene
    this.sceneManager.renderer.render(
      this.sceneManager.scene,
      this.sceneManager.camera
    );
  }
}
