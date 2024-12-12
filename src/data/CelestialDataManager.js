export class CelestialDataManager {
  /**
   * Constructor
   * @param {Object} data - The data
   **/
  constructor(data) {
    this.data = data;
    this.validateData();
  }

  /**
   * Validate the data
   **/
  validateData() {
    Object.entries(this.data).forEach(([key, body]) => {
      const required = ["diameter", "distance", "texture"];
      required.forEach((prop) => {
        if (!body[prop]) {
          console.warn(`Missing required property ${prop} for ${key}`);
        }
      });
    });
  }

  /**
   * Get the body data
   * @param {String} name - The name
   * @returns {Object} - The body data
   **/
  getBodyData(name) {
    return this.data[name.toLowerCase()];
  }

  /**
   * Get the relative size
   * @param {String} bodyName - The body name
   * @param {String} referenceBody - The reference body
   * @returns {Number} - The relative size
   **/
  getRelativeSize(bodyName, referenceBody = "earth") {
    const body = this.getBodyData(bodyName);
    const reference = this.getBodyData(referenceBody);
    return body.diameter / reference.diameter;
  }

  /**
   * Get the formatted data
   * @param {String} bodyName - The body name
   * @returns {Object} - The formatted data
   **/
  getFormattedData(bodyName) {
    const data = this.data[bodyName.toLowerCase()];
    if (!data) return null;

    return {
      name: data.name || bodyName.charAt(0).toUpperCase() + bodyName.slice(1),
      type: data.type || "Celestial Body",
      diameter: this.formatNumber(data.diameter, "km"),
      distance: this.formatNumber(data.distance, "km"),
      mass: this.formatScientific(data.mass, "kg"),
      gravity: data.gravity ? `${data.gravity} m/s²` : "N/A",
      rotation_period: this.formatRotationPeriod(data.rotation_period),
      temperature: this.formatTemperature(data.temperature),
      atmosphere: this.formatAtmosphere(data.atmosphere),
      facts: data.facts || [],
    };
  }

  /**
   * Format the temperature
   * @param {Object} temp - The temperature data
   * @returns {Object} - The formatted temperature
   **/
  formatTemperature(temp) {
    if (!temp) return null;

    return {
      mean: temp.mean !== undefined ? `${temp.mean}°C` : undefined,
      range: temp.range || undefined,
      surface: temp.surface ? `${temp.surface}°C` : undefined,
      core: temp.core ? `${temp.core}°C` : undefined,
    };
  }

  /**
   * Format the atmosphere
   * @param {Object} atm - The atmosphere data
   * @returns {Object} - The formatted atmosphere
   **/
  formatAtmosphere(atm) {
    if (!atm) return null;

    return {
      composition: this.formatComposition(atm.composition),
      pressure: atm.pressure || "N/A",
    };
  }

  /**
   * Format the composition
   * @param {Object} comp - The composition data
   * @returns {String} - The formatted composition
   **/
  formatComposition(comp) {
    if (!comp) return "N/A";
    if (typeof comp === "string") return comp;

    return Object.entries(comp)
      .map(([element, percentage]) => `${element}: ${percentage}%`)
      .join(", ");
  }

  /**
   * Format the rotation period
   * @param {Number} period - The rotation period
   * @returns {String} - The formatted rotation period
   **/
  formatRotationPeriod(period) {
    if (!period) return "N/A";
    if (period < 24) {
      return `${period} hours`;
    }
    return `${period} Earth days`;
  }

  /**
   * Format the number
   * @param {Number} num - The number
   * @param {String} unit - The unit
   * @returns {String} - The formatted number
   **/
  formatNumber(num, unit) {
    if (typeof num !== "number") return "N/A";
    return `${num.toLocaleString()} ${unit}`;
  }

  /**
   * Format the scientific number
   * @param {Number} num - The number
   * @param {String} unit - The unit
   * @returns {String} - The formatted number
   **/
  formatScientific(num, unit) {
    if (typeof num !== "number") return "N/A";
    return `${num.toExponential(2)} ${unit}`;
  }
}
