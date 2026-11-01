<template>
  <div class="section archetype-section">
    <div class="section-header">Vessel Archetype</div>
    <div class="archetype-grid">
      <div
        v-for="arch in archetypes"
        :key="arch.id"
        class="archetype-cell"
        :class="{ active: isActive(arch) }"
        @click="select(arch)"
      >
        <svg viewBox="0 0 96 40" width="88" height="36" fill="none" preserveAspectRatio="xMidYMid meet">
          <path
            :d="arch.thumbnail_svg_path"
            :fill="arch.visual_config.livery.hull_primary"
            fill-opacity="0.85"
            :stroke="arch.visual_config.livery.hull_primary"
            stroke-width="0.8"
          />
        </svg>
        <div class="archetype-label">{{ arch.label }}</div>
        <div class="archetype-sub">{{ arch.subtitle }}</div>
        <div class="archetype-dims">{{ arch.loa }}m · {{ arch.beam }}m</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { state, dispatch } from '@/store/vesselStore.js'

const archetypes = computed(() => state.archetypes ?? [])

function isActive(arch) {
  return (
    state.vessel.loa === arch.loa &&
    state.visual.hull_id === arch.visual_config.hull_id &&
    state.visual.superstructure_id === arch.visual_config.superstructure_id
  )
}

function select(arch) {
  dispatch('SET_ARCHETYPE', arch)
  // Pre-fill vessel name from archetype label if blank
  if (!state.vessel.name) {
    dispatch('SET_VESSEL_META', { name: arch.label + ' (' + arch.subtitle + ')' })
  }
}
</script>
