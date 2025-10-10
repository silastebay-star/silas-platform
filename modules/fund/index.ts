/**
 * Community Fund Module
 * 
 * Handles democratic funding proposals, voting, and fund management
 */

export { default as FundDashboard } from './components/FundDashboard'
export { default as ProposalCard } from './components/ProposalCard'
export { default as CreateProposalModal } from './components/CreateProposalModal'
export { default as VotingInterface } from './components/VotingInterface'
export { default as FundMetricsChart } from './components/FundMetricsChart'

export { useFundBalance } from './hooks/useFundBalance'
export { useProposals } from './hooks/useProposals'
export { useVoting } from './hooks/useVoting'

export type { Proposal, Vote, FundTransaction } from './types'
