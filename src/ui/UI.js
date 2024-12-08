import { CelestialDataManager } from '../data/CelestialDataManager';

export class UI {
    /*
     * Constructor
     * @param {Object} planetData - The planet data
     */
    constructor(planetData) {
        this.dataManager = new CelestialDataManager(planetData);
        this.planetInfo = document.getElementById('planet-details');
        this.createInfoPanels();
        this.setupEventListeners();
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
                section.classList.toggle('collapsed');
                const arrow = header.querySelector('.collapse-arrow');
                arrow.classList.toggle('rotated');
            }
        });
    }

    /*
     * Update the planet info
     * @param {Object} planetMesh - The planet mesh
     */
    updatePlanetInfo(planetMesh) {
        const data = this.dataManager.getFormattedData(planetMesh.name);
        if (!data) return;
        
        this.planetInfo.innerHTML = `
            <div class="planet-header">
                <h2>${data.name}</h2>
                
                ${this.createSection('Basic Information', this.createBasicInfo(data))}
                ${this.createSection('Physical Properties', this.createPhysicalProperties(data))}
                ${data.temperature ? this.createSection('Temperature', this.createTemperature(data.temperature)) : ''}
                ${data.atmosphere ? this.createSection('Atmosphere', this.createAtmosphere(data.atmosphere)) : ''}
                ${data.facts ? this.createSection('Quick Facts', this.createFacts(data.facts)) : ''}
            </div>
        `;
    }

    createSection(title, content) {
        return `
            <div class="info-section">
                <div class="section-header">
                    <h3>${title}</h3>
                    <span class="collapse-arrow">▼</span>
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
}