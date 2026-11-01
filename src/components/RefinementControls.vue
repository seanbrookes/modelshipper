<template>
  <div class="section">
    <div class="section-header">Refinement</div>
    <div class="gui-host" ref="guiContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import GUI from 'lil-gui'
import { state, dispatch } from '@/store/vesselStore.js'

const guiContainer = ref(null)
let gui = null

onMounted(() => {
  gui = new GUI({ container: guiContainer.value, autoPlace: false, width: 298 })
  gui.title('Position & Scale')

  const proxy = {
    bridge_pos:    state.visual.bridge_position_ratio,
    bridge_height: state.visual.bridge_height_offset,
    draft:         state.visual.draft_offset
  }

  const ctrlPos = gui.add(proxy, 'bridge_pos', 0, 1, 0.01)
    .name('Bridge Position')
    .onChange((v) => dispatch('SET_BRIDGE_POSITION', v))

  const ctrlHeight = gui.add(proxy, 'bridge_height', -5, 20, 0.1)
    .name('Bridge Height Offset')
    .onChange((v) => dispatch('SET_BRIDGE_HEIGHT', v))

  const ctrlDraft = gui.add(proxy, 'draft', 0, 30, 0.1)
    .name('Draft Offset')
    .onChange((v) => dispatch('SET_DRAFT_OFFSET', v))

  // Sync store → GUI when changed externally (e.g. DNA import)
  watch(() => state.visual.bridge_position_ratio, (v) => {
    proxy.bridge_pos = v
    ctrlPos.updateDisplay()
  })
  watch(() => state.visual.bridge_height_offset, (v) => {
    proxy.bridge_height = v
    ctrlHeight.updateDisplay()
  })
  watch(() => state.visual.draft_offset, (v) => {
    proxy.draft = v
    ctrlDraft.updateDisplay()
  })
})

onUnmounted(() => {
  if (gui) gui.destroy()
})
</script>
