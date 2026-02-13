/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateGroupForm } from '@/components/groups/CreateGroupForm'
import '@testing-library/jest-dom'

// Mock next/navigation useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('CreateGroupForm', () => {
  beforeEach(() => {
    // Mock the fetch API before each test
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '123', name: 'Test Group' }),
      }) as Promise<Response>
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the form correctly', () => {
    render(<CreateGroupForm />)
    expect(screen.getByLabelText(/Group Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Group/i })).toBeInTheDocument()
  })

  it('updates input fields on change', () => {
    render(<CreateGroupForm />)
    const nameInput = screen.getByLabelText(/Group Name/i) as HTMLInputElement
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement

    fireEvent.change(nameInput, { target: { value: 'New Group Name' } })
    fireEvent.change(descriptionInput, { target: { value: 'New Group Description' } })

    expect(nameInput.value).toBe('New Group Name')
    expect(descriptionInput.value).toBe('New Group Description')
  })

  it('submits the form and creates a group successfully', async () => {
    render(<CreateGroupForm />)
    const nameInput = screen.getByLabelText(/Group Name/i)
    const descriptionInput = screen.getByLabelText(/Description/i)
    const submitButton = screen.getByRole('button', { name: /Create Group/i })

    fireEvent.change(nameInput, { target: { value: 'Successful Group' } })
    fireEvent.change(descriptionInput, { target: { value: 'This is a successful group.' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/groups',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Successful Group', description: 'This is a successful group.' }),
        })
      )
      expect(submitButton).not.toBeDisabled()
      expect(nameInput).toHaveValue('') // Form should clear
      expect(descriptionInput).toHaveValue('') // Form should clear
    })
  })

  it('shows loading state during submission', async () => {
    // Make fetch return a pending promise to simulate loading
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock

    render(<CreateGroupForm />)
    const nameInput = screen.getByLabelText(/Group Name/i)
    const submitButton = screen.getByRole('button', { name: /Create Group/i })

    fireEvent.change(nameInput, { target: { value: 'Loading Group' } })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/Creating group.../i)).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Failed to create group' }),
      }) as Promise<Response>
    )

    // Mock console.error to prevent it from polluting test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<CreateGroupForm />)
    const nameInput = screen.getByLabelText(/Group Name/i)
    const submitButton = screen.getByRole('button', { name: /Create Group/i })

    fireEvent.change(nameInput, { target: { value: 'Error Group' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error))
      expect(submitButton).not.toBeDisabled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('does not submit if name is empty', async () => {
    render(<CreateGroupForm />)
    const submitButton = screen.getByRole('button', { name: /Create Group/i })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
      expect(submitButton).not.toBeDisabled()
    })
  })
})
