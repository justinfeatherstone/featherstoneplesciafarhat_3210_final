export class UI {
    constructor(planetData) {
        this.planetData = planetData;
        this.planetInfo = document.getElementById('planet-details');
        this.setupEventListeners();
    }

    updatePlanetInfo(planetMesh) {
        const data = this.planetData[planetMesh.name];
        this.planetInfo.innerHTML = `
            <div class="planet-header">
                <h3>${planetMesh.name.toUpperCase()}</h3>
                <div class="planet-stats">
                    <div>Diameter: ${data.diameter.toLocaleString()} km</div>
                    <div>Distance from Sun: ${data.distance.toLocaleString()} km</div>
                </div>
            </div>
        `;
    }
}