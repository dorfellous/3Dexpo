import { useState } from 'react'

const PLACEMENT_MOVE_STEP = 0.1
const PLACEMENT_HEIGHT_STEP = 0.05
const PLACEMENT_ROTATION_STEP = Math.PI / 18
const PLACEMENT_SCALE_STEP = 0.05

function formatNumber(value) {
  return Number(value).toFixed(3)
}

function createProductConfig(product) {
  return `{
  id: "${product.id}",
  name: "${product.name}",
  description: "${product.description}",
  price: "${product.price}",
  model: "${product.model}",
  position: [${product.position.map(formatNumber).join(', ')}],
  rotation: [${product.rotation.map(formatNumber).join(', ')}],
  scale: ${formatNumber(product.scale)},
  hoverHeight: ${formatNumber(product.hoverHeight ?? 0)},
  autoRotate: ${Boolean(product.autoRotate)},
  rotationSpeed: ${formatNumber(product.rotationSpeed ?? 0)},
  light: ${product.light ?? true},
  lightIntensity: ${formatNumber(product.lightIntensity ?? 2.1)},
  lightColor: "${product.lightColor ?? '#e6ebff'}",
  lightPosition: [${(product.lightPosition ?? [0, 2.6, 1.35]).map(formatNumber).join(', ')}],
  whatsappMessage: "${product.whatsappMessage ?? ''}",
}`
}

export { createProductConfig, formatNumber }

export default function PlacementPanel({
  cameraInfo,
  enabled,
  onToggleEnabled,
  product,
  productsList,
  selectedProductId,
  onSelectProduct,
  onUpdateProduct,
}) {
  const [copyState, setCopyState] = useState('')

  if (!product) {
    return null
  }

  const updatePosition = (axis, amount) => {
    const position = [...product.position]
    position[axis] = Number((position[axis] + amount).toFixed(3))
    onUpdateProduct(product.id, { position })
  }

  const updateRotation = (amount) => {
    const rotation = [...product.rotation]
    rotation[1] = Number((rotation[1] + amount).toFixed(3))
    onUpdateProduct(product.id, { rotation })
  }

  const updateScale = (amount) => {
    onUpdateProduct(product.id, {
      scale: Math.max(0.01, Number((product.scale + amount).toFixed(3))),
    })
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
    <aside className="placement-panel" onPointerDown={handlePointerDown}>
      <div className="placement-panel__header">
        <div>
          <p className="eyebrow">Placement Mode</p>
          <h2>Product Position</h2>
        </div>
        <button className="placement-toggle" type="button" onClick={onToggleEnabled}>
          {enabled ? 'Hide Tools' : 'Show Tools'}
        </button>
      </div>

      {enabled && (
        <>
          <label className="placement-field">
            <span>Selected product</span>
            <select value={selectedProductId} onChange={(event) => onSelectProduct(event.target.value)}>
              {productsList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="placement-readout">
            <span>Camera</span>
            <code>[{cameraInfo.position.map(formatNumber).join(', ')}]</code>
          </div>
          <div className="placement-readout">
            <span>Yaw</span>
            <code>{formatNumber(cameraInfo.yaw)}</code>
          </div>
          <div className="placement-readout">
            <span>Direction</span>
            <code>[{cameraInfo.direction.map(formatNumber).join(', ')}]</code>
          </div>

          <div className="placement-readout">
            <span>Product position</span>
            <code>[{product.position.map(formatNumber).join(', ')}]</code>
          </div>
          <div className="placement-readout">
            <span>Rotation</span>
            <code>[{product.rotation.map(formatNumber).join(', ')}]</code>
          </div>
          <div className="placement-readout">
            <span>Scale</span>
            <code>{formatNumber(product.scale)}</code>
          </div>

          <div className="placement-grid" aria-label="Move selected product">
            <button type="button" onClick={() => updatePosition(2, -PLACEMENT_MOVE_STEP)}>
              Z -
            </button>
            <button type="button" onClick={() => updatePosition(2, PLACEMENT_MOVE_STEP)}>
              Z +
            </button>
            <button type="button" onClick={() => updatePosition(0, -PLACEMENT_MOVE_STEP)}>
              X -
            </button>
            <button type="button" onClick={() => updatePosition(0, PLACEMENT_MOVE_STEP)}>
              X +
            </button>
            <button type="button" onClick={() => updatePosition(1, PLACEMENT_HEIGHT_STEP)}>
              Height +
            </button>
            <button type="button" onClick={() => updatePosition(1, -PLACEMENT_HEIGHT_STEP)}>
              Height -
            </button>
            <button type="button" onClick={() => updateRotation(-PLACEMENT_ROTATION_STEP)}>
              Rotate -
            </button>
            <button type="button" onClick={() => updateRotation(PLACEMENT_ROTATION_STEP)}>
              Rotate +
            </button>
            <button type="button" onClick={() => updateScale(-PLACEMENT_SCALE_STEP)}>
              Scale -
            </button>
            <button type="button" onClick={() => updateScale(PLACEMENT_SCALE_STEP)}>
              Scale +
            </button>
          </div>

          <button className="copy-config-button" type="button" onClick={copyConfig}>
            Copy products.js Config
          </button>
          {copyState && <p className="placement-copy-state">{copyState}</p>}
          <textarea
            className="placement-config"
            readOnly
            value={createProductConfig(product)}
            aria-label="Ready to paste products.js config"
          />
        </>
      )}
    </aside>
  )
}
