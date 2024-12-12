import { SCALE_FACTOR } from "../Constants.js";

/**
 * Scale method for converting actual kilometers to scene units
 **/
export const scale = {
  // Convert actual kilometers to scene units with safety checks
  size: (km) => {
    const scaled = km / SCALE_FACTOR;
    if (isNaN(scaled)) {
      console.error(`Invalid size scaling for ${km} km`);
      return 0.01; // Fallback size
    }
    return scaled;
  },
  distance: (km) => {
    const scaled = km / SCALE_FACTOR;
    if (isNaN(scaled)) {
      console.error(`Invalid distance scaling for ${km} km`);
      return 0.01; // Fallback distance
    }
    return scaled;
  },
  distanceVector(vector) {
    return vector.clone().multiplyScalar(1 / SCALE_FACTOR);
  },
};
