/**
 * Event Manager Module
 **/
export class EventManager {
  constructor(sceneManager, planetManager) {
    this.sceneManager = sceneManager;
    this.planetManager = planetManager;
    this.isComparisonView = false;
  }

  /**
   * Add event listeners
   **/
  addEventListeners() {
    window.addEventListener("keydown", (e) => this.handleKeyPress(e));
    this.sceneManager.resizeHandler();

    // Add event listeners for UI buttons
    document.querySelectorAll(".control-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        const action = event.target.dataset.action;
        switch (action) {
          case "compare":
            this.handleKeyPress({ key: "c" });
            break;
          case "reset":
            this.handleKeyPress({ key: "Escape" });
            break;
        }
      });
    });
  }

  /**
   * Handle key presses
   * @param {Object} event - The event
   **/
  handleKeyPress(event) {
    switch (event.key) {
      case "ArrowRight":
        this.planetManager.handleNavigate(1);
        break;
      case "ArrowLeft":
        console.log("ArrowLeft");
        this.planetManager.handleNavigate(-1);
        break;
      case "Escape":
        // Reset to default view
        this.planetManager.currentFocusIndex = -1;
        this.sceneManager.controls.target.set(0, 0, 0);
        this.sceneManager.camera.position.set(
          scale.distance(ASTRONOMICAL_UNIT * 2),
          scale.distance(ASTRONOMICAL_UNIT * 2),
          scale.distance(ASTRONOMICAL_UNIT * 2)
        );
        break;
      case "C":
        this.isComparisonView = !this.isComparisonView;
        this.updatePlanetPositions();
        // Reset camera to view all planets
        this.currentFocusIndex = -1;
        this.sceneManager.controls.target.set(0, 0, 0);
        const viewDistance = this.isComparisonView
          ? scale.size(SUN_DIAMETER * 2)
          : scale.distance(ASTRONOMICAL_UNIT * 2);
        camera.position.set(0, viewDistance, viewDistance);
        break;
    }
  }

  /**
   * Initialize time controls
   **/
  initTimeControls() {
    const slider = document.getElementById("timeSlider");
    const timeValue = document.getElementById("timeValue");
    const pauseButton = document.getElementById("pauseButton");

    slider.value = 0;
    this.timeScale.value = 1;

    slider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      this.timeScale.value = value;
    });

    pauseButton.addEventListener("click", () => {
      console.log("pauseButton clicked");
      this.isPaused.value.set(!this.isPaused.value);
      pauseButton.textContent = this.isPaused.value ? "Resume" : "Pause";
    });
  }
}
