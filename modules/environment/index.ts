/**
 * Environment & Sustainability Module
 * 
 * Handles environmental tracking, sustainability initiatives, and green projects
 */

export { default as EnvironmentDashboard } from './components/EnvironmentDashboard'
export { default as SustainabilityTracker } from './components/SustainabilityTracker'
export { default as GreenProjects } from './components/GreenProjects'
export { default as EnvironmentalMetrics } from './components/EnvironmentalMetrics'

export { useEnvironmentalData } from './hooks/useEnvironmentalData'
export { useSustainabilityMetrics } from './hooks/useSustainabilityMetrics'

export type {
  EnvironmentalMetric,
  CreateEnvironmentalMetricData,
  UpdateEnvironmentalMetricData,
  EnvironmentalCategory,
  SustainabilityProject,
  CreateSustainabilityProjectData,
  UpdateSustainabilityProjectData,
  ProjectParticipant,
  GreenInitiative,
  CreateGreenInitiativeData,
  UpdateGreenInitiativeData,
  InitiativeVote,
  EnvironmentalAlert,
  EnvironmentalFilters,
  ProjectFilters,
  InitiativeFilters,
  EnvironmentMetrics
} from './types'
