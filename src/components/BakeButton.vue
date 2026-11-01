<template>
  <div class="bake-section">
    <button class="bake-btn" :disabled="state.ui.baking || !state.manifest" @click="bake">
      {{ state.ui.baking ? 'Baking…' : 'Bake & Download .glb' }}
    </button>
    <div class="bake-status">{{ state.lastBakedFile || '' }}</div>
  </div>
</template>

<script setup>
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import * as THREE from 'three'
import { state, dispatch } from '@/store/vesselStore.js'
import * as AssemblyEngine from '@/engine/AssemblyEngine.js'

function disposeClone(obj) {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.geometry.dispose()
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach((m) => m.dispose())
    }
  })
}

async function bake() {
  const { hullGroup, superstructGroup, funnelGroup, cargoGroup } = AssemblyEngine.getAssemblyGroups()
  if (!hullGroup) {
    dispatch('SET_ERROR', 'Nothing to bake — build the scene first.')
    return
  }

  dispatch('SET_BAKING', true)
  dispatch('SET_ERROR', null)

  try {
    const exportGroup = new THREE.Group()

    // Clone groups; exclude bounding box helper
    for (const grp of [hullGroup, superstructGroup, funnelGroup, cargoGroup]) {
      if (!grp) continue
      const clone = grp.clone(true)
      // Deep-clone materials so each mesh gets its own instance with baked color
      clone.traverse((obj) => {
        if (obj.isMesh) {
          obj.material = obj.material.clone()
          obj.material.needsUpdate = true
        }
      })
      exportGroup.add(clone)
    }

    exportGroup.updateMatrixWorld(true)

    const exporter = new GLTFExporter()
    const arrayBuffer = await exporter.parseAsync(exportGroup, {
      binary: true,
      onlyVisible: true,
      trs: false
    })

    const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' })
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const slug = (state.vessel.name || 'vessel').replace(/\s+/g, '_').toLowerCase()
    const imo  = state.vessel.imo || 'imo0'
    const filename = `${slug}_${imo}_${date}.glb`

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)

    dispatch('SET_LAST_BAKED_FILE', filename)
    disposeClone(exportGroup)
  } catch (e) {
    dispatch('SET_ERROR', `Bake failed: ${e.message}`)
  } finally {
    dispatch('SET_BAKING', false)
  }
}
</script>
