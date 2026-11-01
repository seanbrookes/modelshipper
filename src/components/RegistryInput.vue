<template>
  <div class="section registry-section">
    <div class="section-header">Registry</div>

    <!-- Active config summary -->
    <div class="registry-status">
      <span class="status-type">{{ activeSummary }}</span>
      <span class="status-dims" v-if="state.vessel.loa">
        {{ state.vessel.loa }}m &times; {{ state.vessel.beam }}m &times; {{ state.vessel.moulded_depth }}m
      </span>
    </div>

    <!-- Preset buttons -->
    <div class="preset-grid" v-if="archetypes.length">
      <button
        v-for="arch in archetypes"
        :key="arch.id"
        class="preset-btn"
        :class="{ active: isActive(arch) }"
        :title="`${arch.subtitle} · LOA ${arch.loa}m · Beam ${arch.beam}m · Depth ${arch.moulded_depth}m`"
        @click="applyPreset(arch)"
      >{{ arch.label }}</button>
    </div>

    <!-- Edit Details toggle + DNA actions on same row -->
    <div class="registry-actions">
      <button class="edit-details-toggle" @click="showDetails = !showDetails">
        {{ showDetails ? '▲' : '▼' }} Edit Details
      </button>
      <button class="dna-btn" @click="exportDNAFile" title="Export vessel DNA as JSON">Export</button>
      <button class="dna-btn" @click="triggerImport" title="Import vessel DNA from JSON">Import</button>
      <input ref="fileInput" type="file" accept=".json" style="display:none" @change="onImportFile" />
    </div>

    <!-- Collapsible detail form -->
    <div v-if="showDetails" class="details-form">
      <div class="field-row">
        <label>IMO</label>
        <input type="text" v-model="local.imo" @blur="commitMeta" placeholder="9810367" />
      </div>
      <div class="field-row">
        <label>Name</label>
        <input type="text" v-model="local.name" @blur="commitMeta" placeholder="Vessel Name" />
      </div>
      <div class="field-row">
        <label>Operator</label>
        <input type="text" v-model="local.operator" @blur="commitMeta" placeholder="Operator" />
      </div>
      <div class="field-row">
        <label>LOA (m)</label>
        <input type="number" v-model.number="local.loa" @blur="commitDims" min="50" max="500" step="0.5" />
      </div>
      <div class="field-row">
        <label>Beam (m)</label>
        <input type="number" v-model.number="local.beam" @blur="commitDims" min="10" max="100" step="0.5" />
      </div>
      <div class="field-row">
        <label>Depth (m)</label>
        <input type="number" v-model.number="local.moulded_depth" @blur="commitDims" min="5" max="60" step="0.5" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { state, dispatch, exportDNA, importDNA } from '@/store/vesselStore.js'

const fileInput   = ref(null)
const showDetails = ref(false)

const archetypes = computed(() => state.archetypes ?? [])

const local = reactive({
  imo:           state.vessel.imo,
  name:          state.vessel.name,
  operator:      state.vessel.operator,
  loa:           state.vessel.loa,
  beam:          state.vessel.beam,
  moulded_depth: state.vessel.moulded_depth
})

watch(() => state.vessel, (v) => {
  local.imo           = v.imo
  local.name          = v.name
  local.operator      = v.operator
  local.loa           = v.loa
  local.beam          = v.beam
  local.moulded_depth = v.moulded_depth
}, { deep: true })

const activeSummary = computed(() => {
  const match = archetypes.value.find(
    (a) => a.visual_config.hull_id === state.visual.hull_id && a.loa === state.vessel.loa
  )
  if (match) return `${match.label} · ${match.subtitle}`
  return state.vessel.name || 'No archetype selected'
})

function isActive(arch) {
  return arch.visual_config.hull_id === state.visual.hull_id && arch.loa === state.vessel.loa
}

function applyPreset(arch) {
  dispatch('SET_ARCHETYPE', arch)
  showDetails.value = false
}

function commitMeta() {
  dispatch('SET_VESSEL_META', { imo: local.imo, name: local.name, operator: local.operator })
}

function commitDims() {
  dispatch('SET_DIMENSIONS', {
    loa: local.loa,
    beam: local.beam,
    moulded_depth: local.moulded_depth
  })
}

function exportDNAFile() {
  const dna = exportDNA()
  const blob = new Blob([JSON.stringify(dna, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vessel_dna_${state.vessel.imo || 'vessel'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() { fileInput.value.click() }

function onImportFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      importDNA(JSON.parse(ev.target.result))
      dispatch('SET_ERROR', null)
      showDetails.value = false
    } catch {
      dispatch('SET_ERROR', 'Invalid DNA JSON file')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}
</script>
