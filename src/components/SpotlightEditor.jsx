import { useState } from 'react'

const POSITION_STEP = 0.1
const TARGET_STEP = 0.1
const INTENSITY_STEP = 0.25
const ANGLE_STEP = 0.025
const PENUMBRA_STEP = 0.05
const DISTANCE_STEP = 0.5
const TARGET_DISTANCE = 4

function formatNumber(value) {
  return Number(value).toFixed(3)
}

function formatArray(values) {
  return `[${values.map(formatNumber).join(', ')}]`
}

function quote(value) {
  return JSON.stringify(value ?? '')
}

function createSpotlightConfig(spotlight) {
  return `{
  id: ${quote(spotlight.id)},
  name: ${quote(spotlight.name)},
  position: ${formatArray(spotlight.position)},
  target: ${formatArray(spotlight.target)},
  intensity: ${formatNumber(spotlight.intensity)},
  color: ${quote(spotlight.color)},
  angle: ${formatNumber(spotlight.angle)},
  penumbra: ${formatNumber(spotlight.penumbra)},
  distance: ${formatNumber(spotlight.distance)},
  decay: ${formatNumber(spotlight.decay)},
  helper: false,
}`
}

function createNewSpotlight(cameraInfo, count) {
  const direction = cameraInfo.direction
  const position = [
    Number(cameraInfo.position[0].toFixed(3)),
    Number((cameraInfo.position[1] + 0.4).toFixed(3)),
    Number(cameraInfo.position[2].toFixed(3)),
  ]
  const target = [
    Number((cameraInfo.position[0] + direction[0] * TARGET_DISTANCE).toFixed(3)),
    Number((cameraInfo.position[1] + direction[1] * TARGET_DISTANCE).toFixed(3)),
    Number((cameraInfo.position[2] + direction[2] * TARGET_DISTANCE).toFixed(3)),
  ]

  return {
    id: `spotlight-${count + 1}`,
    name: `Spotlight ${count + 1}`,
    position,
    target,
    intensity: 3,
    color: '#ffffff',
    angle: 0.35,
    penumbra: 0.5,
    distance: 10,
    decay: 2,
    helper: true,
  }
}

export default function SpotlightEditor({
  cameraInfo,
  enabled,
  onToggleEnabled,
  products,
  selectedProductId,
  onSelectProduct,
  spotlights,
  selectedSpotlightId,
  onSelectSpotlight,
  onCreateSpotlight,
  onUpdateSpotlight,
}) {
  const [copyState, setCopyState] = useState('')
  const spotlight = spotlights.find((item) => item.id === selectedSpotlightId) ?? spotlights[0]
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0]

  if (!spotlight) {
    return null
  }

  const updateSpotlight = (patch) => {
    onUpdateSpotlight(spotlight.id, patch)
  }

  const updateArray = (key, axis, amount) => {
    const next = [...spotlight[key]]
    next[axis] = Number((next[axis] + amount).toFixed(3))
    updateSpotlight({ [key]: next })
  }

  const updateNumber = (key, amount, min = 0, max = Number.POSITIVE_INFINITY) => {
    updateSpotlight({
      [key]: Math.min(max, Math.max(min, Number((spotlight[key] + amount).toFixed(3)))),
    })
  }

  const placeAtCamera = () => {
    updateSpotlight({
      position: [
        Number(cameraInfo.position[0].toFixed(3)),
        Number(cameraInfo.position[1].toFixed(3)),
        Number(cameraInfo.position[2].toFixed(3)),
      ],
    })
  }

  const targetSelectedProduct = () => {
    if (!selectedProduct) {
      return
    }

    updateSpotlight({
      target: selectedProduct.position.map((value) => Number(value.toFixed(3))),
    })
  }

  const targetInFront = () => {
    const direction = cameraInfo.direction
    updateSpotlight({
      target: [
        Number((cameraInfo.position[0] + direction[0] * TARGET_DISTANCE).toFixed(3)),
        Number((cameraInfo.position[1] + direction[1] * TARGET_DISTANCE).toFixed(3)),
        Number((cameraInfo.position[2] + direction[2] * TARGET_DISTANCE).toFixed(3)),
      ],
    })
  }

  const addSpotlight = () => {
    const next = createNewSpotlight(cameraInfo, spotlights.length)
    onCreateSpotlight(next)
    setCopyState('')
  }

  const copyConfig = async () => {
    const config = createSpotlightConfig(spotlight)

    try {
      await navigator.clipboard.writeText(config)
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
    <aside className="spotlight-editor" onPointerDown={handlePointerDown}>
      <div className="inventory-editor__header">
        <div>
          <p className="eyebrow">Lighting</p>
          <h2>Spotlights</h2>
        </div>
        <button className="editor-button" type="button" onClick={onToggleEnabled}>
          {enabled ? 'Done' : 'Lights'}
        </button>
      </div>

      {enabled && (
        <>
          <div className="editor-section">
            <button type="button" onClick={addSpotlight}>
              New Spotlight
            </button>
          </div>

          <label className="editor-field">
            <span>Spotlight</span>
            <select value={spotlight.id} onChange={(event) => onSelectSpotlight(event.target.value)}>
              {spotlights.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="editor-field">
            <span>Target product</span>
            <select value={selectedProduct?.id ?? ''} onChange={(event) => onSelectProduct(event.target.value)}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <div className="editor-readout">
            <span>Name</span>
            <code>{spotlight.name}</code>
          </div>
          <div className="editor-readout">
            <span>Position</span>
            <code>{formatArray(spotlight.position)}</code>
          </div>
          <div className="editor-readout">
            <span>Target</span>
            <code>{formatArray(spotlight.target)}</code>
          </div>
          <div className="editor-readout">
            <span>Intensity</span>
            <code>{formatNumber(spotlight.intensity)}</code>
          </div>
          <div className="editor-readout">
            <span>Angle</span>
            <code>{formatNumber(spotlight.angle)}</code>
          </div>
          <div className="editor-readout">
            <span>Penumbra</span>
            <code>{formatNumber(spotlight.penumbra)}</code>
          </div>
          <div className="editor-readout">
            <span>Distance</span>
            <code>{formatNumber(spotlight.distance)}</code>
          </div>

          <div className="editor-grid">
            <button type="button" onClick={placeAtCamera}>
              Place at camera
            </button>
            <button type="button" onClick={targetSelectedProduct}>
              Target product
            </button>
            <button type="button" onClick={targetInFront}>
              Target in front
            </button>
          </div>

          <div className="editor-grid" aria-label="Spotlight position controls">
            <button type="button" onClick={() => updateArray('position', 0, -POSITION_STEP)}>
              X -
            </button>
            <button type="button" onClick={() => updateArray('position', 0, POSITION_STEP)}>
              X +
            </button>
            <button type="button" onClick={() => updateArray('position', 1, -POSITION_STEP)}>
              Y -
            </button>
            <button type="button" onClick={() => updateArray('position', 1, POSITION_STEP)}>
              Y +
            </button>
            <button type="button" onClick={() => updateArray('position', 2, -POSITION_STEP)}>
              Z -
            </button>
            <button type="button" onClick={() => updateArray('position', 2, POSITION_STEP)}>
              Z +
            </button>
          </div>

          <div className="editor-grid" aria-label="Spotlight target controls">
            <button type="button" onClick={() => updateArray('target', 0, -TARGET_STEP)}>
              Target X -
            </button>
            <button type="button" onClick={() => updateArray('target', 0, TARGET_STEP)}>
              Target X +
            </button>
            <button type="button" onClick={() => updateArray('target', 1, -TARGET_STEP)}>
              Target Y -
            </button>
            <button type="button" onClick={() => updateArray('target', 1, TARGET_STEP)}>
              Target Y +
            </button>
            <button type="button" onClick={() => updateArray('target', 2, -TARGET_STEP)}>
              Target Z -
            </button>
            <button type="button" onClick={() => updateArray('target', 2, TARGET_STEP)}>
              Target Z +
            </button>
          </div>

          <div className="editor-grid" aria-label="Spotlight beam controls">
            <button type="button" onClick={() => updateNumber('intensity', -INTENSITY_STEP)}>
              Intensity -
            </button>
            <button type="button" onClick={() => updateNumber('intensity', INTENSITY_STEP)}>
              Intensity +
            </button>
            <button type="button" onClick={() => updateNumber('angle', -ANGLE_STEP, 0.05, Math.PI / 2)}>
              Angle -
            </button>
            <button type="button" onClick={() => updateNumber('angle', ANGLE_STEP, 0.05, Math.PI / 2)}>
              Angle +
            </button>
            <button type="button" onClick={() => updateNumber('penumbra', -PENUMBRA_STEP, 0, 1)}>
              Penumbra -
            </button>
            <button type="button" onClick={() => updateNumber('penumbra', PENUMBRA_STEP, 0, 1)}>
              Penumbra +
            </button>
            <button type="button" onClick={() => updateNumber('distance', -DISTANCE_STEP)}>
              Distance -
            </button>
            <button type="button" onClick={() => updateNumber('distance', DISTANCE_STEP)}>
              Distance +
            </button>
          </div>

          <label className="editor-field">
            <span>Color</span>
            <input
              type="color"
              value={spotlight.color}
              onChange={(event) => updateSpotlight({ color: event.target.value })}
            />
          </label>

          <button className="copy-config-button" type="button" onClick={copyConfig}>
            Copy Spotlight Config
          </button>
          {copyState && <p className="editor-copy-state">{copyState}</p>}
          <textarea
            className="editor-config"
            readOnly
            value={createSpotlightConfig(spotlight)}
            aria-label="Ready to paste spotlight config"
          />
        </>
      )}
    </aside>
  )
}
