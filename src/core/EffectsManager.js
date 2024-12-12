import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

export class EffectManager {
  constructor(scene, planetMeshes, camera) {
    this.scene = scene;
    this.planetMeshes = planetMeshes;
    this.camera = camera;
  }

  addCubeBackground() {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      'static/textures/stars_milky_way/px.jpg', // right
      'static/textures/stars_milky_way/nx.jpg', // left
      'static/textures/stars_milky_way/py.jpg', // top
      'static/textures/stars_milky_way/ny.jpg', // bottom
      'static/textures/stars_milky_way/pz.jpg', // front
      'static/textures/stars_milky_way/nz.jpg', // back
    ]);
    this.scene.background = texture;
  }

  addSunFlare() {
    const textureLoader = new THREE.TextureLoader();
    const textureFlare = textureLoader.load(
      "static/textures/lensflare/flare.png"
    );
  
    const lensflare = new Lensflare();
  
    // Create a single, stronger main flare
    const mainFlare = new LensflareElement(
      textureFlare,
      600, // Slightly larger size
      0, // Distance from center
      new THREE.Color(1, 0.8, 0.5)
    );
    lensflare.addElement(mainFlare);
  
    // Add secondary flares with carefully chosen distances
    lensflare.addElement(
      new LensflareElement(
        textureFlare,
        120,
        0.6, // Distance from center
        new THREE.Color(1, 0.9, 0.6)
      )
    );
  
    lensflare.addElement(
      new LensflareElement(
        textureFlare,
        80,
        0.9, // Distance from center
        new THREE.Color(1, 0.8, 0.5)
      )
    );
  
    lensflare.addElement(
      new LensflareElement(
        textureFlare,
        60,
        1.2, // Distance from center
        new THREE.Color(0.9, 0.7, 0.4)
      )
    );
  
    // Position the flare at the sun's center
    lensflare.position.set(0, 0, 0);
  
    this.planetMeshes[0].mesh.add(lensflare);
  }
  
  createSunGlow() {
    const spriteMaterial = new THREE.SpriteMaterial({
      map: new THREE.TextureLoader().load("static/textures/glow.png"),
      color: 0xffaa33,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.3,
      depthTest: false, // Prevent z-fighting
      depthWrite: false, // Prevent z-fighting
    });
  
    const sunRadius = this.planetMeshes[0].mesh.geometry.parameters.radius;
  
    // Create multiple layers with different scales and slightly different positions
    const layers = [
      { scale: 4.0, opacity: 0.2, z: 0.1 },
      { scale: 3.0, opacity: 0.3, z: 0.05 },
      { scale: 2.5, opacity: 0.4, z: 0 },
    ];
  
    layers.forEach((layer) => {
      const sprite = new THREE.Sprite(spriteMaterial.clone());
      sprite.scale.set(sunRadius * layer.scale, sunRadius * layer.scale, 1.0);
      sprite.material.opacity = layer.opacity;
      sprite.position.z = layer.z;
      this.planetMeshes[0].mesh.add(sprite);
    });
  }

  updateLights() {
    if (!this.planetMeshes[0]) return;
  
    const sunCenter = new THREE.Vector3();
    this.planetMeshes[0].mesh.getWorldPosition(sunCenter);
  
    // Update point light position
    const sunLight = this.planetMeshes[0].mesh.children.find(
      (child) => child instanceof THREE.PointLight
    );
    if (sunLight) {
      sunLight.position.set(0, 0, 0);
    }
  
    // Update lens flare visibility and intensity
    const lensflare = this.planetMeshes[0].mesh.children.find(
      (child) => child instanceof Lensflare
    );
    if (!lensflare || !lensflare.elements) return;
  
    // Calculate angle between camera and sun
    const dirToCamera = new THREE.Vector3()
      .subVectors(camera.position, sunCenter)
      .normalize();
    const sunForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
      this.planetMeshes[0].mesh.quaternion
    );
    const angle = dirToCamera.dot(sunForward);
  
    // Adjust flare elements based on viewing angle
    const visibility = Math.max(0, (angle + 1) / 2); // Convert from [-1,1] to [0,1]
  
    // Check if elements array exists and has items
    if (Array.isArray(lensflare.elements) && lensflare.elements.length > 0) {
      lensflare.elements.forEach((element, index) => {
        if (element) {
          // Check if element exists
          if (index === 0) {
            // Main flare
            element.size = 600 * visibility;
          } else {
            // Secondary flares
            element.size = (120 / (index + 1)) * visibility;
          }
        }
      });
    }
  
    // Update directional light
    const secondarySunLight = this.scene.children.find(
      (child) => child instanceof THREE.DirectionalLight
    );
    if (secondarySunLight) {
      secondarySunLight.position.copy(sunCenter);
    }
  }
}
