
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'
import { handleError } from '@/lib/error-handling'

interface Group {
  id: string
  name: string
  description: string
}

interface Member {
  role: string
  profiles: {
    display_name: string
  }
}

interface Pin {
  id: string
  title: string
}

interface Project {
  id: string
  name: string
}

interface GroupPageProps {
  groupId: string
}

export function GroupPage({ groupId }: GroupPageProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [pins, setPins] = useState<Pin[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [isMember, setIsMember] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchGroupData = async () => {
      setIsLoading(true)
      try {
        const [groupRes, membersRes, pinsRes, projectsRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/members`),
          fetch(`/api/groups/${groupId}/pins`),
          fetch(`/api/groups/${groupId}/projects`),
        ])

        if (!groupRes.ok) {
          const errorData = await groupRes.json()
          throw new Error(errorData.error || 'Failed to fetch group details')
        }
        if (!membersRes.ok) {
          const errorData = await membersRes.json()
          throw new Error(errorData.error || 'Failed to fetch group members')
        }
        if (!pinsRes.ok) {
          const errorData = await pinsRes.json()
          throw new Error(errorData.error || 'Failed to fetch group pins')
        }
        if (!projectsRes.ok) {
          const errorData = await projectsRes.json()
          throw new Error(errorData.error || 'Failed to fetch group projects')
        }

        const groupData = await groupRes.json()
        const membersData = await membersRes.json()
        const pinsData = await pinsRes.json()
        const projectsData = await projectsRes.json()

        setGroup(groupData)
        setMembers(membersData)
        setPins(pinsData)
        setProjects(projectsData)

        // Check if the current user is a member
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsMember(membersData.some((member: any) => member.profile_id === user.id))
        }
      } catch (error: any) {
        handleError(error, 'GroupPage - fetchGroupData', true)
      } finally {
        setIsLoading(false)
      }
    }

    if (groupId) {
      fetchGroupData()
    }
  }, [groupId])

  const handleJoin = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join group')
      }
      setIsMember(true)
    } catch (error: any) {
      handleError(error, 'GroupPage - handleJoin', true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLeave = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, { method: 'POST' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to leave group')
      }
      setIsMember(false)
    } catch (error: any) {
      handleError(error, 'GroupPage - handleLeave', true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !group) {
    return <div>Loading group...</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-gray-600">{group.description}</p>
        </div>
        {isMember ? (
          <Button onClick={handleLeave} disabled={isSubmitting}>Leave Group</Button>
        ) : (
          <Button onClick={handleJoin} disabled={isSubmitting}>Join Group</Button>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Members</h2>
        <ul className="list-disc list-inside">
          {members.map((member) => (
            <li key={member.profiles.display_name}>
              {member.profiles.display_name} ({member.role})
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Pins</h2>
        <ul className="list-disc list-inside">
          {pins.map((pin) => (
            <li key={pin.id}>{pin.title}</li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Projects</h2>
        <ul className="list-disc list-inside">
          {projects.map((project) => (
            <li key={project.id}>{project.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
