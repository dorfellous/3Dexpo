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

## Product inventory

Place product GLB files in:

```text
public/products/
```

Then add each product to:

```text
src/data/products.js
```

Use this shape for every product:

```js
{
  id: 'product-id',
  name: 'Product Name',
  description: 'Product description.',
  price: '$000',
  model: '/products/product.glb',
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: 1,
  hoverHeight: 0.25,
  autoRotate: true,
  rotationSpeed: 0.25,
  light: true,
  lightIntensity: 2.1,
  lightColor: '#e6ebff',
  lightPosition: [0, 2.6, 1.35],
  whatsappMessage: '',
}
```

The live gallery includes an Inventory / Placement Mode panel. Use it to select a product, move it in the room, adjust scale, rotation, hover, spin, and lighting, then copy a ready-to-paste `products.js` config. The browser does not write directly to GitHub.

If a GLB exists in `public/products/` but does not appear in the inventory, add it manually to `src/data/products.js` using the config shape above.

## Spotlight inventory

Permanent gallery spotlights live in:

```text
src/data/spotlights.js
```

Use this shape for every spotlight:

```js
{
  id: 'spotlight-id',
  name: 'Spotlight Name',
  position: [0, 3, 0],
  target: [0, 0, 0],
  intensity: 1,
  color: '#ffffff',
  angle: 0.35,
  penumbra: 0.5,
  distance: 10,
  decay: 2,
  helper: false,
}
```

The live gallery includes a Lighting / Spotlights panel. Use it to create or select a spotlight, place it at the camera, aim it at the selected product or a point in front of the player, adjust beam settings, then copy a ready-to-paste `spotlights.js` config. The browser does not write directly to GitHub.

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
