import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BackSide, Euler, MathUtils, Raycaster, Vector2, Vector3 } from 'three'
import {
  ContactShadows,
  Environment,
  Html,
  Text3D,
  useGLTF,
} from '@react-three/drei'
import helvetikerBold from 'three/examples/fonts/helvetiker_bold.typeface.json'
import products from './data/products'

const MODEL_PATH = `${import.meta.env.BASE_URL}models/scene.glb`
const AMBIENCE_PATH = `${import.meta.env.BASE_URL}audio/ambience.mp3`
const IMPACT_PATH = `${import.meta.env.BASE_URL}audio/impact.mp3`
const WHATSAPP_NUMBER = '972000000000'
const EYE_HEIGHT = 1.65
const START_POSITION = [8.776, 1.650, -45.208]
const START_YAW = Math.PI
const BODY_RADIUS = 0.35
const MIN_FLOOR_Y = 0
const FLOOR_RAY_HEIGHT = 1.2
const FLOOR_RAY_DISTANCE = 4
const MAX_STEP_HEIGHT = 0.45
const PRODUCT_INTERACTION_DISTANCE = 6
const INTRO_TEXT = 'Dor Fellous'
const INTRO_TEXT_POSITION = [8.776, 8.4, -39.2]
const INTRO_TEXT_IMPACT_Y = 0.14
const INTRO_TEXT_SCALE = 0.82
const INTRO_GRAVITY = 18
const INTRO_START_DELAY = 0.18
const IMPACT_SHAKE_DURATION = 0.72
const IMPACT_SHAKE_STRENGTH = 0.085

class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

function SceneModel({ onCollisionMeshes }) {
  const gltf = useGLTF(MODEL_PATH)

  useEffect(() => {
    const collisionMeshes = []

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.updateWorldMatrix(true, false)
        collisionMeshes.push(child)
      }
    })

    onCollisionMeshes(collisionMeshes)
  }, [gltf.scene, onCollisionMeshes])

  return <primitive object={gltf.scene} />
}

function resolvePublicAssetPath(path) {
  if (!path) {
    return ''
  }

  if (path.startsWith('http') || path.startsWith(import.meta.env.BASE_URL)) {
    return path
  }

  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

function ProductFallback({ highlighted = false }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.72, 0.24, 48]} />
        <meshStandardMaterial color="#161616" roughness={0.68} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <icosahedronGeometry args={[0.46, 2]} />
        <meshStandardMaterial
          color="#d8d8d8"
          emissive={highlighted ? '#2f3b5c' : '#000000'}
          emissiveIntensity={highlighted ? 0.45 : 0}
          roughness={0.32}
          metalness={0.38}
        />
      </mesh>
    </group>
  )
}

function AmbientAudio({ started, muted }) {
  const audioRef = useRef(null)
  const impactRef = useRef(null)

  useEffect(() => {
    if (!audioRef.current) {
      return
    }

    audioRef.current.volume = 0.24
    audioRef.current.loop = true
    audioRef.current.muted = muted
    if (impactRef.current) {
      impactRef.current.volume = 0.42
      impactRef.current.muted = muted
    }
  }, [muted])

  useEffect(() => {
    if (!started || !audioRef.current) {
      return
    }

    audioRef.current.play().catch(() => {
      console.warn(`Ambience audio could not play. Confirm ${AMBIENCE_PATH} exists.`)
    })
  }, [started])

  useEffect(() => {
    const handleImpact = () => {
      if (!impactRef.current) {
        return
      }

      impactRef.current.currentTime = 0
      impactRef.current.play().catch(() => {
        console.warn(`Impact audio could not play. Confirm ${IMPACT_PATH} exists.`)
      })
    }

    window.addEventListener('dor-intro-impact', handleImpact)

    return () => {
      window.removeEventListener('dor-intro-impact', handleImpact)
    }
  }, [])

  return (
    <>
      <audio ref={audioRef} src={AMBIENCE_PATH} preload="auto" />
      <audio ref={impactRef} src={IMPACT_PATH} preload="auto" />
    </>
  )
}

function FloorFog() {
  const fogRef = useRef(null)

  useFrame(({ clock }) => {
    if (!fogRef.current) {
      return
    }

    const elapsed = clock.getElapsedTime()
    fogRef.current.children.forEach((child, index) => {
      child.position.x += Math.sin(elapsed * 0.18 + index) * 0.0008
      child.material.opacity = 0.065 + Math.sin(elapsed * 0.42 + index * 1.7) * 0.018
    })
  })

  return (
    <group ref={fogRef} position={[START_POSITION[0], 0.055, START_POSITION[2] + 4.2]}>
      {[
        [-3.8, 0, -2.4, 5.4, 1.7, 0.18],
        [1.6, 0, -1.6, 6.2, 2.1, -0.08],
        [-0.4, 0, 1.6, 7.5, 2.4, 0.05],
        [3.2, 0, 2.8, 5.6, 1.8, -0.16],
      ].map(([x, y, z, sx, sz, rotation], index) => (
        <mesh
          key={index}
          position={[x, y + index * 0.012, z]}
          rotation={[-Math.PI / 2, 0, rotation]}
          scale={[sx, sz, 1]}
        >
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial
            color="#6f7684"
            transparent
            opacity={0.06}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function ProductAsset({ product, highlighted = false }) {
  const assetPath = resolvePublicAssetPath(product.model)
  const gltf = useGLTF(assetPath)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return (
    <>
      <primitive object={scene} />
      {highlighted && <ProductHighlight scale={product.scale} />}
    </>
  )
}

function ProductHighlight({ scale = 1 }) {
  const highlightScale = Math.max(0.8, scale * 1.15)

  return (
    <group>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={highlightScale}>
        <torusGeometry args={[0.7, 0.01, 12, 72]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.48} />
      </mesh>
      <pointLight intensity={1.2} distance={2.6} color="#9fb3ff" position={[0, 1.2, 0]} />
    </group>
  )
}

function ProductNode({ product, highlighted, registerProductGroup }) {
  const groupRef = useRef(null)
  const displayRef = useRef(null)
  const spotLightRef = useRef(null)
  const lightTargetRef = useRef(null)
  const hasModel = Boolean(product.model)
  const hoverHeight = product.hoverHeight ?? 0.18
  const rotationSpeed = product.rotationSpeed ?? 0.35
  const shouldAutoRotate = product.autoRotate ?? true
  const shouldLightProduct = product.light ?? true
  const lightPosition = product.lightPosition ?? [0, 2.6, 1.35]

  useEffect(() => {
    if (!groupRef.current) {
      return undefined
    }

    return registerProductGroup(product.id, groupRef.current)
  }, [product.id, registerProductGroup])

  useEffect(() => {
    if (spotLightRef.current && lightTargetRef.current) {
      spotLightRef.current.target = lightTargetRef.current
      lightTargetRef.current.updateMatrixWorld()
    }
  }, [])

  useFrame((_, delta) => {
    if (displayRef.current && shouldAutoRotate) {
      displayRef.current.rotation.y += rotationSpeed * delta
    }
  })

  return (
    <group
      ref={groupRef}
      position={product.position}
      rotation={product.rotation}
      scale={product.scale}
      userData={{ productId: product.id }}
    >
      {shouldLightProduct && (
        <spotLight
          ref={spotLightRef}
          castShadow
          angle={0.42}
          penumbra={0.72}
          intensity={product.lightIntensity ?? 2.1}
          color={product.lightColor ?? '#e6ebff'}
          position={lightPosition}
        />
      )}
      <object3D ref={lightTargetRef} position={[0, hoverHeight + 0.62, 0]} />
      <group ref={displayRef} position={[0, hoverHeight, 0]}>
        {hasModel ? (
          <ModelErrorBoundary
            fallback={
              <>
                <ProductFallback highlighted={highlighted} />
                {highlighted && <ProductHighlight scale={product.scale} />}
              </>
            }
          >
            <Suspense fallback={<ProductFallback highlighted={highlighted} />}>
              <ProductAsset product={product} highlighted={highlighted} />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          <>
            <ProductFallback highlighted={highlighted} />
            {highlighted && <ProductHighlight scale={product.scale} />}
          </>
        )}
      </group>
    </group>
  )
}

function ProductGallery({ hoveredProductId, registerProductGroup }) {
  return products.map((product) => (
    <ProductNode
      key={product.id}
      product={product}
      highlighted={hoveredProductId === product.id}
      registerProductGroup={registerProductGroup}
    />
  ))
}

function ProductInteractor({ activeProduct, productGroups, onHoverProduct, onOpenProduct }) {
  const { camera, gl } = useThree()
  const raycaster = useRef(new Raycaster())
  const screenCenter = useRef(new Vector2(0, 0))
  const hoveredProductRef = useRef(null)

  useFrame(() => {
    if (activeProduct) {
      if (hoveredProductRef.current) {
        hoveredProductRef.current = null
        onHoverProduct(null)
      }
      return
    }

    const groups = Array.from(productGroups.current.values())
    if (groups.length === 0) {
      return
    }

    raycaster.current.setFromCamera(screenCenter.current, camera)
    raycaster.current.far = PRODUCT_INTERACTION_DISTANCE
    const hit = raycaster.current.intersectObjects(groups, true)[0]
    const productId = hit?.object
      ? findProductId(hit.object)
      : null

    if (productId !== hoveredProductRef.current) {
      hoveredProductRef.current = productId
      onHoverProduct(productId)
    }
  })

  useEffect(() => {
    const canvas = gl.domElement
    const handleClick = () => {
      const product = products.find((item) => item.id === hoveredProductRef.current)
      if (product && !activeProduct) {
        onOpenProduct(product)
      }
    }

    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('click', handleClick)
    }
  }, [activeProduct, gl.domElement, onOpenProduct])

  return null
}

function findProductId(object) {
  let current = object

  while (current) {
    if (current.userData?.productId) {
      return current.userData.productId
    }

    current = current.parent
  }

  return null
}

function DemoEnvironment() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[3.4, 3.4, 0.1, 96]} />
        <meshStandardMaterial color="#101010" roughness={0.78} metalness={0.12} />
      </mesh>

      <mesh position={[0, 0.75, 0]} castShadow>
        <torusKnotGeometry args={[0.62, 0.18, 180, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.36} metalness={0.35} />
      </mesh>

      <mesh position={[-1.35, 0.44, -0.7]} castShadow>
        <boxGeometry args={[0.56, 0.88, 0.56]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.55} metalness={0.08} />
      </mesh>

      <mesh position={[1.35, 0.36, 0.85]} castShadow>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.42} metalness={0.22} />
      </mesh>
    </group>
  )
}

function Loader() {
  return (
    <Html center>
      <div className="loader">
        <span className="loader__dot" />
        Loading environment
      </div>
    </Html>
  )
}

function CurvedHorizon() {
  return (
    <mesh position={[0, 3.2, -9]} rotation={[0.28, 0, 0]}>
      <sphereGeometry args={[12, 64, 32, 0, Math.PI * 2, 0.12, 1.18]} />
      <meshBasicMaterial color="#090909" side={BackSide} transparent opacity={0.86} />
    </mesh>
  )
}

function CameraImpactShake({ impactCount }) {
  const { camera } = useThree()
  const shakeTime = useRef(0)
  const previousOffset = useRef(new Vector3())

  useEffect(() => {
    if (impactCount > 0) {
      camera.position.sub(previousOffset.current)
      previousOffset.current.set(0, 0, 0)
      shakeTime.current = IMPACT_SHAKE_DURATION
    }
  }, [camera, impactCount])

  useFrame((_, delta) => {
    if (previousOffset.current.lengthSq() > 0) {
      camera.position.sub(previousOffset.current)
      previousOffset.current.set(0, 0, 0)
    }

    if (shakeTime.current <= 0) {
      return
    }

    shakeTime.current = Math.max(0, shakeTime.current - delta)
    const progress = shakeTime.current / IMPACT_SHAKE_DURATION
    const strength = IMPACT_SHAKE_STRENGTH * progress * progress

    previousOffset.current.set(
      (Math.random() - 0.5) * strength,
      (Math.random() - 0.5) * strength * 0.65,
      (Math.random() - 0.5) * strength,
    )
    camera.position.add(previousOffset.current)
  })

  return null
}

function IntroTextImpact({ started, onImpact }) {
  const groupRef = useRef(null)
  const velocity = useRef(0)
  const elapsedAfterStart = useRef(0)
  const [impacted, setImpacted] = useState(false)

  useEffect(() => {
    if (!groupRef.current) {
      return
    }

    groupRef.current.position.set(...INTRO_TEXT_POSITION)
    velocity.current = 0
    elapsedAfterStart.current = 0
    setImpacted(false)
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current || !started || impacted) {
      return
    }

    elapsedAfterStart.current += delta

    if (elapsedAfterStart.current < INTRO_START_DELAY) {
      return
    }

    velocity.current += INTRO_GRAVITY * delta
    groupRef.current.position.y -= velocity.current * delta

    if (groupRef.current.position.y <= INTRO_TEXT_IMPACT_Y) {
      groupRef.current.position.y = INTRO_TEXT_IMPACT_Y
      groupRef.current.rotation.x = -0.1
      setImpacted(true)
      onImpact()
    }
  })

  return (
    <group>
      {impacted && <ImpactCrack />}
      <group ref={groupRef} rotation={[0, Math.PI, 0]} scale={INTRO_TEXT_SCALE}>
        <Suspense fallback={<IntroTextFallback />}>
          <Text3D
            font={helvetikerBold}
            size={0.78}
            height={0.24}
            bevelEnabled
            bevelSize={0.035}
            bevelThickness={0.018}
            bevelSegments={4}
            curveSegments={16}
            castShadow
            receiveShadow
          >
            {INTRO_TEXT}
            <meshStandardMaterial
              color="#030303"
              roughness={0.56}
              metalness={0.18}
              emissive="#000000"
            />
          </Text3D>
        </Suspense>
      </group>
    </group>
  )
}

function IntroTextFallback() {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[4.6, 0.82, 0.26]} />
      <meshStandardMaterial color="#030303" roughness={0.58} metalness={0.18} />
    </mesh>
  )
}

function ImpactCrack() {
  return (
    <group position={[INTRO_TEXT_POSITION[0], 0.026, INTRO_TEXT_POSITION[2] + 0.55]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.75, 72]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.82} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.92, 72]} />
        <meshBasicMaterial color="#050505" transparent opacity={0.7} depthWrite={false} />
      </mesh>
      {[
        [0, 0, 0, 2.35, 0.032, 0.12],
        [0.08, 0, 0.08, 1.85, 0.023, 1.18],
        [-0.05, 0, -0.02, 1.68, 0.021, -1.0],
        [0.1, 0, -0.04, 1.36, 0.018, 2.35],
        [-0.1, 0, 0.14, 1.55, 0.018, -2.35],
        [0.22, 0, 0.24, 1.12, 0.014, 2.86],
        [-0.28, 0, -0.28, 1.02, 0.014, -2.78],
      ].map(([x, y, z, sx, sz, rotation], index) => (
        <mesh key={index} position={[x, y + index * 0.003, z]} rotation={[-Math.PI / 2, 0, rotation]}>
          <planeGeometry args={[sx, sz]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.84} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function FirstPersonControls({ collisionMeshes, enabled }) {
  const { camera, gl } = useThree()
  const keys = useRef({})
  const velocity = useRef(new Vector3())
  const moveDirection = useRef(new Vector3())
  const pendingMove = useRef(new Vector3())
  const testMove = useRef(new Vector3())
  const testPosition = useRef(new Vector3())
  const forward = useRef(new Vector3())
  const right = useRef(new Vector3())
  const cameraEuler = useRef(new Euler(0, 0, 0, 'YXZ'))
  const wallRaycaster = useRef(new Raycaster())
  const floorRaycaster = useRef(new Raycaster())
  const wallRayOrigin = useRef(new Vector3())
  const floorRayOrigin = useRef(new Vector3())
  const floorNormal = useRef(new Vector3())
  const downDirection = useRef(new Vector3(0, -1, 0))
  const activeTouchLook = useRef(null)
  const collisionMeshesRef = useRef([])
  const enabledRef = useRef(enabled)

  useEffect(() => {
    collisionMeshesRef.current = collisionMeshes
  }, [collisionMeshes])

  useEffect(() => {
    enabledRef.current = enabled
    if (!enabled) {
      keys.current = {}
      velocity.current.set(0, 0, 0)
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock?.()
      }
    }
  }, [enabled, gl.domElement])

  useEffect(() => {
    camera.position.set(...START_POSITION)
    camera.rotation.set(0, START_YAW, 0, 'YXZ')

    const canvas = gl.domElement
    const updateKey = (event, isPressed) => {
      if (enabledRef.current || !isPressed) {
        keys.current[event.code] = isPressed
      }
    }

    const handleKeyDown = (event) => updateKey(event, true)
    const handleKeyUp = (event) => updateKey(event, false)

    const handleClick = () => {
      if (enabledRef.current && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.()
      }
    }

    const applyLookDelta = (movementX, movementY, sensitivity = 0.0022) => {
      cameraEuler.current.setFromQuaternion(camera.quaternion)
      cameraEuler.current.y -= movementX * sensitivity
      cameraEuler.current.x -= movementY * sensitivity
      cameraEuler.current.x = MathUtils.clamp(
        cameraEuler.current.x,
        -Math.PI / 2 + 0.04,
        Math.PI / 2 - 0.04,
      )
      camera.quaternion.setFromEuler(cameraEuler.current)
    }

    const handleMouseMove = (event) => {
      if (enabledRef.current && document.pointerLockElement === canvas) {
        applyLookDelta(event.movementX, event.movementY)
      }
    }

    const handlePointerDown = (event) => {
      if (enabledRef.current && event.pointerType === 'touch') {
        activeTouchLook.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        }
        canvas.setPointerCapture?.(event.pointerId)
      }
    }

    const handlePointerMove = (event) => {
      const touch = activeTouchLook.current
      if (!touch || touch.id !== event.pointerId) {
        return
      }

      applyLookDelta(event.clientX - touch.x, event.clientY - touch.y, 0.004)
      touch.x = event.clientX
      touch.y = event.clientY
    }

    const handlePointerEnd = (event) => {
      if (activeTouchLook.current?.id === event.pointerId) {
        activeTouchLook.current = null
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerEnd)
    canvas.addEventListener('pointercancel', handlePointerEnd)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerEnd)
      canvas.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [camera, gl.domElement])

  const movementHitsCollider = (fromPosition, movement) => {
    if (movement.lengthSq() === 0 || collisionMeshesRef.current.length === 0) {
      return false
    }

    const direction = movement.clone().normalize()
    const castDistance = movement.length() + BODY_RADIUS
    const bodyHeights = [0.35, 0.95, 1.45]

    for (const height of bodyHeights) {
      wallRayOrigin.current.set(
        fromPosition.x,
        fromPosition.y - EYE_HEIGHT + height,
        fromPosition.z,
      )
      wallRaycaster.current.set(wallRayOrigin.current, direction)
      wallRaycaster.current.near = 0
      wallRaycaster.current.far = castDistance

      const hit = wallRaycaster.current.intersectObjects(collisionMeshesRef.current, true)[0]

      if (hit && hit.distance <= castDistance) {
        return true
      }
    }

    return false
  }

  const getFloorY = (position) => {
    if (collisionMeshesRef.current.length === 0) {
      return MIN_FLOOR_Y
    }

    const currentFootY = position.y - EYE_HEIGHT
    floorRayOrigin.current.set(position.x, position.y + FLOOR_RAY_HEIGHT, position.z)
    floorRaycaster.current.set(floorRayOrigin.current, downDirection.current)
    floorRaycaster.current.near = 0
    floorRaycaster.current.far = FLOOR_RAY_DISTANCE

    const floorHit = floorRaycaster.current
      .intersectObjects(collisionMeshesRef.current, true)
      .find((hit) => {
        if (!hit.face) {
          return false
        }

        floorNormal.current.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
        return floorNormal.current.y > 0.45 && hit.point.y <= currentFootY + MAX_STEP_HEIGHT
      })

    if (!floorHit) {
      return MIN_FLOOR_Y
    }

    return Math.max(MIN_FLOOR_Y, floorHit.point.y)
  }

  const applyCollidedMovement = (delta) => {
    pendingMove.current.copy(velocity.current).multiplyScalar(delta)

    testMove.current.set(pendingMove.current.x, 0, 0)
    if (!movementHitsCollider(camera.position, testMove.current)) {
      camera.position.add(testMove.current)
    } else {
      velocity.current.x = 0
    }

    testMove.current.set(0, 0, pendingMove.current.z)
    if (!movementHitsCollider(camera.position, testMove.current)) {
      camera.position.add(testMove.current)
    } else {
      velocity.current.z = 0
    }

    testPosition.current.copy(camera.position)
    const floorY = getFloorY(testPosition.current)
    camera.position.y = floorY + EYE_HEIGHT
  }

  useFrame((_, delta) => {
    if (!enabledRef.current) {
      velocity.current.set(0, 0, 0)
      return
    }

    const pressed = keys.current
    const inputX =
      Number(Boolean(pressed.KeyD || pressed.ArrowRight)) -
      Number(Boolean(pressed.KeyA || pressed.ArrowLeft))
    const inputZ =
      Number(Boolean(pressed.KeyW || pressed.ArrowUp)) -
      Number(Boolean(pressed.KeyS || pressed.ArrowDown))
    const isSprinting = Boolean(pressed.ShiftLeft || pressed.ShiftRight)
    const speed = isSprinting ? 6.2 : 3.1

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.set(-forward.current.z, 0, forward.current.x)

    moveDirection.current.set(0, 0, 0)
    moveDirection.current.addScaledVector(forward.current, inputZ)
    moveDirection.current.addScaledVector(right.current, inputX)

    if (moveDirection.current.lengthSq() > 0) {
      moveDirection.current.normalize().multiplyScalar(speed)
    }

    const response = 1 - Math.exp(-12 * delta)
    velocity.current.lerp(moveDirection.current, response)
    applyCollidedMovement(delta)
  })

  const setVirtualKey = (code, isPressed) => {
    if (enabledRef.current || !isPressed) {
      keys.current[code] = isPressed
    }
  }

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="touch-controls" aria-label="Mobile walking controls">
        <button
          aria-label="Move forward"
          className="touch-button touch-button--up"
          onPointerDown={() => setVirtualKey('KeyW', true)}
          onPointerUp={() => setVirtualKey('KeyW', false)}
          onPointerCancel={() => setVirtualKey('KeyW', false)}
        >
          W
        </button>
        <button
          aria-label="Move left"
          className="touch-button touch-button--left"
          onPointerDown={() => setVirtualKey('KeyA', true)}
          onPointerUp={() => setVirtualKey('KeyA', false)}
          onPointerCancel={() => setVirtualKey('KeyA', false)}
        >
          A
        </button>
        <button
          aria-label="Move backward"
          className="touch-button touch-button--down"
          onPointerDown={() => setVirtualKey('KeyS', true)}
          onPointerUp={() => setVirtualKey('KeyS', false)}
          onPointerCancel={() => setVirtualKey('KeyS', false)}
        >
          S
        </button>
        <button
          aria-label="Move right"
          className="touch-button touch-button--right"
          onPointerDown={() => setVirtualKey('KeyD', true)}
          onPointerUp={() => setVirtualKey('KeyD', false)}
          onPointerCancel={() => setVirtualKey('KeyD', false)}
        >
          D
        </button>
      </div>
    </Html>
  )
}

function ProductPreview({ product }) {
  const hasModel = Boolean(product.model)

  return (
    <Canvas camera={{ position: [0, 1.05, 3], fov: 42 }} dpr={[1, 2]} gl={{ alpha: true }}>
      <ambientLight intensity={0.65} />
      <directionalLight intensity={2.4} position={[2.4, 3, 2]} />
      <group position={[0, -0.35, 0]} rotation={product.rotation} scale={product.scale}>
        {hasModel ? (
          <Suspense fallback={<ProductFallback />}>
            <ModelErrorBoundary fallback={<ProductFallback />}>
              <ProductAsset product={product} />
            </ModelErrorBoundary>
          </Suspense>
        ) : (
          <ProductFallback />
        )}
      </group>
    </Canvas>
  )
}

function ProductPanel({ product, onClose }) {
  if (!product) {
    return null
  }

  const productMessage =
    product.whatsappMessage ||
    `Hello, I'm interested in purchasing ${product.name} priced at ${product.price}.`
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(productMessage)}`

  return (
    <div className="product-panel-backdrop" role="presentation">
      <aside className="product-panel" aria-label={`${product.name} product details`}>
        <div className="product-panel__preview">
          <ProductPreview product={product} />
        </div>
        <div className="product-panel__content">
          <p className="eyebrow">Gallery piece</p>
          <h2>{product.name}</h2>
          <p className="product-panel__description">{product.description}</p>
          <p className="product-panel__price">{product.price}</p>
          <div className="product-panel__actions">
            <a className="buy-button" href={whatsappUrl} target="_blank" rel="noreferrer">
              Buy Now
            </a>
            <button className="close-button" type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Experience({ introStarted }) {
  const [collisionMeshes, setCollisionMeshes] = useState([])
  const [hoveredProductId, setHoveredProductId] = useState(null)
  const [activeProduct, setActiveProduct] = useState(null)
  const [impactCount, setImpactCount] = useState(0)
  const productGroups = useRef(new Map())
  const controlsEnabled = !activeProduct

  const handleIntroImpact = () => {
    window.dispatchEvent(new Event('dor-intro-impact'))
    setImpactCount((count) => count + 1)
  }

  const registerProductGroup = (id, group) => {
    productGroups.current.set(id, group)

    return () => {
      productGroups.current.delete(id)
    }
  }

  return (
    <>
      <Canvas
        shadows
        camera={{ position: START_POSITION, fov: 68 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 8, 30]} />
        <ambientLight intensity={0.22} />
        <directionalLight
          castShadow
          intensity={2.8}
          position={[4.5, 7, 3.2]}
          shadow-mapSize={[2048, 2048]}
        />
        <spotLight
          castShadow
          angle={0.32}
          penumbra={0.8}
          intensity={5.4}
          position={[-3.8, 5.8, 1.5]}
          color="#d9e4ff"
        />
        <pointLight intensity={1.4} position={[3, 1.8, -3.5]} color="#5f7cff" />
        <pointLight intensity={1.1} position={[-4, 1.2, -2.5]} color="#ffffff" />
        <CurvedHorizon />
        <FloorFog />
        <IntroTextImpact started={introStarted} onImpact={handleIntroImpact} />
        <CameraImpactShake impactCount={impactCount} />

        <Suspense fallback={<Loader />}>
          <ModelErrorBoundary fallback={<DemoEnvironment />}>
            <SceneModel onCollisionMeshes={setCollisionMeshes} />
          </ModelErrorBoundary>
          <ProductGallery
            hoveredProductId={hoveredProductId}
            registerProductGroup={registerProductGroup}
          />
          <Environment preset="night" />
          <ContactShadows
            opacity={0.35}
            scale={12}
            blur={2.8}
            far={8}
            position={[0, -0.03, 0]}
          />
        </Suspense>

        <ProductInteractor
          activeProduct={activeProduct}
          productGroups={productGroups}
          onHoverProduct={setHoveredProductId}
          onOpenProduct={setActiveProduct}
        />
        <FirstPersonControls collisionMeshes={collisionMeshes} enabled={controlsEnabled} />
      </Canvas>

      {!activeProduct && <div className="crosshair" aria-hidden="true" />}
      {!activeProduct && hoveredProductId && (
        <div className="inspect-prompt">Click to Inspect</div>
      )}
      <ProductPanel product={activeProduct} onClose={() => setActiveProduct(null)} />
    </>
  )
}

export default function App() {
  const [audioStarted, setAudioStarted] = useState(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    if (audioStarted) {
      return undefined
    }

    const startAudio = () => setAudioStarted(true)

    window.addEventListener('pointerdown', startAudio, { once: true })
    window.addEventListener('keydown', startAudio, { once: true })

    return () => {
      window.removeEventListener('pointerdown', startAudio)
      window.removeEventListener('keydown', startAudio)
    }
  }, [audioStarted])

  return (
    <main className="app-shell">
      <AmbientAudio started={audioStarted} muted={muted} />
      <Experience introStarted={audioStarted} />

      <section className="ui-overlay" aria-label="3Dexpo controls and status">
        <div>
          <p className="eyebrow">3Dexpo</p>
          <h1>Walk the environment</h1>
        </div>
        <p className="status">Click to look. Use WASD or arrows to walk. Hold Shift to move faster.</p>
      </section>
      <button className="audio-toggle" type="button" onClick={() => setMuted((isMuted) => !isMuted)}>
        {muted ? 'Unmute' : 'Mute'}
      </button>
    </main>
  )
}

useGLTF.preload(MODEL_PATH)
