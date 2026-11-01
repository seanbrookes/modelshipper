<template>
  <div class="section" style="display:flex;flex-direction:column;min-height:0;">
    <div class="section-header">Kit of Parts</div>
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>
    <div class="panel-scroll">

      <!-- Hull -->
      <div v-if="activeTab === 'hull'" class="part-grid-2col">
        <div
          v-for="item in hulls"
          :key="item.id"
          class="part-cell hull-cell"
          :class="{ selected: state.visual.hull_id === item.id }"
          :title="item.description"
          @click="dispatch('SET_HULL', item.id)"
        >
          <!--
            viewBox 256×88, displayed at 128×44 → 0.5× scale.
            stroke-width="4" → 2px effective. fill-opacity 0.42 → rgb(90,90,90) on #1c1c1c: clearly visible.
          -->
          <svg viewBox="0 0 256 88" width="128" height="44" preserveAspectRatio="xMidYMid meet" style="display:block">
            <path
              v-if="item.thumbnail_hull_path"
              :d="item.thumbnail_hull_path"
              fill="currentColor"
              fill-opacity="0.42"
              stroke="currentColor"
              stroke-width="4"
              stroke-linejoin="round"
            />
            <path
              v-if="item.thumbnail_bulb_path"
              :d="item.thumbnail_bulb_path"
              fill="currentColor"
              fill-opacity="0.75"
              stroke="currentColor"
              stroke-width="3.5"
              stroke-linejoin="round"
            />
            <path
              v-if="item.thumbnail_deck_path"
              :d="item.thumbnail_deck_path"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-opacity="0.65"
              stroke-linecap="round"
            />
          </svg>
          <span>{{ item.label }}</span>
          <span class="part-desc">{{ item.description.split('—')[1]?.trim() }}</span>
        </div>
      </div>

      <!-- Superstructure — viewBox 52×48 at 48px wide → 0.92× scale; stroke-width 2 → ~1.8px -->
      <div v-if="activeTab === 'ss'" class="part-grid">
        <div
          v-for="item in superstructures"
          :key="item.id"
          class="part-cell"
          :class="{ selected: state.visual.superstructure_id === item.id }"
          :title="item.description"
          @click="dispatch('SET_SUPERSTRUCTURE', item.id)"
        >
          <svg viewBox="0 0 52 48" width="48" height="44" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" preserveAspectRatio="xMidYMid meet" style="display:block">
            <path :d="item.thumbnail_svg_path" />
          </svg>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- Funnel — viewBox 48×48 at 44px wide → 0.92× scale; stroke-width 2 → ~1.8px -->
      <div v-if="activeTab === 'funnel'" class="part-grid">
        <div
          v-for="item in funnels"
          :key="item.id"
          class="part-cell"
          :class="{ selected: state.visual.funnel_id === item.id }"
          :title="item.description"
          @click="dispatch('SET_FUNNEL', item.id)"
        >
          <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" preserveAspectRatio="xMidYMid meet" style="display:block">
            <path :d="item.thumbnail_svg_path" />
          </svg>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- Cargo — viewBox 96×48 at 88px wide → 0.92× scale; stroke-width 2 → ~1.8px -->
      <div v-if="activeTab === 'cargo'" class="part-grid-2col">
        <div
          v-for="item in cargos"
          :key="item.id"
          class="part-cell"
          :class="{ selected: state.visual.cargo_layout_id === item.id }"
          :title="item.description"
          @click="dispatch('SET_CARGO', item.id)"
        >
          <svg viewBox="0 0 96 48" width="88" height="44" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" preserveAspectRatio="xMidYMid meet" style="display:block">
            <path :d="item.thumbnail_svg_path" />
          </svg>
          <span>{{ item.label }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { state, dispatch } from '@/store/vesselStore.js'

const activeTab = ref('hull')

const tabs = [
  { key: 'hull',   label: 'Hull' },
  { key: 'ss',     label: 'Superstr.' },
  { key: 'funnel', label: 'Funnel' },
  { key: 'cargo',  label: 'Cargo' }
]

const hulls          = computed(() => state.manifest?.hulls          ?? [])
const superstructures = computed(() => state.manifest?.superstructures ?? [])
const funnels        = computed(() => state.manifest?.funnels        ?? [])
const cargos         = computed(() => state.manifest?.cargos         ?? [])
</script>
