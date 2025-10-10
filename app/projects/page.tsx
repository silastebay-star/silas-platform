/**
 * Projects & Initiatives Page
 */

'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { Hammer, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Project } from '@/types/silas' // Assuming Project type is defined here or in types/silas.ts
import { handleError } from '@/lib/error-handling'

const UnifiedFloatingNav = dynamic(() => import('@/components/navigation/UnifiedFloatingNav'), { ssr: false })
const LaunchProjectForm = dynamic(() => import('@/components/projects/LaunchProjectForm'), { ssr: false })

export default function ProjectsPage() {
  const [showLaunchProjectModal, setShowLaunchProjectModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setErrorProjects(null);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data);
    } catch (e: any) {
      handleError(e, 'ProjectsPage - fetchProjects', true)
      setErrorProjects(e instanceof Error ? e.message : 'Failed to fetch projects');
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLaunchProject = async (projectData: any) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setShowLaunchProjectModal(false);
      toast.success('Project launched successfully!');
      fetchProjects(); // Re-fetch projects to update the list
    } catch (error: any) {
      handleError(error, 'ProjectsPage - handleLaunchProject', true)
      toast.error('Failed to launch project.');
    }
  };

  const projectFeatures = [
    "Project Pins (linked areas, progress tracker)",
    "Funding applications & Doer profiles",
    "Progress dashboards (community impact)",
    "Volunteer management tools",
    "AI Task Planner (auto-generate project milestones)"
  ]

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'green': return 'from-green-50 to-emerald-50 border-green-200 text-green-700'
      case 'blue': return 'from-blue-50 to-sky-50 border-blue-200 text-blue-700'
      case 'yellow': return 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700'
      default: return 'from-gray-50 to-gray-100 border-gray-200 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedFloatingNav showSearch={false} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Empty State */}
          <SilasCard className="lg:col-span-3">
            <SilasEmptyState
              icon={Hammer}
              title="Projects & Initiatives Module Coming Soon"
              description="This module will empower groups to launch, manage, and track community projects. It will feature project pins, funding applications, and progress dashboards to drive collective action."
            />
          </SilasCard>
          
          {/* Project Metrics */}
          <div className="lg:col-span-2">
            <SilasCard title="Project Dashboard" description="Overview of active and completed community projects">
              {isLoadingProjects && <p className="text-center py-4">Loading projects...</p>}
              {errorProjects && <p className="text-center py-4 text-red-500">Error: {errorProjects}</p>}
              {!isLoadingProjects && !errorProjects && projects.length === 0 && (
                <p className="text-center py-4 text-gray-500">No projects found.</p>
              )}
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{project.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${project.status === 'planning' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{project.description}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Group: {project.group_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SilasCard>
          </div>

          {/* Active Projects */}
          <div className="lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
              <div className="flex gap-2">
                <Button onClick={() => {
                  window.location.href = '/api/export/pins'
                }} size="sm" variant="outline">
                  Export Pins
                </Button>
                <Button onClick={() => setShowLaunchProjectModal(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Launch Project
                </Button>
              </div>
            </div>
            <SilasCard description="Current community initiatives">
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{project.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${project.status === 'planning' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{project.description}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Group: {project.group_id}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    🚀 Turn ideas into action. Launch your project today!
                  </p>
                </div>
              </div>
            </SilasCard>
          </div>

          {/* Launch Project Modal */}
          {showLaunchProjectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <LaunchProjectForm
                  onClose={() => setShowLaunchProjectModal(false)}
                  onSubmit={handleLaunchProject}
                />
              </div>
            </div>
          )}

          {/* Feature List */}
          <SilasCard title="Planned Features" description="Project management tools in development" className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </SilasCard>
        </div>
      </main>
    </div>
  )
}
