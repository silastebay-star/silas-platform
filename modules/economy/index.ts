/**
 * Local Economy Module
 * 
 * Handles local business directory, marketplace, and economic tracking
 */

export { default as BusinessDirectory } from './components/BusinessDirectory'
export { default as BusinessCard } from './components/BusinessCard'
export { default as LocalMarketplace } from './components/LocalMarketplace'
export { default as EconomicDashboard } from './components/EconomicDashboard'

export { useBusinesses } from './hooks/useBusinesses'
export { useMarketplace } from './hooks/useMarketplace'
export { useLocalEconomy } from './hooks/useLocalEconomy'

export type {
  LocalBusiness,
  CreateBusinessData,
  UpdateBusinessData,
  BusinessCategory,
  BusinessReview,
  MarketplaceItem,
  CreateMarketplaceItemData,
  UpdateMarketplaceItemData,
  EconomicMetric,
  EconomicIndicators,
  BusinessFilters,
  MarketplaceFilters,
  EconomyMetrics
} from './types'
