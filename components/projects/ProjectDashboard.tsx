'use client'

import { useState, useEffect } from 'react'
import { handleError } from '@/lib/error-handling'

interface Project {
  id: string
  name: string
  description: string
}

interface Milestone {
  id: string
  description: string
  status: string
}

interface Funding {
  id: string
  source: string
  amount: number
  status: string
}

interface Pin {
  id: string
  lat: number
  lng: number
}

interface ProjectDashboardProps {
  projectId: string
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [funding, setFunding] = useState<Funding[]>([])
  const [pins, setPins] = useState<Pin[]>([])
  const [censusData, setCensusData] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true)
      try {
        const [projectRes, milestonesRes, fundingRes, pinsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/milestones`),
          fetch(`/api/projects/${projectId}/funding`),
          fetch(`/api/projects/${projectId}/pins`),
        ])

        if (!projectRes.ok) {
          const errorData = await projectRes.json()
          throw new Error(errorData.error || 'Failed to fetch project details')
        }
        if (!milestonesRes.ok) {
          const errorData = await milestonesRes.json()
          throw new Error(errorData.error || 'Failed to fetch project milestones')
        }
        if (!fundingRes.ok) {
          const errorData = await fundingRes.json()
          throw new Error(errorData.error || 'Failed to fetch project funding')
        }
        if (!pinsRes.ok) {
          const errorData = await pinsRes.json()
          throw new Error(errorData.error || 'Failed to fetch project pins')
        }

        const projectData = await projectRes.json()
        const milestonesData = await milestonesRes.json()
        const fundingData = await fundingRes.json()
        const pinsData = await pinsRes.json()

        setProject(projectData)
        setMilestones(milestonesData)
        setFunding(fundingData)
        setPins(pinsData)

        if (pinsData.length > 0) {
          const firstPin = pinsData[0]
          const censusResponse = await fetch(`/api/census-data?lat=${firstPin.lat}&lng=${firstPin.lng}`)
          if (!censusResponse.ok) {
            const errorData = await censusResponse.json()
            throw new Error(errorData.error || 'Failed to fetch census data')
          }
          const census = await censusResponse.json()
          setCensusData(census[0])
        }
      } catch (error: any) {
        handleError(error, 'ProjectDashboard - fetchProjectData', true)
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  if (isLoading || !project) {
    return <div>Loading project...</div>
  }

  const completedMilestones = milestones.filter(m => m.status === 'completed').length
  const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0

  const totalFunding = funding.reduce((acc, f) => acc + f.amount, 0)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="text-gray-600">{project.description}</p>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-silas-green h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Milestones</h2>
        <ul className="list-disc list-inside">
          {milestones.map((milestone) => (
            <li key={milestone.id}>
              {milestone.description} ({milestone.status})
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Funding</h2>
        <p>Total funding: £{totalFunding}</p>
        <ul className="list-disc list-inside">
          {funding.map((fund) => (
            <li key={fund.id}>
              {fund.source}: £{fund.amount} ({fund.status})
            </li>
          ))}
        </ul>
      </div>

      {censusData && (
        <div className="mt-8">
          <h2 className="text-xl font-bold">Census Data</h2>
          <p className="text-sm text-gray-700">LSOA Code: {censusData.lsoa_code}</p>
          <p className="text-sm text-gray-700">Population: {censusData.population}</p>
          <p className="text-sm text-gray-700">Deprivation Index: {censusData.deprivation_index?.toFixed(2)}</p>
        </div>
      )}
    </div>
  )
}