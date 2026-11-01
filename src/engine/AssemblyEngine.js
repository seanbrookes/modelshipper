import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)

const cache = new Map()

let hullGroup        = null
let superstructGroup = null
let funnelGroup      = null
let cargoGroup       = null
let boundingBoxHelper = null

const _box  = new THREE.Box3()
const _size = new THREE.Vector3()

function measureZ(obj) {
  _box.setFromObject(obj)
  _box.getSize(_size)
  return _size.z
}

function slotForUrl(url) {
  if (url.includes('ss_') || url.includes('bridge')) return 'superstructure'
  if (url.includes('funnel'))                         return 'funnel'
  if (url.includes('cargo'))                          return 'hull_secondary'
  return 'hull_primary'
}

function stubDimensions(url) {
  if (url.includes('_bow'))    return [10, 12, 40]
  if (url.includes('_mid'))    return [10, 12, 50]
  if (url.includes('_stern'))  return [10, 12, 35]
  if (url.includes('ss_'))     return [14, 22, 18]
  if (url.includes('funnel'))  return [6, 14, 6]
  if (url.includes('cargo'))   return [8, 5, 180]
  return [10, 10, 30]
}

function buildStubMesh(url) {
  const [w, h, d] = stubDimensions(url)
  const slot = slotForUrl(url)
  const geo  = new THREE.BoxGeometry(w, h, d)
  const mat  = new THREE.MeshStandardMaterial({ color: 0x888888 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.userData.materialSlot = slot
  mesh.position.set(0, h / 2, d / 2)
  const group = new THREE.Group()
  group.add(mesh)
  console.warn(`[AssemblyEngine] Stub for ${url}`)
  return { scene: group, animations: [] }
}

function loadCached(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url))
  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => { cache.set(url, gltf); resolve(gltf) },
      undefined,
      () => { const stub = buildStubMesh(url); cache.set(url, stub); resolve(stub) }
    )
  })
}

function disposeObject(obj) {
  obj.traverse((child) => {
    if (!child.isMesh) return
    child.geometry.dispose()
    const mats = Array.isArray(child.material) ? child.material : [child.material]
    mats.forEach((m) => m.dispose())
  })
}

function removeFromScene(scene, obj) {
  if (obj && obj.parent === scene) {
    scene.remove(obj)
    disposeObject(obj)
  }
}

export async function rebuild(scene, state) {
  const { loa, beam, moulded_depth } = state.vessel
  const {
    hull_id, superstructure_id, funnel_id, cargo_layout_id,
    bridge_position_ratio, bridge_height_offset, draft_offset
  } = state.visual
  const manifest = state.manifest
  if (!manifest) return

  const hullDef    = manifest.hulls.find((h) => h.id === hull_id)
  const ssDef      = manifest.superstructures.find((s) => s.id === superstructure_id)
  const funnelDef  = manifest.funnels.find((f) => f.id === funnel_id)
  const cargoDef   = manifest.cargos.find((c) => c.id === cargo_layout_id)
  if (!hullDef) return

  removeFromScene(scene, hullGroup)
  removeFromScene(scene, superstructGroup)
  removeFromScene(scene, funnelGroup)
  removeFromScene(scene, cargoGroup)
  removeFromScene(scene, boundingBoxHelper)
  hullGroup = superstructGroup = funnelGroup = cargoGroup = boundingBoxHelper = null

  const base = '/parts/'
  const loads = [
    loadCached(base + hullDef.parts.bow.file),
    loadCached(base + hullDef.parts.mid.file),
    loadCached(base + hullDef.parts.stern.file)
  ]
  if (ssDef)     loads.push(loadCached(base + ssDef.file))
  if (funnelDef) loads.push(loadCached(base + funnelDef.file))
  if (cargoDef)  loads.push(loadCached(base + cargoDef.file))

  const [bowGltf, midGltf, sternGltf, ssGltf, funnelGltf, cargoGltf] = await Promise.all(loads)

  // ── Hull assembly ──
  const bow   = bowGltf.scene.clone(true)
  const mid   = midGltf.scene.clone(true)
  const stern = sternGltf.scene.clone(true)

  const bowLen   = measureZ(bow)
  const midLen   = measureZ(mid)
  const sternLen = measureZ(stern)
  const midScaleZ    = Math.max(0.05, (loa - bowLen - sternLen) / midLen)
  const midScaledLen = midLen * midScaleZ

  mid.scale.z = midScaleZ
  stern.position.set(0, 0, 0)
  mid.position.set(0, 0, sternLen)
  bow.position.set(0, 0, sternLen + midScaledLen)

  hullGroup = new THREE.Group()
  hullGroup.name = 'hull'
  hullGroup.add(stern, mid, bow)
  hullGroup.position.set(0, -draft_offset, -(loa / 2))
  scene.add(hullGroup)

  // ── Superstructure ──
  if (ssGltf) {
    const ssClone = ssGltf.scene.clone(true)
    const ssZ = (1.0 - bridge_position_ratio) * loa - loa / 2
    ssClone.position.set(0, moulded_depth - draft_offset + bridge_height_offset, ssZ)
    superstructGroup = new THREE.Group()
    superstructGroup.name = 'superstructure'
    superstructGroup.add(ssClone)
    scene.add(superstructGroup)
  }

  // ── Funnel (placed just aft of superstructure by a fixed offset) ──
  if (funnelGltf) {
    const funnelClone = funnelGltf.scene.clone(true)
    // Funnel sits ~10% of LOA aft of bridge, on top of hull
    const funnelRatio = Math.max(0.01, bridge_position_ratio - 0.06)
    const funnelZ = (1.0 - funnelRatio) * loa - loa / 2
    funnelClone.position.set(0, moulded_depth - draft_offset, funnelZ)
    funnelGroup = new THREE.Group()
    funnelGroup.name = 'funnel'
    funnelGroup.add(funnelClone)
    scene.add(funnelGroup)
  }

  // ── Cargo ──
  if (cargoGltf) {
    const cargoClone = cargoGltf.scene.clone(true)
    cargoClone.position.set(0, moulded_depth - draft_offset, 0)
    cargoGroup = new THREE.Group()
    cargoGroup.name = 'cargo'
    cargoGroup.add(cargoClone)
    scene.add(cargoGroup)
  }

  // ── Bounding box ──
  const constraintBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(0, moulded_depth / 2 - draft_offset, 0),
    new THREE.Vector3(beam, moulded_depth, loa)
  )
  boundingBoxHelper = new THREE.Box3Helper(constraintBox, 0x00ff88)
  boundingBoxHelper.name = 'boundingBox'
  scene.add(boundingBoxHelper)

  applyLivery(state.visual.livery)
  applyBoundingBoxVisibility(state.ui.showBoundingBox)
  applyWireframe(state.ui.showWireframe)
}

export function applyLivery(livery) {
  for (const group of [hullGroup, superstructGroup, funnelGroup, cargoGroup]) {
    if (!group) continue
    group.traverse((obj) => {
      if (!obj.isMesh) return
      const slot = obj.userData.materialSlot
      if (slot && livery[slot] !== undefined) obj.material.color.set(livery[slot])
    })
  }
}

export function applyBoundingBoxVisibility(visible) {
  if (boundingBoxHelper) boundingBoxHelper.visible = visible
}

export function applyWireframe(wireframe) {
  if (!hullGroup) return
  hullGroup.traverse((obj) => { if (obj.isMesh) obj.material.wireframe = wireframe })
}

export function getAssemblyGroups() {
  return { hullGroup, superstructGroup, funnelGroup, cargoGroup }
}

export function disposeAll(scene) {
  for (const g of [hullGroup, superstructGroup, funnelGroup, cargoGroup, boundingBoxHelper]) {
    removeFromScene(scene, g)
  }
  hullGroup = superstructGroup = funnelGroup = cargoGroup = boundingBoxHelper = null
}
