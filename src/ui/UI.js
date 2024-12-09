import { CelestialDataManager } from '../data/CelestialDataManager';

export class UI {
    /*
     * Constructor
     * @param {Object} planetData - The planet data
     * @param {Function} onNavigate - Callback for navigating planets
     */
    constructor(planetData, onNavigate, timeScale, isPaused, planetManager) {
        this.dataManager = new CelestialDataManager(planetData);
        this.planetManager = planetManager; // Store reference to PlanetManager
        this.planetInfo = document.getElementById('planet-details');
        this.sectionStates = this.loadSectionStates();
        this.defaultCollapsed = ['Quick Facts', 'Atmosphere']; // Sections collapsed by default
        this.onNavigate = onNavigate; // Store the callback
        this.timeScale = timeScale;
        this.isPaused = isPaused;
        this.createInfoPanels();
        this.setupEventListeners();
        this.initTimeControls(timeScale, isPaused);
        this.createOrbitControls(planetManager.planets); // Initialize orbit controls
    }

    initTimeControls(timeScale, isPaused) {
        const slider = document.getElementById("timeSlider");
        const timeValue = document.getElementById("timeValue");
        const pauseButton = document.getElementById("pauseButton");
      
        // Initialize slider to real-time
        slider.value = 0;
        this.timeScale.value = 1;
      
        slider.addEventListener("input", (e) => {
          const value = parseFloat(e.target.value);
      
          if (value < 0) {
            // Slower than real-time
            this.timeScale.value = 1 / Math.pow(10, Math.abs(value));
          } else {
            // Real-time or faster
            this.timeScale.value = Math.pow(10, value);
          }
      
          // Update display text
          if (this.timeScale.value === 1) {
            timeValue.textContent = "Real-time";
          } else if (this.timeScale.value > 1) {
            timeValue.textContent = `${this.timeScale.value.toFixed(0)}x faster`;
          } else {
            timeValue.textContent = `${(1 / this.timeScale.value).toFixed(2)}x slower`;
          }
        });
      
        pauseButton.addEventListener("click", () => {
          this.isPaused.value = !this.isPaused.value;
          pauseButton.textContent = this.isPaused.value ? "Resume" : "Pause";
        });
      }

    loadSectionStates() {
        const saved = localStorage.getItem('planetSectionStates');
        return saved ? JSON.parse(saved) : {};
    }

    saveSectionStates() {
        localStorage.setItem('planetSectionStates', JSON.stringify(this.sectionStates));
    }

    /*
     * Create the info panels
     */
    createInfoPanels() {
        const controlPanel = document.querySelector('.control-buttons');
        controlPanel.innerHTML = `
            <div class="control-group">
                <button class="control-btn" data-action="compare">Compare Mode (C)</button>
                <button class="control-btn" data-action="reset">Reset View (ESC)</button>
                <button class="control-btn" data-action="reset-sections">Reset Sections</button>
            </div>
            <div class="shortcuts">
                <p>← → Arrow Keys: Navigate Planets</p>
            </div>
        `;
    }

    setupEventListeners() {
        this.planetInfo.addEventListener('click', (e) => {
            const header = e.target.closest('.section-header');
            if (header) {
                const section = header.parentElement;
                const sectionTitle = header.querySelector('h3').textContent;
                const planetName = this.currentPlanet;
                
                // Toggle collapsed state
                section.classList.toggle('collapsed');
                const arrow = header.querySelector('.collapse-arrow');
                arrow.classList.toggle('rotated');

                // Save state
                if (!this.sectionStates[planetName]) {
                    this.sectionStates[planetName] = {};
                }
                this.sectionStates[planetName][sectionTitle] = section.classList.contains('collapsed');
                this.saveSectionStates();
            }

            // Handle expand/collapse all buttons
            const button = e.target.closest('.section-control-btn');
            if (button) {
                const action = button.dataset.action;
                const sections = this.planetInfo.querySelectorAll('.info-section');
                const isCollapse = action === 'collapse-all';

                sections.forEach(section => {
                    section.classList.toggle('collapsed', isCollapse);
                    section.querySelector('.collapse-arrow').classList.toggle('rotated', isCollapse);
                });

                // Save states
                const sectionStates = {};
                sections.forEach(section => {
                    const title = section.querySelector('h3').textContent;
                    sectionStates[title] = isCollapse;
                });
                this.sectionStates[this.currentPlanet] = sectionStates;
                this.saveSectionStates();
            }

            // Handle planet navigation
            if (e.target.classList.contains('nav-arrow')) {
                const direction = e.target.classList.contains('prev') ? -1 : 1;
                if (this.onNavigate && typeof this.onNavigate === 'function') {
                    this.onNavigate(direction);
                }
            }
        });

        document.querySelector('[data-action="reset-sections"]').addEventListener('click', () => {
            this.sectionStates = {};
            localStorage.removeItem('planetSectionStates');
            this.updatePlanetInfo(planetMeshes[currentFocusIndex]);
        });
    }

    /*
     * Update the planet info
     * @param {Object} planetMesh - The planet mesh
     */
    updatePlanetInfo(planetMesh) {
        const data = this.dataManager.getFormattedData(planetMesh.name);
        if (!data) return;
        
        this.currentPlanet = planetMesh.name;
        
        this.planetInfo.innerHTML = `
            <div class="planet-header">
                <div class="header-top">
                    <div class="planet-title">
                        <button class="nav-arrow prev" title="Previous Planet (←)">◄</button>
                        <h2>${data.name}</h2>
                        <button class="nav-arrow next" title="Next Planet (→)">►</button>
                    </div>
                    <div class="section-controls">
                        <button class="section-control-btn" data-action="expand-all">Expand All</button>
                        <button class="section-control-btn" data-action="collapse-all">Collapse All</button>
                    </div>
                </div>
                
                ${this.createSection('Basic Information', this.createBasicInfo(data))}
                ${this.createSection('Physical Properties', this.createPhysicalProperties(data))}
                ${data.temperature ? this.createSection('Temperature', this.createTemperature(data.temperature)) : ''}
                ${data.atmosphere ? this.createSection('Atmosphere', this.createAtmosphere(data.atmosphere)) : ''}
                ${data.facts ? this.createSection('Quick Facts', this.createFacts(data.facts)) : ''}
            </div>
        `;

        // Restore section states
        this.restoreSectionStates();
    }

    createSection(title, content) {
        const savedState = this.sectionStates[this.currentPlanet]?.[title];
        const isCollapsed = savedState !== undefined ? savedState : this.defaultCollapsed.includes(title);
        
        return `
            <div class="info-section ${isCollapsed ? 'collapsed' : ''}">
                <div class="section-header">
                    <h3>${title}</h3>
                    <span class="collapse-arrow ${isCollapsed ? 'rotated' : ''}">▼</span>
                </div>
                <div class="section-content">
                    ${content}
                </div>
            </div>
        `;
    }

    // Helper methods to create each section's content
    createBasicInfo(data) {
        return `
            <div class="stat-group">
                <span class="stat-label">Type:</span>
                <span class="stat-value">${data.type}</span>
            </div>
            <div class="stat-group">
                <span class="stat-label">Diameter:</span>
                <span class="stat-value">${data.diameter}</span>
            </div>
            <div class="stat-group">
                <span class="stat-label">Distance from Sun:</span>
                <span class="stat-value">${data.distance}</span>
            </div>
        `;
    }

    createPhysicalProperties(data) {
        return `
            <div class="stat-group">
                <span class="stat-label">Mass:</span>
                <span class="stat-value">${data.mass}</span>
            </div>
            <div class="stat-group">
                <span class="stat-label">Surface Gravity:</span>
                <span class="stat-value">${data.gravity}</span>
            </div>
            <div class="stat-group">
                <span class="stat-label">Rotation Period:</span>
                <span class="stat-value">${data.rotation_period} Earth days</span>
            </div>
        `;
    }

    createTemperature(temperature) {
        return `
            ${temperature.mean ? `
            <div class="stat-group">
                <span class="stat-label">Mean:</span>
                <span class="stat-value">${temperature.mean}</span>
            </div>
            ` : ''}
            ${temperature.surface ? `
            <div class="stat-group">
                <span class="stat-label">Surface:</span>
                <span class="stat-value">${temperature.surface}</span>
            </div>
            ` : ''}
            ${temperature.core ? `
            <div class="stat-group">
                <span class="stat-label">Core:</span>
                <span class="stat-value">${temperature.core}</span>
            </div>
            ` : ''}
            ${temperature.range ? `
            <div class="stat-group">
                <span class="stat-label">Range:</span>
                <span class="stat-value">${temperature.range}</span>
            </div>
            ` : ''}
        `;
    }

    createAtmosphere(atmosphere) {
        return `
            <div class="stat-group">
                <span class="stat-label">Composition:</span>
                <span class="stat-value">${atmosphere.composition}</span>
            </div>
            <div class="stat-group">
                <span class="stat-label">Pressure:</span>
                <span class="stat-value">${atmosphere.pressure}</span>
            </div>
        `;
    }

    createFacts(facts) {
        return `
            <ul class="fact-list">
                ${facts.map(fact => `<li>${fact}</li>`).join('')}
            </ul>
        `;
    }

    restoreSectionStates() {
        const planetStates = this.sectionStates[this.currentPlanet];
        if (!planetStates) return;

        Object.entries(planetStates).forEach(([title, isCollapsed]) => {
            // Find section by title using a more compatible selector
            const section = this.planetInfo.querySelector(`.info-section h3`);
            const sections = this.planetInfo.querySelectorAll('.info-section');
            
            sections.forEach(section => {
                const sectionTitle = section.querySelector('h3').textContent;
                if (sectionTitle === title && isCollapsed) {
                    section.classList.add('collapsed');
                    section.querySelector('.collapse-arrow').classList.add('rotated');
                }
            });
        });
    }

    createOrbitControls(planets) {
        const orbitControlsContainer = document.getElementById('orbit-controls');
        orbitControlsContainer.innerHTML = ''; // Clear existing controls

        planets.forEach((planet, index) => {
            const button = document.createElement('button');
            button.textContent = `Toggle ${planet.name} Orbit`;
            button.dataset.index = index;
            button.classList.add('orbit-toggle-btn');
            button.addEventListener('click', () => this.toggleOrbitVisibility(index));
            orbitControlsContainer.appendChild(button);
        });
    }

    toggleOrbitVisibility(index) {
        const planet = this.planetManager.planets[index];
        if (planet.orbitLine) {
            planet.orbitLine.visible = !planet.orbitLine.visible;
        }
    }
}