/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react'
import PinLayer from '../PinLayer'
import { Pin, MapFilters } from '@/types/silas'

// Mock Mapbox GL Map
const mockMap = {
  isStyleLoaded: jest.fn(() => true),
  addSource: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn(),
  getLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  queryRenderedFeatures: jest.fn(() => []),
  setFeatureState: jest.fn(),
  removeFeatureState: jest.fn(),
  getCanvas: jest.fn(() => ({
    style: { cursor: '' }
  }))
} as any

// Mock monitoring
jest.mock('@/lib/monitoring', () => ({
  ErrorTracker: {
    logCustomError: jest.fn()
  }
}))

// Test data
const mockPins: Pin[] = [
  {
    id: 'pin-1',
    title: 'Community Center',
    description: 'Local community center',
    categories: ['community'],
    project_id: null,
    group_id: null,
    author_type: 'individual',
    geom: {
      type: 'Point',
      coordinates: [-2.4833, 53.5500]
    },
    status: 'published',
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'pin-2',
    title: 'Local Church',
    description: 'Historic church building',
    categories: ['faith'],
    project_id: null,
    group_id: null,
    author_type: 'individual',
    geom: {
      type: 'Point',
      coordinates: [-2.4834, 53.5501]
    },
    status: 'published',
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'pin-3',
    title: 'Draft Pin',
    description: 'A draft pin',
    categories: ['issues'],
    project_id: null,
    group_id: null,
    author_type: 'individual',
    geom: {
      type: 'Point',
      coordinates: [-2.4835, 53.5502]
    },
    status: 'draft',
    metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const defaultFilters: MapFilters = {
  categories: [],
  status: ['published'],
  author_type: []
}

describe('PinLayer Component', () => {
  const mockOnPinClick = jest.fn()
  const mockOnPinHover = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockMap.isStyleLoaded.mockReturnValue(true)
  })

  it('initializes layers when map style is loaded', () => {
    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    expect(mockMap.addSource).toHaveBeenCalledWith('pins-source', expect.objectContaining({
      type: 'geojson',
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    }))

    // Should add all required layers
    expect(mockMap.addLayer).toHaveBeenCalledTimes(5) // clusters, cluster-count, unclustered, selected, badges
  })

  it('waits for style to load before initializing', () => {
    mockMap.isStyleLoaded.mockReturnValue(false)

    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    expect(mockMap.addSource).not.toHaveBeenCalled()
    expect(mockMap.on).toHaveBeenCalledWith('styledata', expect.any(Function))
  })

  it('converts pins to GeoJSON format correctly', () => {
    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    const addSourceCall = mockMap.addSource.mock.calls[0]
    const sourceData = addSourceCall[1].data

    expect(sourceData.type).toBe('FeatureCollection')
    expect(sourceData.features).toHaveLength(3)
    expect(sourceData.features[0]).toMatchObject({
      type: 'Feature',
      id: 'pin-1',
      geometry: {
        type: 'Point',
        coordinates: [-2.4833, 53.5500]
      },
      properties: expect.objectContaining({
        id: 'pin-1',
        title: 'Community Center',
        categories: ['community'],
        cluster: false
      })
    })
  })

  it('disables clustering when showClustering is false', () => {
    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
        showClustering={false}
      />
    )

    const addSourceCall = mockMap.addSource.mock.calls[0]
    expect(addSourceCall[1].cluster).toBe(false)
  })

  it('uses custom cluster radius', () => {
    const customRadius = 100

    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
        clusterRadius={customRadius}
      />
    )

    const addSourceCall = mockMap.addSource.mock.calls[0]
    expect(addSourceCall[1].clusterRadius).toBe(customRadius)
  })

  it('updates source data when pins change', () => {
    const { rerender } = render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    const mockSource = {
      setData: jest.fn()
    }
    mockMap.getSource.mockReturnValue(mockSource)

    const newPins = [...mockPins, {
      id: 'pin-4',
      title: 'New Pin',
      description: 'A new pin',
      categories: ['economy'],
      project_id: null,
      group_id: null,
      author_type: 'business',
      geom: {
        type: 'Point',
        coordinates: [-2.4836, 53.5503]
      },
      status: 'published',
      metadata: {},
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }]

    rerender(
      <PinLayer
        map={mockMap}
        pins={newPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    expect(mockSource.setData).toHaveBeenCalled()
  })

  it('updates feature states for selection and hover', () => {
    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        selectedPinId="pin-1"
        hoveredPinId="pin-2"
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    // Should clear all feature states first
    expect(mockMap.removeFeatureState).toHaveBeenCalledTimes(3)

    // Should set selected state
    expect(mockMap.setFeatureState).toHaveBeenCalledWith(
      { source: 'pins-source', id: 'pin-1' },
      { selected: true }
    )

    // Should set hovered state
    expect(mockMap.setFeatureState).toHaveBeenCalledWith(
      { source: 'pins-source', id: 'pin-2' },
      { hovered: true }
    )
  })

  it('sets up event handlers for click and hover', () => {
    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    expect(mockMap.on).toHaveBeenCalledWith('click', expect.any(Function))
    expect(mockMap.on).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(mockMap.on).toHaveBeenCalledWith('mouseleave', expect.any(Function))
  })

  it('handles cluster click by zooming in', () => {
    mockMap.queryRenderedFeatures.mockReturnValue([
      {
        properties: {
          cluster: true,
          cluster_id: 123
        },
        geometry: {
          coordinates: [-2.4833, 53.5500]
        }
      }
    ])

    const mockSource = {
      getClusterExpansionZoom: jest.fn((clusterId, callback) => {
        callback(null, 16)
      })
    }
    mockMap.getSource.mockReturnValue(mockSource)
    mockMap.easeTo = jest.fn()

    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    // Simulate click event
    const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')[1]
    clickHandler({
      point: { x: 100, y: 100 }
    })

    expect(mockMap.easeTo).toHaveBeenCalledWith({
      center: [-2.4833, 53.5500],
      zoom: 16
    })
  })

  it('handles pin click by calling onPinClick', () => {
    mockMap.queryRenderedFeatures.mockReturnValue([
      {
        id: 'pin-1',
        properties: {
          cluster: false
        }
      }
    ])

    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    // Simulate click event
    const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')[1]
    clickHandler({
      point: { x: 100, y: 100 }
    })

    expect(mockOnPinClick).toHaveBeenCalledWith(mockPins[0])
  })

  it('handles mouse hover by calling onPinHover', () => {
    mockMap.queryRenderedFeatures.mockReturnValue([
      {
        id: 'pin-1',
        properties: {}
      }
    ])

    render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    // Simulate mousemove event
    const mouseMoveHandler = mockMap.on.mock.calls.find(call => call[0] === 'mousemove')[1]
    mouseMoveHandler({
      point: { x: 100, y: 100 },
      originalEvent: new MouseEvent('mousemove')
    })

    expect(mockOnPinHover).toHaveBeenCalledWith(mockPins[0], expect.any(MouseEvent))
    expect(mockMap.getCanvas().style.cursor).toBe('pointer')
  })

  it('cleans up layers and source on unmount', () => {
    const { unmount } = render(
      <PinLayer
        map={mockMap}
        pins={mockPins}
        filters={defaultFilters}
        onPinClick={mockOnPinClick}
        onPinHover={mockOnPinHover}
      />
    )

    mockMap.getLayer.mockReturnValue(true)
    mockMap.getSource.mockReturnValue(true)

    unmount()

    expect(mockMap.removeLayer).toHaveBeenCalledTimes(4)
    expect(mockMap.removeSource).toHaveBeenCalledWith('pins-source')
  })
})
