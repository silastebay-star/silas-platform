import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { GroupPage } from '@/components/groups/GroupPage'
import '@testing-library/jest-dom'
import { createBrowserClient } from '@supabase/ssr'

// Mock Supabase client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123', email: 'test@example.com' } }, error: null }))
    }
  }))
}))

const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>

describe('GroupPage', () => {
  const mockGroupId = 'group-abc-123'
  const mockUserId = 'user-123'

  // Helper to set up fetch mocks
  const setupFetchMocks = (memberStatus: 'member' | 'not-member' | 'error') => {
    global.fetch = jest.fn((url) => {
      if (url === `/api/groups/${mockGroupId}`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: mockGroupId, name: 'Test Group', description: 'A group for testing' }),
        }) as Promise<Response>
      } else if (url === `/api/groups/${mockGroupId}/members`) {
        if (memberStatus === 'member') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { role: 'admin', profiles: { display_name: 'Admin User' } },
              { role: 'member', profiles: { display_name: 'Test User' }, profile_id: mockUserId },
            ]),
          }) as Promise<Response>
        } else if (memberStatus === 'not-member') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { role: 'admin', profiles: { display_name: 'Admin User' } },
            ]),
          }) as Promise<Response>
        } else if (memberStatus === 'error') {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Failed to fetch members' }),
          }) as Promise<Response>
        }
      } else if (url === `/api/groups/${mockGroupId}/pins`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'pin-1', title: 'Test Pin 1' },
            { id: 'pin-2', title: 'Test Pin 2' },
          ]),
        }) as Promise<Response>
      } else if (url === `/api/groups/${mockGroupId}/projects`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'proj-1', name: 'Test Project 1' },
          ]),
        }) as Promise<Response>
      } else if (url === `/api/groups/${mockGroupId}/join`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Joined' }),
        }) as Promise<Response>
      } else if (url === `/api/groups/${mockGroupId}/leave`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Left' }),
        }) as Promise<Response>
      }
      // Default to a successful response for unhandled URLs to avoid Promise.reject
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }) as Promise<Response>
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    // Default setup: user is a member
    setupFetchMocks('member')

    // Default mock for getUser (user is logged in)
    mockCreateBrowserClient().auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId, email: 'test@example.com' } },
      error: null
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders loading state initially', () => {
    render(<GroupPage groupId={mockGroupId} />)
    jest.runAllTimers()
    expect(screen.getByText(/Loading group.../i)).toBeInTheDocument()
  })

  it('renders group details after data is fetched', async () => {
    render(<GroupPage groupId={mockGroupId} />)
    jest.runAllTimers()

    await waitFor(() => {
      expect(screen.getByText('Test Group')).toBeInTheDocument()
      expect(screen.getByText('A group for testing')).toBeInTheDocument()
      expect(screen.getByText('Admin User (admin)')).toBeInTheDocument()
      expect(screen.getByText('Test User (member)')).toBeInTheDocument()
      expect(screen.getByText('Test Pin 1')).toBeInTheDocument()
      expect(screen.getByText('Test Pin 2')).toBeInTheDocument()
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Leave Group/i })).toBeInTheDocument()
    })
  })

  it('allows a user to join a group', async () => {
    // Setup fetch mocks for a non-member scenario
    setupFetchMocks('not-member')

    render(<GroupPage groupId={mockGroupId} />)
    jest.runAllTimers()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Join Group/i })).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Join Group/i }))
    })
    jest.runAllTimers()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/groups/${mockGroupId}/join`,
        expect.objectContaining({ method: 'POST' })
      )
      // After joining, the button should change to 'Leave Group'
      expect(screen.getByRole('button', { name: /Leave Group/i })).toBeInTheDocument()
    })
  })

  it('allows a user to leave a group', async () => {
    // Default setupFetchMocks('member') already sets user as a member
    render(<GroupPage groupId={mockGroupId} />)
    jest.runAllTimers()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Leave Group/i })).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Leave Group/i }))
    })
    jest.runAllTimers()

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/groups/${mockGroupId}/leave`,
        expect.objectContaining({ method: 'POST' })
      )
      // After leaving, the button should change to 'Join Group'
      expect(screen.getByRole('button', { name: /Join Group/i })).toBeInTheDocument()
    })
  })

  it('handles fetch errors gracefully', async () => {
    // Setup fetch mocks for an error scenario
    setupFetchMocks('error')

    render(<GroupPage groupId={mockGroupId} />)
    jest.runAllTimers()

    await waitFor(() => {
      // After an error, the loading state should disappear
      expect(screen.queryByText(/Loading group.../i)).not.toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
