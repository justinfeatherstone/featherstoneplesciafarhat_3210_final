export class UI {
    /*
     * Constructor
     * @param {Object} planetData - The planet data
     */
    constructor(planetData) {
        this.planetData = planetData;
        this.planetInfo = document.getElementById('planet-details');
        this.createInfoPanels();
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

    /*
     * Update the planet info
     * @param {Object} planetMesh - The planet mesh
     */
    updatePlanetInfo(planetMesh) {
        const data = this.planetData[planetMesh.name];
        const formattedName = planetMesh.name.charAt(0).toUpperCase() + planetMesh.name.slice(1);
        
        this.planetInfo.innerHTML = `
            <div class="planet-header">
                <h3>${formattedName}</h3>
                <div class="planet-stats">
                    <div class="stat-group">
                        <span class="stat-label">Diameter:</span>
                        <span class="stat-value">${data.diameter.toLocaleString()} km</span>
                    </div>
                    <div class="stat-group">
                        <span class="stat-label">Distance from Sun:</span>
                        <span class="stat-value">${data.distance.toLocaleString()} km</span>
                    </div>
                    <div class="stat-group relative-scale">
                        <span class="stat-label">Relative to Earth:</span>
                        <span class="stat-value">${(data.diameter / this.planetData.earth.diameter).toFixed(2)}x</span>
                    </div>
                </div>
            </div>
        `;
    }
}