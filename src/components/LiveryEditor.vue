<template>
  <div class="section">
    <div class="section-header">Livery</div>
    <div class="livery-grid">
      <div class="livery-slot" v-for="slot in slots" :key="slot.key">
        <label>{{ slot.label }}</label>
        <input
          type="color"
          :value="state.visual.livery[slot.key]"
          @input="e => dispatch('SET_LIVERY_COLOR', { slot: slot.key, color: e.target.value })"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { state, dispatch } from '@/store/vesselStore.js'

const slots = [
  { key: 'hull_primary',   label: 'Hull Primary' },
  { key: 'hull_secondary', label: 'Hull Secondary' },
  { key: 'superstructure', label: 'Superstructure' },
  { key: 'funnel',         label: 'Funnel' }
]
</script>
