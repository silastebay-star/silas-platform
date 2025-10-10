'use client'

import { ProjectDashboard } from '@/components/projects/ProjectDashboard'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="container mx-auto py-8">
      <ProjectDashboard projectId={id} />
    </div>
  )
}