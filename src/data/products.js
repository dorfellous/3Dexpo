const products = [
  {
    id: 'orchid-earring',
    name: 'Orchid Earring',
    description:
      '3D printed black matte orchid earring. Lightweight statement piece with a subtle reflective material effect. Stud: 925 sterling silver.',
    price: '$160 per pair',
    model: '/products/orchidearing.glb',
    position: [8.776, 0.35, -41.5],
    rotation: [0, Math.PI, 0],
    scale: 0.55,
    hoverHeight: 0.35,
    autoRotate: true,
    rotationSpeed: 0.32,
    light: true,
    lightIntensity: 2.8,
    lightColor: '#f2f4ff',
    lightPosition: [0, 2.6, 1.25],
    whatsappMessage: '',
  },
  {
    id: 'placeholder-sculpture',
    name: 'Placeholder Gallery Object',
    description:
      'A test product entry for the virtual gallery. Replace the model path and details when you upload a real product GLB.',
    price: '$1,200',
    model: '',
    position: [8.776, 0.45, -41.5],
    rotation: [0, Math.PI, 0],
    scale: 1,
    hoverHeight: 0.25,
    autoRotate: true,
    rotationSpeed: 0.45,
    light: true,
    lightIntensity: 2.4,
    lightColor: '#e6ebff',
    lightPosition: [0, 2.8, 1.4],
    whatsappMessage: '',
  },
]

export default products
