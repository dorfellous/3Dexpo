import { Component, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { BackSide } from 'three'
import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'

const MODEL_PATH = `${import.meta.env.BASE_URL}models/scene.glb`

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

function SceneModel() {
  const gltf = useGLTF(MODEL_PATH)

  useEffect(() => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [gltf.scene])

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

function Experience() {
  return (
    <Canvas
      shadows
      camera={{ position: [4.6, 2.7, 5.6], fov: 42 }}
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
          <SceneModel />
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

      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={0.22}
        enableDamping
        dampingFactor={0.075}
        minDistance={1.25}
        maxDistance={24}
        target={[0, 0.8, 0]}
      />
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
          <h1>Interactive environment</h1>
        </div>
        <p className="status">Drag to orbit. Pinch or scroll to zoom.</p>
      </section>
    </main>
  )
}

useGLTF.preload(MODEL_PATH)
