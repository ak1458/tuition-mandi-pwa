/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { hasSupabaseConfig, isLocalMode } from '@/lib/env'
import { supabase } from '@/lib/supabase-client'
import type { PlanState, PlanType } from '@/types/plan'

type BillingCycle = 'monthly' | 'yearly'

interface PlanContextValue {
  plan: PlanType
  isPro: boolean
  isFree: boolean
  planExpiresAt: string | null
  isLoading: boolean
  refreshPlan: () => Promise<void>
  upgradeToPro: (cycle: BillingCycle, paymentId?: string) => Promise<void>
}

const DEFAULT_PLAN_STATE: PlanState = {
  plan: 'free',
  plan_expires_at: null,
}

const LOCAL_PLAN_PREFIX = 'takhti_local_plan_v1'
const PlanContext = createContext<PlanContextValue | undefined>(undefined)

function localPlanKey(userId: string) {
  return `${LOCAL_PLAN_PREFIX}:${userId}`
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

function normalizePlan(rawPlan: string | null | undefined, rawExpiry: string | null | undefined): PlanState {
  const candidate: PlanType = rawPlan === 'pro' ? 'pro' : 'free'
  const expiry = rawExpiry ?? null

  if (candidate === 'pro' && isExpired(expiry)) {
    return {
      plan: 'free',
      plan_expires_at: null,
    }
  }

  return {
    plan: candidate,
    plan_expires_at: expiry,
  }
}

function readLocalPlan(userId: string): PlanState {
  const raw = localStorage.getItem(localPlanKey(userId))
  if (!raw) return DEFAULT_PLAN_STATE

  try {
    const parsed = JSON.parse(raw) as PlanState
    return normalizePlan(parsed.plan, parsed.plan_expires_at)
  } catch {
    return DEFAULT_PLAN_STATE
  }
}

function writeLocalPlan(userId: string, planState: PlanState) {
  localStorage.setItem(localPlanKey(userId), JSON.stringify(planState))
}

function expiryForCycle(cycle: BillingCycle): string {
  const next = new Date()
  if (cycle === 'yearly') {
    next.setFullYear(next.getFullYear() + 1)
  } else {
    next.setMonth(next.getMonth() + 1)
  }
  return next.toISOString()
}

export function PlanProvider({ children }: PropsWithChildren) {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''

  const [planState, setPlanState] = useState<PlanState>(DEFAULT_PLAN_STATE)
  const [isLoading, setIsLoading] = useState(true)

  const refreshPlan = useCallback(async () => {
    if (!userId) {
      setPlanState(DEFAULT_PLAN_STATE)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    if (isLocalMode || !hasSupabaseConfig) {
      const localState = readLocalPlan(userId)
      writeLocalPlan(userId, localState)
      setPlanState(localState)
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      setPlanState(DEFAULT_PLAN_STATE)
      setIsLoading(false)
      return
    }

    const normalized = normalizePlan(data?.plan, data?.plan_expires_at)
    setPlanState(normalized)

    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshPlan().catch(() => {
        setPlanState(DEFAULT_PLAN_STATE)
        setIsLoading(false)
      })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refreshPlan])

  const upgradeToPro = useCallback(
    async (cycle: BillingCycle, paymentId?: string) => {
      if (!userId) {
        throw new Error('Session missing')
      }

      const expiresAt = expiryForCycle(cycle)
      const nextState: PlanState = {
        plan: 'pro',
        plan_expires_at: expiresAt,
      }

      if (isLocalMode || !hasSupabaseConfig) {
        writeLocalPlan(userId, nextState)
        setPlanState(nextState)
        return
      }

      if (!paymentId) {
        throw new Error('Payment verification is required to activate Pro.')
      }

      const { data, error } = await supabase.functions.invoke('upgrade-plan', {
        body: {
          cycle,
          payment_id: paymentId,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      const result = data as { status?: string; message?: string; plan_expires_at?: string | null }
      if (result?.status !== 'ok') {
        throw new Error(result?.message || 'Plan upgrade failed')
      }

      setPlanState({
        plan: 'pro',
        plan_expires_at: result.plan_expires_at ?? nextState.plan_expires_at,
      })
    },
    [userId],
  )

  const value = useMemo<PlanContextValue>(
    () => ({
      plan: planState.plan,
      isFree: planState.plan === 'free',
      isPro: planState.plan === 'pro',
      planExpiresAt: planState.plan_expires_at,
      isLoading,
      refreshPlan,
      upgradeToPro,
    }),
    [isLoading, planState.plan, planState.plan_expires_at, refreshPlan, upgradeToPro],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider')
  }
  return context
}
