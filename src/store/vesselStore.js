import { reactive, readonly } from 'vue'

const _state = reactive({
  vessel: {
    imo: '',
    name: '',
    operator: '',
    loa: 333.0,
    beam: 60.0,
    moulded_depth: 29.0
  },
  visual: {
    hull_id:               'hull_full_bulbous',
    superstructure_id:     'ss_aft_tiered',
    funnel_id:             'funnel_round_squat',
    bridge_position_ratio: 0.88,
    bridge_height_offset:  0.0,
    draft_offset:          21.0,
    cargo_layout_id:       'cargo_tank_crude',
    livery: {
      hull_primary:   '#8B0000',
      hull_secondary: '#CC0000',
      superstructure: '#F5F0E8',
      funnel:         '#CC0000'
    }
  },
  ui: {
    loading:         false,
    loadingProgress: 0,
    baking:          false,
    showBoundingBox: true,
    showWireframe:   false,
    errorMessage:    null
  },
  manifest:      null,
  archetypes:    null,
  lastBakedFile: null,
  version:       '1.1'
})

export const state = readonly(_state)

export function dispatch(action, payload) {
  switch (action) {
    case 'SET_VESSEL_META':
      Object.assign(_state.vessel, payload)
      break
    case 'SET_DIMENSIONS':
      if (payload.loa           !== undefined) _state.vessel.loa           = Number(payload.loa)
      if (payload.beam          !== undefined) _state.vessel.beam          = Number(payload.beam)
      if (payload.moulded_depth !== undefined) _state.vessel.moulded_depth = Number(payload.moulded_depth)
      break
    case 'SET_HULL':
      _state.visual.hull_id = payload
      break
    case 'SET_SUPERSTRUCTURE':
      _state.visual.superstructure_id = payload
      break
    case 'SET_FUNNEL':
      _state.visual.funnel_id = payload
      break
    case 'SET_CARGO':
      _state.visual.cargo_layout_id = payload
      break
    case 'SET_BRIDGE_POSITION':
      _state.visual.bridge_position_ratio = payload
      break
    case 'SET_BRIDGE_HEIGHT':
      _state.visual.bridge_height_offset = payload
      break
    case 'SET_DRAFT_OFFSET':
      _state.visual.draft_offset = payload
      break
    case 'SET_LIVERY_COLOR':
      _state.visual.livery[payload.slot] = payload.color
      break
    case 'SET_ARCHETYPE': {
      const a = payload
      _state.vessel.imo           = a.imo   ?? ''
      _state.vessel.name          = a.name  ?? ''
      _state.vessel.operator      = ''
      _state.vessel.loa           = a.loa
      _state.vessel.beam          = a.beam
      _state.vessel.moulded_depth = a.moulded_depth
      const vc = a.visual_config
      _state.visual.hull_id               = vc.hull_id
      _state.visual.superstructure_id     = vc.superstructure_id
      _state.visual.funnel_id             = vc.funnel_id
      _state.visual.cargo_layout_id       = vc.cargo_layout_id
      _state.visual.bridge_position_ratio = vc.bridge_position_ratio
      _state.visual.bridge_height_offset  = vc.bridge_height_offset
      _state.visual.draft_offset          = vc.draft_offset
      Object.assign(_state.visual.livery, vc.livery)
      break
    }
    case 'LOAD_VESSEL_DNA': {
      const dna = payload
      if (dna.vessel_metadata) {
        _state.vessel.imo      = dna.vessel_metadata.imo      ?? _state.vessel.imo
        _state.vessel.name     = dna.vessel_metadata.name     ?? _state.vessel.name
        _state.vessel.operator = dna.vessel_metadata.operator ?? _state.vessel.operator
        if (dna.vessel_metadata.base_dimensions) {
          const bd = dna.vessel_metadata.base_dimensions
          _state.vessel.loa           = bd.loa           ?? _state.vessel.loa
          _state.vessel.beam          = bd.beam          ?? _state.vessel.beam
          _state.vessel.moulded_depth = bd.moulded_depth ?? _state.vessel.moulded_depth
        }
      }
      if (dna.visual_config) {
        const vc = dna.visual_config
        _state.visual.hull_id               = vc.hull_id               ?? _state.visual.hull_id
        _state.visual.superstructure_id     = vc.superstructure_id     ?? _state.visual.superstructure_id
        _state.visual.funnel_id             = vc.funnel_id             ?? _state.visual.funnel_id
        _state.visual.bridge_position_ratio = vc.bridge_position_ratio ?? _state.visual.bridge_position_ratio
        _state.visual.bridge_height_offset  = vc.bridge_height_offset  ?? _state.visual.bridge_height_offset
        _state.visual.draft_offset          = vc.draft_offset          ?? _state.visual.draft_offset
        _state.visual.cargo_layout_id       = vc.cargo_layout_id       ?? _state.visual.cargo_layout_id
        if (vc.livery) Object.assign(_state.visual.livery, vc.livery)
      }
      break
    }
    case 'SET_MANIFEST':
      _state.manifest = payload
      break
    case 'SET_ARCHETYPES':
      _state.archetypes = payload
      break
    case 'SET_LOADING':
      _state.ui.loading         = payload.loading
      _state.ui.loadingProgress = payload.progress ?? 0
      break
    case 'SET_BAKING':
      _state.ui.baking = payload
      break
    case 'TOGGLE_BOUNDING_BOX':
      _state.ui.showBoundingBox = !_state.ui.showBoundingBox
      break
    case 'TOGGLE_WIREFRAME':
      _state.ui.showWireframe = !_state.ui.showWireframe
      break
    case 'SET_ERROR':
      _state.ui.errorMessage = payload
      break
    case 'SET_LAST_BAKED_FILE':
      _state.lastBakedFile = payload
      break
    default:
      console.warn(`[vesselStore] Unknown action: ${action}`)
  }
}

export function exportDNA() {
  return {
    vessel_metadata: {
      imo:      _state.vessel.imo,
      name:     _state.vessel.name,
      operator: _state.vessel.operator,
      base_dimensions: {
        loa:           _state.vessel.loa,
        beam:          _state.vessel.beam,
        moulded_depth: _state.vessel.moulded_depth
      }
    },
    visual_config: {
      hull_id:               _state.visual.hull_id,
      superstructure_id:     _state.visual.superstructure_id,
      funnel_id:             _state.visual.funnel_id,
      bridge_position_ratio: _state.visual.bridge_position_ratio,
      bridge_height_offset:  _state.visual.bridge_height_offset,
      draft_offset:          _state.visual.draft_offset,
      cargo_layout_id:       _state.visual.cargo_layout_id,
      livery: { ..._state.visual.livery }
    },
    version:       _state.version,
    last_modified: new Date().toISOString()
  }
}

export function importDNA(json) {
  dispatch('LOAD_VESSEL_DNA', json)
}
