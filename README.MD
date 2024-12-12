# Solar System Simulator

An interactive 3D visualization of our solar system built with Three.js, featuring realistic planet textures, and an intuitive user interface.

## Features
- Accurate 3D models of all planets with realistic textures and proportions
- Interactive camera controls for exploring the solar system
- Detailed information panel for each celestial body
- Time control system to adjust simulation speed
- Special effects including sun glow and planetary rings
- Responsive UI with intuitive navigation controls

## Technologies Used
- Three.js for 3D rendering
- Custom WebGL shaders for special effects
- CSS Grid for responsive layout
- Modern JavaScript (ES6+)
- Git LFS for large file storage
- Google Fonts for typography

## Prerequisites
- Node.js
- npm
- A modern browser with WebGL 2.0 support
- git LFS

## Git LFS Setup

This project uses Git Large File Storage (LFS) for managing texture files. To clone and run the project:

1. Install Git LFS on your system:
   - **Windows**: `winget install Git.LFS` or download from [git-lfs.github.com](https://git-lfs.github.com/)
   - **macOS**: `brew install git-lfs`
   - **Linux**: `sudo apt install git-lfs` or if debian based run scripts/setup-git-lfs-deb.sh

2. Enable Git LFS:
   ```bash
   git lfs install
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/solar-system-simulator.git
   ```

4. Pull LFS files (if they weren't downloaded during clone):
   ```bash
   git lfs pull
   ```

Note: Without Git LFS, the texture files won't be downloaded properly, and the planets will appear without textures.

## Installation
1. Clone the repository: `https://github.com/justinfeatherstone/featherstoneplesciafarhat_3210_final.git`

```
git clone https://github.com/justinfeatherstone/featherstoneplesciafarhat_3210_final.git
```

2. Navigate to the project directory: `cd featherstoneplesciafarhat_3210_final`

```
cd featherstoneplesciafarhat_3210_final
```

3. Install dependencies: `npm install`

```
npm install
```

4. Pull LFS files (if they weren't downloaded during clone):
```
git lfs install

git lfs pull
```

5. Run the development server: `npx vite`

```
npx vite
```

6. Open the browser and navigate to `http://localhost:5173` or follow the instructions in the terminal to view the project.

```
http://localhost:5173
```

## Resources

### Textures:
- [Solar System Textures (Attribution 4.0 License)](https://www.solarsystemscope.com/textures/)
- [JHT's Planetary Pixel Emporium (Non-Redistributable)](https://planetpixelemporium.com/)

## Fonts
- [Google Fonts](https://fonts.google.com/)

## Data
- [Basic Data (NASA)](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [Solar System Data (JPL)](https://ssd.jpl.nasa.gov/horizons/app.html#/)
