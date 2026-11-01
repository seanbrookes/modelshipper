<template>
  <div class="sidebar">
    <ContactSheet />
    <RegistryInput />
  </div>

  <div class="stage">
    <ThreeStage />
  </div>

  <div class="panel">
    <div v-if="state.ui.errorMessage" class="error-banner">{{ state.ui.errorMessage }}</div>
    <div class="panel-scroll">
      <PartSelector />
      <LiveryEditor />
      <RefinementControls />
    </div>
    <BakeButton />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { state, dispatch } from '@/store/vesselStore.js'
import ThreeStage from '@/components/ThreeStage.vue'
import RegistryInput from '@/components/RegistryInput.vue'
import PartSelector from '@/components/PartSelector.vue'
import RefinementControls from '@/components/RefinementControls.vue'
import LiveryEditor from '@/components/LiveryEditor.vue'
import BakeButton from '@/components/BakeButton.vue'

onMounted(async () => {
  try {
    const [manifestRes, archetypesRes] = await Promise.all([
      fetch('/parts/partsManifest.json'),
      fetch('/parts/archetypes.json')
    ])
    if (!manifestRes.ok)   throw new Error(`Manifest HTTP ${manifestRes.status}`)
    if (!archetypesRes.ok) throw new Error(`Archetypes HTTP ${archetypesRes.status}`)

    const [manifest, archetypes] = await Promise.all([manifestRes.json(), archetypesRes.json()])
    dispatch('SET_MANIFEST', manifest)
    dispatch('SET_ARCHETYPES', archetypes)
  } catch (e) {
    dispatch('SET_ERROR', `Failed to load data: ${e.message}`)
  }
})
</script>
