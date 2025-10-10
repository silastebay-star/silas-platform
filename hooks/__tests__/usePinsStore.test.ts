
import { renderHook, act } from '@testing-library/react'
import { usePinsStore } from '@/store/pins'

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock

describe('usePinsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => usePinsStore.setState({ pins: [], selectedPin: null, isLoading: false, error: null }))
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePinsStore())
    expect(result.current.pins).toEqual([])
    expect(result.current.selectedPin).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch pins successfully', async () => {
    const mockPins = [
      {
        id: '1',
        title: 'Test Pin',
        description: 'Description',
        categories: ['culture'],
        geom: { type: 'Point', coordinates: [10, 20] },
        author_id: 'user1',
        status: 'published',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        lat: 20,
        lng: 10,
      },
    ]
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPins),
      })
    )

    const { result, waitForNextUpdate } = renderHook(() => usePinsStore())

    await act(async () => {
      result.current.fetchPins()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.pins).toEqual(mockPins)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch pins error', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch' }),
      })
    )

    const { result, waitForNextUpdate } = renderHook(() => usePinsStore())

    await act(async () => {
      result.current.fetchPins()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.pins).toEqual([])
    expect(result.current.error).toBe('Failed to fetch pins')
  })

  it('should add a pin successfully', async () => {
    const newPinData = {
      title: 'New Pin',
      description: 'New Description',
      categories: ['environment'],
      lat: 30,
      lng: 40,
      author_id: 'user1',
    }
    const mockNewPin = {
      id: '2',
      ...newPinData,
      geom: { type: 'Point', coordinates: [40, 30] },
      status: 'proposed',
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    }
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNewPin),
      })
    )

    const { result, waitForNextUpdate } = renderHook(() => usePinsStore())

    await act(async () => {
      await result.current.addPin(newPinData)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.pins).toEqual([mockNewPin])
    expect(result.current.error).toBeNull()
  })

  it('should handle add pin error', async () => {
    const newPinData = {
      title: 'New Pin',
      description: 'New Description',
      categories: ['environment'],
      lat: 30,
      lng: 40,
      author_id: 'user1',
    }
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to add' }),
      })
    )

    const { result, waitForNextUpdate } = renderHook(() => usePinsStore())

    await act(async () => {
      await result.current.addPin(newPinData)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.pins).toEqual([])
    expect(result.current.error).toBe('Failed to add')
  })

  it('should update a pin successfully', async () => {
    const existingPin = {
      id: '1',
      title: 'Old Title',
      description: 'Old Description',
      categories: ['culture'],
      geom: { type: 'Point', coordinates: [10, 20] },
      author_id: 'user1',
      status: 'published',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      lat: 20,
      lng: 10,
    }
    act(() => usePinsStore.setState({ pins: [existingPin] }))

    const updates = { title: 'Updated Title' }
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    )

    const { result, waitForNextUpdate } = renderHook(() => usePinsStore())

    await act(async () => {
      await result.current.updatePin(existingPin.id, updates)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.pins[0].title).toBe('Updated Title')
    expect(result.current.error).toBeNull()
  })

  it('should delete a pin successfully', async () => {
    const existingPin = {
      id: '1',
      title: 'Old Title',
      description: 'Old Description',
      categories: ['culture'],
      geom: { type: 'Point', coordinates: [10, 20] },
      author_id: 'user1',
      status: 'published',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      lat: 20,
      lng: 10,
    }
    act(() => usePinsStore.setState({ pins: [existingPin] }))

    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    )

    const { result, waitForNextUpdate } = renderHook(() => usePinsStore())

    await act(async () => {
      await result.current.deletePin(existingPin.id)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.pins).toEqual([])
    expect(result.current.selectedPin).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
