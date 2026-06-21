import { useEffect, useMemo, useState } from 'react'
import { environmentMaterialPresets } from '../data/environmentMaterials'

const NUMBER_STEP = 0.05
const EMISSIVE_STEP = 0.05

function formatNumber(value) {
  return Number(value ?? 0).toFixed(3)
}

function quote(value) {
  return JSON.stringify(value ?? '')
}

function createOverrideConfig(config) {
  const meshEntries = Object.entries(config.meshOverrides ?? {})
  const materialEntries = Object.entries(config.materialOverrides ?? {})

  const formatOverride = (override, indent = '    ') => {
    const lines = ['{']
    if (override.color) lines.push(`${indent}color: ${quote(override.color)},`)
    if (typeof override.roughness === 'number') lines.push(`${indent}roughness: ${formatNumber(override.roughness)},`)
    if (typeof override.metalness === 'number') lines.push(`${indent}metalness: ${formatNumber(override.metalness)},`)
    if (override.emissive) lines.push(`${indent}emissive: ${quote(override.emissive)},`)
    if (typeof override.emissiveIntensity === 'number') {
      lines.push(`${indent}emissiveIntensity: ${formatNumber(override.emissiveIntensity)},`)
    }
    if (typeof override.opacity === 'number') lines.push(`${indent}opacity: ${formatNumber(override.opacity)},`)
    if (override.textureSet) {
      lines.push(`${indent}textureSet: {`)
      Object.entries(override.textureSet).forEach(([key, value]) => {
        lines.push(`${indent}  ${key}: ${quote(value)},`)
      })
      lines.push(`${indent}},`)
    }
    lines.push(`${indent.slice(2)}}`)
    return lines.join('\n')
  }

  return `const environmentMaterials = {
  meshOverrides: {${meshEntries.length ? '\n' : ''}${meshEntries
    .map(([key, override]) => `    ${quote(key)}: ${formatOverride(override, '      ')},`)
    .join('\n')}${meshEntries.length ? '\n  ' : ''}},
  materialOverrides: {${materialEntries.length ? '\n' : ''}${materialEntries
    .map(([key, override]) => `    ${quote(key)}: ${formatOverride(override, '      ')},`)
    .join('\n')}${materialEntries.length ? '\n  ' : ''}},
  globalOverride: ${config.globalOverride ? formatOverride(config.globalOverride, '    ') : 'null'},
}

export default environmentMaterials`
}

function cloneOverride(override) {
  return {
    color: override.color ?? '#111111',
    roughness: Number(override.roughness ?? 0.7),
    metalness: Number(override.metalness ?? 0.1),
    emissive: override.emissive ?? '#000000',
    emissiveIntensity: Number(override.emissiveIntensity ?? 0),
    opacity: Number(override.opacity ?? 1),
    ...(override.textureSet ? { textureSet: { ...override.textureSet } } : {}),
  }
}

function getTargetKey(scope, meshName, materialName) {
  if (scope === 'mesh') return meshName
  if (scope === 'material') return materialName
  return 'environment'
}

export default function EnvironmentMaterialsEditor({
  enabled,
  onToggleEnabled,
  targets,
  config,
  preview,
  onPreview,
  onApply,
  onReset,
}) {
  const [copyState, setCopyState] = useState('')
  const [scope, setScope] = useState('mesh')
  const [selectedMesh, setSelectedMesh] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [draft, setDraft] = useState(() => cloneOverride(environmentMaterialPresets.darkConcrete))
  const [previewEnabled, setPreviewEnabled] = useState(false)

  const meshes = useMemo(
    () => [...new Set(targets.map((target) => target.meshName))].filter(Boolean),
    [targets],
  )
  const materials = useMemo(
    () => [...new Set(targets.map((target) => target.materialName))].filter(Boolean),
    [targets],
  )

  useEffect(() => {
    if (!selectedMesh && meshes[0]) setSelectedMesh(meshes[0])
  }, [meshes, selectedMesh])

  useEffect(() => {
    if (!selectedMaterial && materials[0]) setSelectedMaterial(materials[0])
  }, [materials, selectedMaterial])

  useEffect(() => {
    if (!previewEnabled) {
      onPreview(null)
      return
    }

    onPreview({
      scope,
      key: getTargetKey(scope, selectedMesh, selectedMaterial),
      override: cloneOverride(draft),
    })
  }, [draft, onPreview, previewEnabled, scope, selectedMaterial, selectedMesh])

  const updateDraft = (patch) => {
    setDraft((current) => ({
      ...current,
      ...patch,
    }))
  }

  const updateNumber = (key, amount, min = 0, max = 1) => {
    updateDraft({
      [key]: Math.min(max, Math.max(min, Number((draft[key] + amount).toFixed(3)))),
    })
  }

  const applyPreset = (preset) => {
    setDraft(cloneOverride(preset))
    setPreviewEnabled(true)
  }

  const applyDraft = () => {
    onApply(scope, getTargetKey(scope, selectedMesh, selectedMaterial), cloneOverride(draft))
    setCopyState('')
  }

  const resetTarget = () => {
    onReset(scope, getTargetKey(scope, selectedMesh, selectedMaterial))
    setPreviewEnabled(false)
    setCopyState('')
  }

  const copyConfig = async () => {
    const text = createOverrideConfig(config)

    try {
      await navigator.clipboard.writeText(text)
      setCopyState('Copied')
    } catch {
      setCopyState('Select and copy from the box')
    }
  }

  const handlePointerDown = () => {
    if (document.pointerLockElement) {
      document.exitPointerLock?.()
    }
  }

  return (
    <aside className="environment-materials-editor" onPointerDown={handlePointerDown}>
      <div className="inventory-editor__header">
        <div>
          <p className="eyebrow">Environment</p>
          <h2>Materials</h2>
        </div>
        <button className="editor-button" type="button" onClick={onToggleEnabled}>
          {enabled ? 'Done' : 'Materials'}
        </button>
      </div>

      {enabled && (
        <>
          <div className="editor-readout">
            <span>Meshes</span>
            <code>{meshes.length}</code>
          </div>
          <div className="editor-readout">
            <span>Materials</span>
            <code>{materials.length}</code>
          </div>

          <label className="editor-field">
            <span>Apply to</span>
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="mesh">Selected mesh</option>
              <option value="material">Selected material</option>
              <option value="environment">Entire environment</option>
            </select>
          </label>

          <label className="editor-field">
            <span>Mesh</span>
            <select value={selectedMesh} onChange={(event) => setSelectedMesh(event.target.value)}>
              {meshes.map((mesh) => (
                <option key={mesh} value={mesh}>
                  {mesh}
                </option>
              ))}
            </select>
          </label>

          <label className="editor-field">
            <span>Material</span>
            <select value={selectedMaterial} onChange={(event) => setSelectedMaterial(event.target.value)}>
              {materials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </label>

          <div className="editor-grid">
            {Object.values(environmentMaterialPresets).map((preset) => (
              <button key={preset.name} type="button" onClick={() => applyPreset(preset)}>
                {preset.name}
              </button>
            ))}
            <button type="button" onClick={resetTarget}>
              Reset Original
            </button>
          </div>

          <label className="editor-field">
            <span>Color</span>
            <input type="color" value={draft.color} onChange={(event) => updateDraft({ color: event.target.value })} />
          </label>
          <label className="editor-field">
            <span>Emissive</span>
            <input
              type="color"
              value={draft.emissive}
              onChange={(event) => updateDraft({ emissive: event.target.value })}
            />
          </label>

          <div className="editor-readout">
            <span>Roughness</span>
            <code>{formatNumber(draft.roughness)}</code>
          </div>
          <div className="editor-readout">
            <span>Metalness</span>
            <code>{formatNumber(draft.metalness)}</code>
          </div>
          <div className="editor-readout">
            <span>Emissive</span>
            <code>{formatNumber(draft.emissiveIntensity)}</code>
          </div>
          <div className="editor-readout">
            <span>Opacity</span>
            <code>{formatNumber(draft.opacity)}</code>
          </div>
          {draft.textureSet && (
            <div className="editor-readout">
              <span>Textures</span>
              <code>{Object.keys(draft.textureSet).join(', ')}</code>
            </div>
          )}

          <div className="editor-grid">
            <button type="button" onClick={() => updateNumber('roughness', -NUMBER_STEP)}>
              Rough -
            </button>
            <button type="button" onClick={() => updateNumber('roughness', NUMBER_STEP)}>
              Rough +
            </button>
            <button type="button" onClick={() => updateNumber('metalness', -NUMBER_STEP)}>
              Metal -
            </button>
            <button type="button" onClick={() => updateNumber('metalness', NUMBER_STEP)}>
              Metal +
            </button>
            <button type="button" onClick={() => updateNumber('emissiveIntensity', -EMISSIVE_STEP, 0, 5)}>
              Glow -
            </button>
            <button type="button" onClick={() => updateNumber('emissiveIntensity', EMISSIVE_STEP, 0, 5)}>
              Glow +
            </button>
            <button type="button" onClick={() => updateNumber('opacity', -NUMBER_STEP)}>
              Opacity -
            </button>
            <button type="button" onClick={() => updateNumber('opacity', NUMBER_STEP)}>
              Opacity +
            </button>
          </div>

          <label className="editor-field editor-field--inline">
            <span>Preview mode</span>
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(event) => setPreviewEnabled(event.target.checked)}
            />
          </label>
          <div className="editor-grid">
            <button type="button" onClick={applyDraft}>
              Apply Permanently
            </button>
            <button type="button" onClick={() => onPreview(null)}>
              Clear Preview
            </button>
          </div>

          <button className="copy-config-button" type="button" onClick={copyConfig}>
            Copy Material Config
          </button>
          {copyState && <p className="editor-copy-state">{copyState}</p>}
          <textarea
            className="editor-config"
            readOnly
            value={createOverrideConfig(config)}
            aria-label="Ready to paste environment material config"
          />
          {preview && <p className="editor-copy-state">Previewing {preview.scope}</p>}
        </>
      )}
    </aside>
  )
}
