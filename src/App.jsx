import { Component, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BackSide, Euler, MathUtils, Raycaster, Vector3 } from 'three'
import {
  ContactShadows,
  Environment,
  Html,
  useGLTF,
} from '@react-three/drei'

const MODEL_PATH = `${import.meta.env.BASE_URL}models/scene.glb`
const EYE_HEIGHT = 1.65
const START_POSITION = [8.776, 1.650, -45.208]
const BODY_RADIUS = 0.35
const MIN_FLOOR_Y = 0
const FLOOR_RAY_HEIGHT = 1.2
const FLOOR_RAY_DISTANCE = 4
const MAX_STEP_HEIGHT = 0.45

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

function FirstPersonControls({ collisionMeshes }) {
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

  useEffect(() => {
    collisionMeshesRef.current = collisionMeshes
  }, [collisionMeshes])

  useEffect(() => {
    camera.position.set(...START_POSITION)
    camera.rotation.set(0, 0, 0, 'YXZ')

    const canvas = gl.domElement
    const updateKey = (event, isPressed) => {
      keys.current[event.code] = isPressed
    }

    const handleKeyDown = (event) => updateKey(event, true)
    const handleKeyUp = (event) => updateKey(event, false)

    const handleClick = () => {
      if (document.pointerLockElement !== canvas) {
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
      if (document.pointerLockElement === canvas) {
        applyLookDelta(event.movementX, event.movementY)
      }
    }

    const handlePointerDown = (event) => {
      if (event.pointerType === 'touch') {
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
    keys.current[code] = isPressed
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

function Experience() {
  const [collisionMeshes, setCollisionMeshes] = useState([])

  return (
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

      <Suspense fallback={<Loader />}>
        <ModelErrorBoundary fallback={<DemoEnvironment />}>
          <SceneModel onCollisionMeshes={setCollisionMeshes} />
        </ModelErrorBoundary>
        <Environment preset="night" />
        <ContactShadows
          opacity={0.35}
          scale={12}
          blur={2.8}
          far={8}
          position={[0, -0.03, 0]}
        />
      </Suspense>

      <FirstPersonControls collisionMeshes={collisionMeshes} />
    </Canvas>
  )
}

export default function App() {
  return (
    <main className="app-shell">
      <Experience />

      <section className="ui-overlay" aria-label="3Dexpo controls and status">
        <div>
          <p className="eyebrow">3Dexpo</p>
          <h1>Walk the environment</h1>
        </div>
        <p className="status">Click to look. Use WASD or arrows to walk. Hold Shift to move faster.</p>
      </section>
    </main>
  )
}

useGLTF.preload(MODEL_PATH)
