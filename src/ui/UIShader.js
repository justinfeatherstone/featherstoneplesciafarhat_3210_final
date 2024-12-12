import * as THREE from "three";

/**
 * UI shader class
 **/
export class UIShader {
  /**
   * Constructor
   **/
  constructor() {
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Future: install vite-glsl-loader and use import statements
    const vertexShader = `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

    // Future: install vite-glsl-loader and use import statements
    const fragmentShader = `
            varying vec2 vUv;
            uniform float time;
            uniform vec3 color;

            void main() {
                float gradient = smoothstep(0.0, 1.0, vUv.y);
                float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453123);
                noise = noise * 0.05 + 0.95;
                float pulse = sin(time * 0.5) * 0.05 + 0.95;
                float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x) *
                            smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
                vec3 finalColor = mix(color * 0.5, color, gradient * noise * pulse);
                finalColor += vec3(0.1, 0.2, 0.3) * edge;
                gl_FragColor = vec4(finalColor, 0.85);
            }
        `;

    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x1a2b4c) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    this.createPanelMeshes();
  }

  /**
   * Create meshes for each panel
   **/
  createPanelMeshes() {
    const panels = document.querySelectorAll(".panel");
    panels.forEach((panel) => {
      const rect = panel.getBoundingClientRect();
      const geometry = new THREE.PlaneGeometry(rect.width, rect.height);
      const mesh = new THREE.Mesh(geometry, this.material.clone());

      // Position mesh at panel position
      mesh.position.set(
        rect.left + rect.width / 2,
        -rect.top - rect.height / 2,
        0
      );

      this.scene.add(mesh);
    });
  }

  /**
   * Update the shader
   **/
  update() {
    this.material.uniforms.time.value = this.clock.getElapsedTime();
  }
}
