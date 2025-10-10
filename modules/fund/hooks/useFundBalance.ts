/**
 * Hook for managing community fund balance
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import { useFeedback } from '@/lib/user-feedback'
import type { FundBalance, FundMetrics } from '../types'

export function useFundBalance() {
  const [balance, setBalance] = useState<FundBalance | null>(null)
  const [metrics, setMetrics] = useState<FundMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const feedback = useFeedback()

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('fund_balance')
        .select('*')
        .single()

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError
      }

      // If no balance record exists, create one
      if (!balanceData) {
        const { data: newBalance, error: createError } = await supabase
          .from('fund_balance')
          .insert([{
            total_balance: 0,
            available_balance: 0,
            committed_balance: 0,
            monthly_contributions: 0
          }])
          .select()
          .single()

        if (createError) throw createError
        setBalance(newBalance)
      } else {
        // Calculate computed fields
        const enhancedBalance: FundBalance = {
          ...balanceData,
          growth_rate: calculateGrowthRate(balanceData),
          projected_balance: calculateProjectedBalance(balanceData),
          funding_capacity: balanceData.available_balance * 0.8 // Conservative estimate
        }
        setBalance(enhancedBalance)
      }

      // Fetch fund metrics
      await fetchMetrics()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fund balance'
      setError(errorMessage)
      handleError(err as Error, 'useFundBalance.fetchBalance')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMetrics = useCallback(async () => {
    try {
      // Get proposal statistics
      const { data: proposalStats, error: statsError } = await supabase
        .rpc('get_fund_metrics')

      if (statsError) {
        console.warn('Failed to fetch fund metrics:', statsError)
        return
      }

      setMetrics(proposalStats)
    } catch (err) {
      console.warn('Error fetching fund metrics:', err)
    }
  }, [])

  const updateBalance = useCallback(async (updates: Partial<FundBalance>) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('fund_balance')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('id', balance?.id)
        .select()
        .single()

      if (error) throw error

      setBalance(data)
      feedback.success('Fund balance updated successfully')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update fund balance'
      setError(errorMessage)
      handleError(err as Error, 'useFundBalance.updateBalance')
      feedback.error('Failed to update fund balance')
    } finally {
      setLoading(false)
    }
  }, [balance?.id, feedback])

  useEffect(() => {
    fetchBalance()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('fund_balance_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fund_balance' },
        () => {
          fetchBalance()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fund_proposals' },
        () => {
          // Refresh metrics when proposals change
          fetchMetrics()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchBalance, fetchMetrics])

  return {
    balance,
    metrics,
    loading,
    error,
    updateBalance,
    refetch: fetchBalance
  }
}

// Helper functions
function calculateGrowthRate(balance: FundBalance): number {
  // Simple growth rate calculation - in production, this would use historical data
  return balance.monthly_contributions > 0 ?
    (balance.monthly_contributions / balance.total_balance) * 100 : 0
}

function calculateProjectedBalance(balance: FundBalance): number {
  // Project balance 6 months out based on current contributions
  return balance.total_balance + (balance.monthly_contributions * 6)
}
