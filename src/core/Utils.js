import { SCALE_FACTOR } from '../constants.js';

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

// Other utility functions if needed