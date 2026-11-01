<template>
  <div class="stage">
    <canvas ref="canvasEl"></canvas>
    <div class="stage-overlay">
      <button
        class="stage-btn"
        :class="{ active: state.ui.showBoundingBox }"
        @click="dispatch('TOGGLE_BOUNDING_BOX')"
      >BBOX</button>
      <button
        class="stage-btn"
        :class="{ active: state.ui.showWireframe }"
        @click="dispatch('TOGGLE_WIREFRAME')"
      >WIRE</button>
    </div>
    <div v-if="state.ui.loading" class="loading-bar" :style="{ width: state.ui.loadingProgress + '%' }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { SRGBColorSpace } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as AssemblyEngine from '@/engine/AssemblyEngine.js'
import { state, dispatch } from '@/store/vesselStore.js'

const canvasEl = ref(null)

let renderer, camera, scene, controls, animFrameId

function onResize() {
  const el = canvasEl.value.parentElement
  const w = el.clientWidth
  const h = el.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
}

async function doRebuild() {
  dispatch('SET_LOADING', { loading: true, progress: 30 })
  try {
    await AssemblyEngine.rebuild(scene, state)
    dispatch('SET_LOADING', { loading: false, progress: 100 })
  } catch (e) {
    dispatch('SET_ERROR', String(e))
    dispatch('SET_LOADING', { loading: false, progress: 0 })
  }
}

onMounted(async () => {
  const el = canvasEl.value.parentElement
  const w = el.clientWidth
  const h = el.clientHeight

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(w, h, false)
  renderer.outputColorSpace = SRGBColorSpace

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x080808)

  camera = new THREE.PerspectiveCamera(45, w / h, 0.5, 5000)
  const d = state.vessel.moulded_depth
  const l = state.vessel.loa
  camera.position.set(0, d * 1.5, l * 0.8)

  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  const sun = new THREE.DirectionalLight(0xffffff, 1.2)
  sun.position.set(100, 200, 100)
  scene.add(ambient, sun)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.target.set(0, d * 0.3, 0)
  controls.update()

  const loop = () => {
    animFrameId = requestAnimationFrame(loop)
    controls.update()
    renderer.render(scene, camera)
  }
  loop()

  window.addEventListener('resize', onResize)

  await doRebuild()
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  window.removeEventListener('resize', onResize)
  if (controls) controls.dispose()
  if (scene)    AssemblyEngine.disposeAll(scene)
  if (scene) {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => m.dispose())
      }
    })
  }
  if (renderer) renderer.dispose()
})

// Rebuild when any assembly-relevant state changes
watch(
  () => [
    state.visual.hull_id,
    state.visual.superstructure_id,
    state.visual.funnel_id,
    state.visual.cargo_layout_id,
    state.vessel.loa,
    state.vessel.beam,
    state.vessel.moulded_depth,
    state.visual.draft_offset,
    state.visual.bridge_position_ratio,
    state.visual.bridge_height_offset
  ],
  () => {
    if (scene && state.manifest) doRebuild()
  }
)

// Livery update (no full rebuild needed)
watch(
  () => ({ ...state.visual.livery }),
  (livery) => { if (scene) AssemblyEngine.applyLivery(livery) },
  { deep: true }
)

// Bounding box toggle
watch(
  () => state.ui.showBoundingBox,
  (v) => AssemblyEngine.applyBoundingBoxVisibility(v)
)

// Wireframe toggle
watch(
  () => state.ui.showWireframe,
  (v) => AssemblyEngine.applyWireframe(v)
)

// Manifest loaded → initial build
watch(
  () => state.manifest,
  (m) => { if (m && scene) doRebuild() }
)

defineExpose({ getAssemblyGroups: AssemblyEngine.getAssemblyGroups })
</script>
