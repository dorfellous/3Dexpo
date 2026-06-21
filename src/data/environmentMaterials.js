const environmentMaterials = {
  meshOverrides: {},
  materialOverrides: {},
  globalOverride: null,
}

export const environmentMaterialPresets = {
  darkConcrete: {
    name: 'Dark Concrete',
    color: '#171717',
    roughness: 0.86,
    metalness: 0.02,
    emissive: '#000000',
    emissiveIntensity: 0,
    opacity: 1,
  },
  matteBlackMetal: {
    name: 'Matte Black Metal',
    color: '#050505',
    roughness: 0.58,
    metalness: 0.72,
    emissive: '#000000',
    emissiveIntensity: 0,
    opacity: 1,
  },
  dirtyGrayIndustrial: {
    name: 'Dirty Gray Industrial',
    color: '#3d3d3a',
    roughness: 0.74,
    metalness: 0.24,
    emissive: '#000000',
    emissiveIntensity: 0,
    opacity: 1,
  },
  wetBlackOrganic: {
    name: 'Wet Black Organic',
    color: '#030303',
    roughness: 0.18,
    metalness: 0.36,
    emissive: '#000000',
    emissiveIntensity: 0,
    opacity: 1,
  },
  metal014: {
    name: 'Metal014',
    color: '#ffffff',
    roughness: 0.72,
    metalness: 1,
    emissive: '#000000',
    emissiveIntensity: 0,
    opacity: 1,
    textureSet: {
      id: 'metal014',
    },
  },
}

export default environmentMaterials
