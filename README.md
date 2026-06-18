# 3Dexpo

Interactive full-screen 3D website built with React, Vite, Three.js, React Three Fiber, and Drei.

## Uploading the GLB environment

Place the main environment file at:

```text
public/models/scene.glb
```

The file must be named `scene.glb`. The app treats this GLB as the main environment asset and does not modify the geometry. If the file is not present yet, the homepage displays fallback demo geometry so the experience still loads.

Optional texture assets can be placed in:

```text
public/textures/
```

## Run locally

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Open the local URL printed by Vite. In local development, the app loads the model from `/models/scene.glb`.

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

On every push to `main`, GitHub Actions will:

1. Install dependencies with `npm install`.
2. Build the Vite app.
3. Upload the `dist` folder as a Pages artifact.
4. Deploy it to GitHub Pages.

If Pages has not been enabled for the repository yet, open the repository settings on GitHub, go to **Pages**, and set the source to **GitHub Actions**.
