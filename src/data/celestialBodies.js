// Data sourced from NASA Solar System Exploration (https://solarsystem.nasa.gov/)
// and JPL Solar System Dynamics (https://ssd.jpl.nasa.gov/)

export const CELESTIAL_BODIES = {
    sun: {
        name: "Sun",
        type: "Yellow Dwarf",
        diameter: 1392684,
        distance: 0,
        mass: 1.989e30,
        gravity: 274,
        temperature: {
            surface: 5500,
            core: 15000000
        },
        rotation_period: 27, // Earth days
        composition: {
            hydrogen: 74.9,
            helium: 23.8,
            oxygen: 0.77,
            carbon: 0.29
        },
        facts: [
            "Contains 99.86% of the solar system's mass",
            "Core temperature is about 15 million °C",
            "Surface has intense magnetic fields"
        ],
        texture: "static/textures/8k_sun.jpg",
        axialTilt: 7.25,  // degrees
        orbitalElements: null,
    },
    mercury: {
        name: "Mercury",
        type: "Terrestrial Planet",
        diameter: 4879,
        distance: 57909175,
        mass: 0.330e24,
        gravity: 3.7,
        escape_velocity: 4.3,
        rotation_period: 58.646, // Earth days
        atmosphere: {
            composition: "Minimal - Exosphere only",
            pressure: "0.0000000001 Earth atmospheres"
        },
        temperature: {
            mean: 167,
            range: "-180 to 430°C"
        },
        facts: [
            "Smallest planet in the solar system",
            "Most cratered planet in the solar system",
            "Has ice in permanently shadowed craters"
        ],
        texture: "static/textures/8k_mercury.jpg",
        axialTilt: 0.034,  // degrees
        orbitalElements: {
            semiMajorAxis: 57909175,         // km
            eccentricity: 0.20563,
            inclination: 7.004,             // degrees
            longitudeOfAscendingNode: 48.331, // degrees
            argumentOfPeriapsis: 29.124,   // degrees
            meanAnomalyAtEpoch: 174.794,    // degrees
            orbitalPeriod: 88,           // Earth days
        },
    },
    venus: {
        name: "Venus",
        type: "Terrestrial Planet",
        diameter: 12104,
        distance: 108208930,
        mass: 4.867e24,
        gravity: 8.87,
        escape_velocity: 10.36,
        rotation_period: -243, // Negative indicates retrograde rotation
        atmosphere: {
            composition: {
                carbon_dioxide: 96.5,
                nitrogen: 3.5
            },
            pressure: "92 Earth atmospheres"
        },
        temperature: {
            mean: 464,
            range: "-47°C to 462°C"
        },
        facts: [
            "Rotates backwards compared to most planets",
            "Hottest planet despite not being closest to Sun",
            "Surface pressure is 92 times Earth's"
        ],
        texture: "static/textures/venus/8k_venus_surface.jpg",
        axialTilt: 177.4,  // degrees (retrograde)
        orbitalElements: {
            semiMajorAxis: 108208930,         // km
            eccentricity: 0.00677323,
            inclination: 3.3947,             // degrees
            longitudeOfAscendingNode: 76.6799, // degrees
            argumentOfPeriapsis: 131.5634,   // degrees
            meanAnomalyAtEpoch: 48.1594,    // degrees
            orbitalPeriod: 224.7,           // Earth days
        },
    },
    earth: {
        name: "Earth",
        type: "Terrestrial Planet",
        diameter: 12742,
        distance: 149597890,
        mass: 5.972e24,
        gravity: 9.81,
        escape_velocity: 11.186,
        rotation_period: 23.934, // hours
        composition: {
            hydrogen: 70.8,
            helium: 29.2,
            oxygen: 0.03,
            carbon: 0.03
        },
        temperature: {
            mean: 15,
            range: "-89°C to 58°C"
        },
        facts: [
            "Third planet from Sun",
            "Only planet known to support life",
            "Has a single moon"
        ],
        texture: "static/textures/earth/8k_earth_daymap.jpg",
        nightTexture: "static/textures/earth/8k_earth_nightmap.jpg",
        normalMap: "static/textures/earth/8k_earth_normal_map.jpg",
        bumpMap: "static/textures/earth/1k_earth_bump_map.jpg",
        specularMap: "static/textures/earth/8k_earth_specular_map.jpg",
        cloudMap: "static/textures/earth/8k_earth_clouds.jpg",
        axialTilt: 23.44,  // degrees
        orbitalElements: {
            semiMajorAxis: 149598319,         // km (1.000003 AU)
            eccentricity: 0.0167086,
            inclination: 0.00005,             // degrees
            longitudeOfAscendingNode: -11.26064, // degrees
            argumentOfPeriapsis: 114.20783,   // degrees
            meanAnomalyAtEpoch: 357.51716,    // degrees
            orbitalPeriod: 365.256,           // Earth days
        },
    },
    mars: {
        name: "Mars",
        type: "Terrestrial Planet",
        diameter: 6779,
        distance: 227936640,
        mass: 0.642e24,
        gravity: 3.71,
        escape_velocity: 5.03,
        rotation_period: 24.62,
        atmosphere: {
            composition: "Carbon dioxide, nitrogen, argon",
            pressure: "0.6% Earth's"
        },
        temperature: {
            mean: -65,
            range: "-140°C to 20°C"
        },
        facts: [
            "Red planet with a thin atmosphere"
        ],
        texture: "static/textures/8k_mars.jpg",
        axialTilt: 25.19,  // degrees
        orbitalElements: {
            semiMajorAxis: 227936640,         // km
            eccentricity: 0.09341233,
            inclination: 1.8506,             // degrees
            longitudeOfAscendingNode: 49.5574, // degrees
            argumentOfPeriapsis: 286.5016,   // degrees
            meanAnomalyAtEpoch: 355.4533,    // degrees
            orbitalPeriod: 687,           // Earth days
        },
    },
    jupiter: {
        name: "Jupiter",
        type: "Gas Giant Planet",
        diameter: 139822,
        distance: 778547200,
        mass: 1.898e27,
        gravity: 24.79,
        escape_velocity: 59.5,
        rotation_period: 9.93,
        atmosphere: {
            composition: "Hydrogen, helium",
            pressure: "1.3 Earth atmospheres"
        },
        temperature: {
            mean: -110,
            range: "-210°C to -110°C"
        },
        facts: [
            "Largest planet in the solar system",
            "Has a strong magnetic field",
            "Has 79 known moons"
        ],
        texture: "static/textures/8k_jupiter.jpg",
        axialTilt: 3.13,  // degrees
        orbitalElements: {
            semiMajorAxis: 778547200,         // km
            eccentricity: 0.04839266,
            inclination: 1.303,             // degrees
            longitudeOfAscendingNode: 100.464, // degrees
            argumentOfPeriapsis: 273.8671,   // degrees
            meanAnomalyAtEpoch: 19.4427,    // degrees
            orbitalPeriod: 4332.59,           // Earth days
        },
    },
    saturn: {
        name: "Saturn",
        type: "Gas Giant Planet",
        diameter: 116460,
        distance: 1433449370,
        mass: 5.683e26,
        gravity: 10.44,
        escape_velocity: 35.5,
        rotation_period: 10.66,
        atmosphere: {
            composition: "Hydrogen, helium",
            pressure: "0.9 Earth atmospheres"
        },
        temperature: {
            mean: -140,
            range: "-210°C to -110°C"
        },
        facts: [
            "Second largest planet in the solar system",
            "Has a prominent ring system"
        ],
        texture: "static/textures/saturn/8k_saturn.jpg",
        ringMap: "static/textures/saturn/8k_saturn_ring_alpha.png",
        ringInnerRadius: 1.0 * (116460 / 2),
        ringOuterRadius: 2.0 * (116460 / 2),
        axialTilt: 26.73,  // degrees
        orbitalElements: {
            semiMajorAxis: 1433449370,         // km
            eccentricity: 0.05415060,
            inclination: 2.4844,             // degrees
            longitudeOfAscendingNode: 113.6634, // degrees
            argumentOfPeriapsis: 266.7294,   // degrees
            meanAnomalyAtEpoch: 169.5084,    // degrees
            orbitalPeriod: 10747,           // Earth days
        },
    },
    uranus: {
        name: "Uranus",
        type: "Ice Giant Planet",
        diameter: 50724,
        distance: 2870972200,
        mass: 8.681e25,
        gravity: 8.69,
        escape_velocity: 21.3,
        rotation_period: -17,
        atmosphere: {
            composition: "Hydrogen, Helium",
            pressure: "0.02 Earth atmospheres"
        },
        temperature: {
            mean: -195,
            range: "-220°C to -180°C"
        },
        facts: [
            "Largest planet with a magnetic field primarily in the equatorial plane"
        ],
        texture: "static/textures/uranus/2k_uranus.jpg",
        ringMap: "static/textures/uranus/uranus_rings_alpha.png",
        ringInnerRadius: 1.64 * (50724 / 2),
        ringOuterRadius: 2.0 * (50724 / 2),
        axialTilt: 97.77,  // degrees
        orbitalElements: {
            semiMajorAxis: 2870972200,         // km
            eccentricity: 0.04638129,
            inclination: 0.7699,             // degrees
            longitudeOfAscendingNode: 96.5016, // degrees
            argumentOfPeriapsis: 284.0124,   // degrees
            meanAnomalyAtEpoch: 170.9543,    // degrees
            orbitalPeriod: 30687,           // Earth days
        },
    },
    neptune: {
        name: "Neptune",
        type: "Ice Giant Planet",
        diameter: 49244,
        distance: 4498252900,
        mass: 1.024e26,
        gravity: 11.15,
        escape_velocity: 23.5,
        rotation_period: 16.08,
        atmosphere: {
            composition: "Hydrogen, helium",
            pressure: "0.002 Earth atmospheres"
        },
        temperature: {
            mean: -200,
            range: "-220°C to -180°C"
        },
        facts: [
            "Neptune is the eighth and farthest known planet from the Sun in the Solar System"
        ],
        texture: "static/textures/2k_neptune.jpg",
        axialTilt: 28.32,  // degrees
        orbitalElements: {
            semiMajorAxis: 4498252900,         // km
            eccentricity: 0.00858587,
            inclination: 1.7692,             // degrees
            longitudeOfAscendingNode: 131.7216, // degrees
            argumentOfPeriapsis: 44.9647,   // degrees
            meanAnomalyAtEpoch: 350.3477,    // degrees
            orbitalPeriod: 60190,           // Earth days
        },
    },
    pluto: {
        name: "Pluto",
        type: "Dwarf Planet",
        diameter: 2370,
        distance: 5906380000,
        mass: 0.0146e24,
        gravity: 0.62,
        rotation_period: 6.39,
        atmosphere: {
            composition: "Nitrogen, methane",
        },
        temperature: {
            mean: -225,
            range: "-230°C to -190°C"
        },
        facts: [
            "Largest known dwarf planet",
            "Discovered by Clyde Tombaugh in 1930",
            "Not classified as a planet by the IAU :("
        ],
        texture: "static/textures/pluto/2k_pluto.jpg",
        axialTilt: 122.53,  // degrees
        orbitalElements: {
            semiMajorAxis: 5906380000,         // km
            eccentricity: 0.24880766,
            inclination: 17.14175,             // degrees
            longitudeOfAscendingNode: 110.3049, // degrees
            argumentOfPeriapsis: 224.0667,   // degrees
            meanAnomalyAtEpoch: 145.2078,    // degrees
            orbitalPeriod: 90560,           // Earth days
        },
    }
};
