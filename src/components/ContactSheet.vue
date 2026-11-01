<template>
  <div class="section" style="flex:1;display:flex;flex-direction:column;min-height:0;">
    <div class="section-header">Contact Sheet</div>
    <div class="contact-sheet" ref="containerEl"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import { state } from '@/store/vesselStore.js'

const containerEl = ref(null)
let svg = null
const W = 240
const H = 90
const PAD = 12

function draw() {
  if (!svg || !containerEl.value) return
  svg.selectAll('*').remove()

  const { loa, beam, moulded_depth, name, imo } = state.vessel

  // Scale to fit the SVG viewport
  const scaleX = d3.scaleLinear().domain([0, loa]).range([PAD, W - PAD])
  const scaleY = d3.scaleLinear().domain([0, moulded_depth]).range([H - PAD, PAD + 14])

  // Title
  svg.append('text')
    .attr('x', PAD)
    .attr('y', 10)
    .attr('fill', '#666')
    .attr('font-size', 9)
    .attr('font-family', 'monospace')
    .text(`${name || 'Unnamed'} · IMO ${imo || '—'}`)

  // Waterline
  const waterY = scaleY(state.visual.draft_offset)
  svg.append('line')
    .attr('x1', PAD).attr('x2', W - PAD)
    .attr('y1', waterY).attr('y2', waterY)
    .attr('stroke', '#1a4a6a')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')

  // Hull silhouette — simplified side profile
  const hullPath = d3.path()
  hullPath.moveTo(scaleX(0), scaleY(0))
  hullPath.lineTo(scaleX(0), scaleY(moulded_depth))
  hullPath.quadraticCurveTo(scaleX(loa * 0.08), scaleY(moulded_depth * 0.85), scaleX(loa * 0.15), scaleY(moulded_depth * 1.05))
  hullPath.lineTo(scaleX(loa * 0.85), scaleY(moulded_depth * 1.05))
  hullPath.quadraticCurveTo(scaleX(loa * 0.95), scaleY(moulded_depth * 0.9), scaleX(loa), scaleY(moulded_depth * 0.6))
  hullPath.lineTo(scaleX(loa), scaleY(0))
  hullPath.closePath()

  svg.append('path')
    .attr('d', hullPath)
    .attr('fill', state.visual.livery.hull_primary)
    .attr('fill-opacity', 0.7)
    .attr('stroke', state.visual.livery.hull_primary)
    .attr('stroke-width', 1)

  // Bridge block
  const bRatio = state.visual.bridge_position_ratio
  const bZ = (1.0 - bRatio) * loa
  const bW = loa * 0.08
  const bH = moulded_depth * 0.45
  svg.append('rect')
    .attr('x', scaleX(bZ - bW / 2))
    .attr('y', scaleY(moulded_depth + bH))
    .attr('width', scaleX(bW) - scaleX(0))
    .attr('height', Math.abs(scaleY(moulded_depth + bH) - scaleY(moulded_depth)))
    .attr('fill', state.visual.livery.superstructure)
    .attr('fill-opacity', 0.9)

  // Dimension annotation
  svg.append('text')
    .attr('x', W / 2)
    .attr('y', H - 2)
    .attr('text-anchor', 'middle')
    .attr('fill', '#555')
    .attr('font-size', 8)
    .attr('font-family', 'monospace')
    .text(`LOA ${loa}m · Beam ${beam}m · Depth ${moulded_depth}m`)
}

onMounted(() => {
  svg = d3.select(containerEl.value)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', '100%')
    .style('display', 'block')

  draw()
})

onUnmounted(() => {
  if (containerEl.value) d3.select(containerEl.value).selectAll('*').remove()
})

watch(
  () => [
    state.vessel.loa,
    state.vessel.beam,
    state.vessel.moulded_depth,
    state.vessel.name,
    state.vessel.imo,
    state.visual.bridge_position_ratio,
    state.visual.draft_offset,
    state.visual.livery.hull_primary,
    state.visual.livery.superstructure
  ],
  draw
)
</script>
