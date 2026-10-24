# Drone Swarm Simulation

A browser-based 3D environment for designing, visualizing, and running coordinated drone missions. The application renders up to 500 simulated drones, assembles them into configurable formations, navigates them along editable routes, and exposes live telemetry while the simulation is running.

Built with React, TypeScript, Vite, Three.js, React Three Fiber, and Zustand.

## Features

### Swarm control

- Configure the swarm size from 10 to 500 drones.
- Adjust maximum velocity and the safety distance used for separation and obstacle avoidance.
- Start, pause, and reset a mission.
- Cycle playback speed between 1x, 2x, and 5x.
- Track the swarm pipeline through `IDLE`, `ASSEMBLING`, `NAVIGATING`, and `COMPLETED` states.

### Formations

Choose from seven formation patterns:

- Sphere
- Matrix grid
- Double helix
- Line
- Ring
- Diamond
- Image show

Image show mode accepts PNG, JPEG, and WebP files. Image sampling happens in the browser and converts the uploaded subject into colored drone targets. The resulting formation can be saved as part of a mission.

### Mission planning

- Edit waypoint labels, altitude, speed, and hold time.
- Reorder or delete waypoints from the mission route panel.
- Add waypoints by holding `Shift` and clicking the flight area.
- Add obstacles by holding `Alt` and clicking the flight area.
- Use smooth Catmull-Rom paths between waypoints.
- Save and load custom missions from the mission library.

### Environment and telemetry

- Run the included Open sky, Urban corridor, and Mountain pass scenarios.
- Add, select, resize, and remove spherical or box obstacles.
- Use worker-based separation and obstacle repulsion with a spatial hash for neighbor lookup.
- View FPS, swarm count, assembly error, speed, altitude, route progress, obstacle count, and flight trends.
- Toggle route/debug visuals, drone trails, velocity vectors, and camera follow mode.

## Getting started

### Prerequisites

- Node.js and npm compatible with the installed Vite version.
- A modern browser with Web Worker, WebGL, and local storage support.

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The default development server is usually `http://localhost:5173`.

### Production build

```bash
npm run build
npm run preview
```

`npm run build` runs the TypeScript project build followed by the Vite production build. `npm run preview` serves the generated production build locally.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and create a production bundle. |
| `npm run lint` | Run Oxlint. |
| `npm run preview` | Preview the production bundle locally. |

There is currently no automated test script in `package.json`.

## Controls

| Input | Action |
| --- | --- |
| `Shift` + click on the flight area | Add a waypoint. |
| `Alt` + click on the flight area | Add a spherical obstacle. |
| Mouse drag | Orbit the 3D camera. |
| Mission Controller | Start/pause, change playback speed, reset, choose formation, and tune flight parameters. |
| Telemetry and display toggles | Inspect live state, follow the swarm, and show or hide trails, vectors, and debug visuals. |

## Project structure

```text
src/
  components/
    Planner/              Waypoint placement and route editing
    Scene/                Three.js scene, swarm rendering, navigation, and obstacles
    UI/                   Mission controls, scenarios, telemetry, and saved missions
  math/                   Formation generation and image sampling helpers
  physics/                Worker-based drone avoidance and spatial hashing
  scenarios/              Built-in training scenario definitions
  store/                  Zustand simulation state and mission persistence
  types/                  Shared TypeScript models
```

## Simulation notes

The swarm is rendered as an instanced Three.js mesh. Drone positions and velocities are maintained in typed arrays, while physics updates run in `src/physics/avoidance.worker.ts` so the main UI thread can continue rendering the scene. The navigator moves the swarm center along the waypoint spline; individual drones seek their formation targets while applying separation and obstacle-repulsion forces.

Saved missions are stored in the browser under the local storage key `drone-simulation-missions`. They are local to the current browser profile and are not synced to a server.

## Technology stack

- React 19 and React DOM
- TypeScript
- Vite
- Three.js and React Three Fiber
- React Three Drei
- Zustand
- Tailwind CSS 4
- Oxlint
