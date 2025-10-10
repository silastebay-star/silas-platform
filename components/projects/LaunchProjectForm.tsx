import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePinsStore, Pin } from '@/store/pins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Group } from '@/types/silas'
import { handleError } from '@/lib/error-handling'

interface LaunchProjectFormProps {
  onClose: () => void
  onSubmit: (projectData: { name: string; description: string; group_id?: string; pin_ids: string[] }) => Promise<void>
}

export default function LaunchProjectForm({ onClose, onSubmit }: LaunchProjectFormProps) {
  const { user } = useAuth()
  const { pins } = usePinsStore()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_id: '',
    pin_ids: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch('/api/groups')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch groups')
        }
        const data: Group[] = await response.json()
        setGroups(data)
      } catch (error: any) {
        handleError(error, 'LaunchProjectForm - fetchGroups', true)
      } finally {
        setIsLoadingGroups(false)
      }
    }
    fetchGroups()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      handleError('You must be logged in to launch a project.', 'LaunchProjectForm', true)
      return
    }
    if (!formData.name.trim()) {
      handleError('Please enter a name for the project.', 'LaunchProjectForm', true)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        group_id: formData.group_id || null,
        pin_ids: formData.pin_ids,
      })
      setFormData({
        name: '',
        description: '',
        group_id: '',
        pin_ids: []
      })
      onClose()
    } catch (error: any) {
      handleError(error, 'LaunchProjectForm - handleSubmit', true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePinSelection = (pinId: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      pin_ids: isChecked
        ? [...prev.pin_ids, pinId]
        : prev.pin_ids.filter(id => id !== pinId)
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Launch New Project</h3>

      {/* Name */}
      <div>
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., River Cleanup Initiative"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the goals and scope of your project..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* Associated Group (Optional) */}
      <div>
        <Label htmlFor="group_id">Associate with Group (Optional)</Label>
        <Select
          value={formData.group_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}
          disabled={isSubmitting || isLoadingGroups}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an existing group" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingGroups ? (
              <SelectItem value="" disabled>Loading groups...</SelectItem>
            ) : (
              <>
                <SelectItem value="">No Group</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Link Pins (Optional) */}
      <div>
        <Label>Link Existing Pins (Optional)</Label>
        <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border p-2 rounded-md">
          {pins.length === 0 ? (
            <p className="text-sm text-gray-500">No pins available to link.</p>
          ) : (
            pins.map(pin => (
              <div key={pin.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`pin-${pin.id}`}
                  checked={formData.pin_ids.includes(pin.id)}
                  onCheckedChange={(checked) => handlePinSelection(pin.id, checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label htmlFor={`pin-${pin.id}`} className="text-sm font-normal">
                  {pin.title} ({pin.lat?.toFixed(4)}, {pin.lng?.toFixed(4)})
                </Label>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Launching...' : 'Launch Project'}
        </Button>
      </div>
    </form>
  )
}
