'use client'

import { CreateGroupForm } from '@/components/groups/CreateGroupForm'

export default function CreateGroupPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Group</h1>
      <CreateGroupForm />
    </div>
  )
}
