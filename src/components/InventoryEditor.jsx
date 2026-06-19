import { useState } from 'react'

const MOVE_STEP = 0.1
const HEIGHT_STEP = 0.05
const ROTATION_STEP = Math.PI / 18
const SCALE_STEP = 0.05
const HOVER_STEP = 0.05
const ROTATION_SPEED_STEP = 0.05
const LIGHT_STEP = 0.2
const PLACE_DISTANCE = 2.4

function formatNumber(value) {
  return Number(value).toFixed(3)
}

function formatArray(values) {
  return `[${values.map(formatNumber).join(', ')}]`
}

function quote(value) {
  return JSON.stringify(value ?? '')
}

function createProductConfig(product) {
  return `{
  id: ${quote(product.id)},
  name: ${quote(product.name)},
  description: ${quote(product.description)},
  price: ${quote(product.price)},
  model: ${quote(product.model)},
  position: ${formatArray(product.position)},
  rotation: ${formatArray(product.rotation)},
  scale: ${formatNumber(product.scale)},
  hoverHeight: ${formatNumber(product.hoverHeight ?? 0)},
  autoRotate: ${Boolean(product.autoRotate)},
  rotationSpeed: ${formatNumber(product.rotationSpeed ?? 0)},
  light: ${product.light ?? true},
  lightIntensity: ${formatNumber(product.lightIntensity ?? 2.1)},
  lightColor: ${quote(product.lightColor ?? '#e6ebff')},
  lightPosition: ${formatArray(product.lightPosition ?? [0, 2.6, 1.35])},
  whatsappMessage: ${quote(product.whatsappMessage ?? '')},
}`
}

export default function InventoryEditor({
  cameraInfo,
  enabled,
  onToggleEnabled,
  product,
  products,
  selectedProductId,
  onSelectProduct,
  onUpdateProduct,
}) {
  const [copyState, setCopyState] = useState('')

  if (!product) {
    return null
  }

  const updateProduct = (patch) => {
    onUpdateProduct(product.id, patch)
  }

  const updatePosition = (axis, amount) => {
    const position = [...product.position]
    position[axis] = Number((position[axis] + amount).toFixed(3))
    updateProduct({ position })
  }

  const updateRotation = (amount) => {
    const rotation = [...product.rotation]
    rotation[1] = Number((rotation[1] + amount).toFixed(3))
    updateProduct({ rotation })
  }

  const updateScale = (amount) => {
    updateProduct({
      scale: Math.max(0.01, Number((product.scale + amount).toFixed(3))),
    })
  }

  const updateHoverHeight = (amount) => {
    updateProduct({
      hoverHeight: Math.max(0, Number(((product.hoverHeight ?? 0) + amount).toFixed(3))),
    })
  }

  const updateRotationSpeed = (amount) => {
    updateProduct({
      rotationSpeed: Math.max(0, Number(((product.rotationSpeed ?? 0) + amount).toFixed(3))),
    })
  }

  const updateLightIntensity = (amount) => {
    updateProduct({
      lightIntensity: Math.max(0, Number(((product.lightIntensity ?? 0) + amount).toFixed(3))),
    })
  }

  const placeInFront = () => {
    const direction = cameraInfo.direction
    const position = [
      Number((cameraInfo.position[0] + direction[0] * PLACE_DISTANCE).toFixed(3)),
      product.position[1],
      Number((cameraInfo.position[2] + direction[2] * PLACE_DISTANCE).toFixed(3)),
    ]
    updateProduct({ position })
  }

  const copyConfig = async () => {
    const config = createProductConfig(product)

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
    <aside className="inventory-editor" onPointerDown={handlePointerDown}>
      <div className="inventory-editor__header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2>Placement Mode</h2>
        </div>
        <button className="editor-button" type="button" onClick={onToggleEnabled}>
          {enabled ? 'Done' : 'Place'}
        </button>
      </div>

      {enabled && (
        <>
          <label className="editor-field">
            <span>Product</span>
            <select value={selectedProductId} onChange={(event) => onSelectProduct(event.target.value)}>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="editor-readout">
            <span>Name</span>
            <code>{product.name}</code>
          </div>
          <div className="editor-readout">
            <span>Model</span>
            <code>{product.model || 'fallback geometry'}</code>
          </div>
          <div className="editor-readout">
            <span>Position</span>
            <code>{formatArray(product.position)}</code>
          </div>
          <div className="editor-readout">
            <span>Rotation</span>
            <code>{formatArray(product.rotation)}</code>
          </div>
          <div className="editor-readout">
            <span>Scale</span>
            <code>{formatNumber(product.scale)}</code>
          </div>
          <div className="editor-readout">
            <span>Hover</span>
            <code>{formatNumber(product.hoverHeight ?? 0)}</code>
          </div>
          <div className="editor-readout">
            <span>Spin</span>
            <code>{formatNumber(product.rotationSpeed ?? 0)}</code>
          </div>
          <div className="editor-readout">
            <span>Light</span>
            <code>{formatNumber(product.lightIntensity ?? 0)}</code>
          </div>
          <div className="editor-readout">
            <span>Player</span>
            <code>{formatArray(cameraInfo.position)}</code>
          </div>
          <div className="editor-readout">
            <span>Yaw</span>
            <code>{formatNumber(cameraInfo.yaw)}</code>
          </div>
          <div className="editor-readout">
            <span>Direction</span>
            <code>{formatArray(cameraInfo.direction)}</code>
          </div>

          <div className="editor-section">
            <button type="button" onClick={placeInFront}>
              Place in front of me
            </button>
          </div>

          <div className="editor-grid" aria-label="Position controls">
            <button type="button" onClick={() => updatePosition(0, -MOVE_STEP)}>
              X -
            </button>
            <button type="button" onClick={() => updatePosition(0, MOVE_STEP)}>
              X +
            </button>
            <button type="button" onClick={() => updatePosition(2, -MOVE_STEP)}>
              Z -
            </button>
            <button type="button" onClick={() => updatePosition(2, MOVE_STEP)}>
              Z +
            </button>
            <button type="button" onClick={() => updatePosition(1, HEIGHT_STEP)}>
              Height +
            </button>
            <button type="button" onClick={() => updatePosition(1, -HEIGHT_STEP)}>
              Height -
            </button>
            <button type="button" onClick={() => updateRotation(-ROTATION_STEP)}>
              Rotate -
            </button>
            <button type="button" onClick={() => updateRotation(ROTATION_STEP)}>
              Rotate +
            </button>
            <button type="button" onClick={() => updateScale(-SCALE_STEP)}>
              Scale -
            </button>
            <button type="button" onClick={() => updateScale(SCALE_STEP)}>
              Scale +
            </button>
          </div>

          <div className="editor-grid" aria-label="Presentation controls">
            <button type="button" onClick={() => updateProduct({ autoRotate: !product.autoRotate })}>
              AutoRotate {product.autoRotate ? 'On' : 'Off'}
            </button>
            <button type="button" onClick={() => updateHoverHeight(HOVER_STEP)}>
              Hover +
            </button>
            <button type="button" onClick={() => updateHoverHeight(-HOVER_STEP)}>
              Hover -
            </button>
            <button type="button" onClick={() => updateRotationSpeed(ROTATION_SPEED_STEP)}>
              Spin +
            </button>
            <button type="button" onClick={() => updateRotationSpeed(-ROTATION_SPEED_STEP)}>
              Spin -
            </button>
            <button type="button" onClick={() => updateLightIntensity(LIGHT_STEP)}>
              Light +
            </button>
            <button type="button" onClick={() => updateLightIntensity(-LIGHT_STEP)}>
              Light -
            </button>
          </div>

          <label className="editor-field">
            <span>Light color</span>
            <input
              type="color"
              value={product.lightColor ?? '#e6ebff'}
              onChange={(event) => updateProduct({ lightColor: event.target.value })}
            />
          </label>

          <button className="copy-config-button" type="button" onClick={copyConfig}>
            Copy products.js Config
          </button>
          {copyState && <p className="editor-copy-state">{copyState}</p>}
          <textarea
            className="editor-config"
            readOnly
            value={createProductConfig(product)}
            aria-label="Ready to paste products.js config"
          />
        </>
      )}
    </aside>
  )
}
