'use client'

import { GroupPage } from '@/components/groups/GroupPage'

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="container mx-auto py-8">
      <GroupPage groupId={id} />
    </div>
  )
}