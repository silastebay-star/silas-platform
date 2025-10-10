'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Group } from '@/types/silas'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch('/api/groups')
        if (!response.ok) {
          throw new Error('Failed to fetch groups')
        }
        const data: Group[] = await response.json()
        setGroups(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [])

  if (loading) {
    return <div className="container mx-auto py-8">Loading groups...</div>
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Groups</h1>
        <Link href="/groups/create">
          <Button>Create New Group</Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <p>No groups found. Be the first to create one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/groups/${group.id}`}>
                  <Button variant="outline">View Group</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
