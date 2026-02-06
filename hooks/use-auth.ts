'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types'

interface AuthState {
  user: User | null
  staff: Staff | null
  isLoading: boolean
  error: Error | null
}

export function useAuth() {
  const supabase = createClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    staff: null,
    isLoading: true,
    error: null,
  })

  const fetchStaffData = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('auth_user_id', userId)
        .eq('is_active', true)
        .single()

      if (error) {
        throw error
      }

      return data as Staff
    } catch (err) {
      console.error('Error fetching staff data:', err)
      return null
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!mounted) return

        if (user) {
          const staff = await fetchStaffData(user.id)
          setState({
            user,
            staff,
            isLoading: false,
            error: null,
          })
        } else {
          setState({
            user: null,
            staff: null,
            isLoading: false,
            error: null,
          })
        }
      } catch (error) {
        if (!mounted) return
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }))
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          const staff = await fetchStaffData(session.user.id)
          setState({
            user: session.user,
            staff,
            isLoading: false,
            error: null,
          })
        } else {
          setState({
            user: null,
            staff: null,
            isLoading: false,
            error: null,
          })
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchStaffData])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState({
        user: null,
        staff: null,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
      }))
    }
  }, [supabase])

  const refreshStaff = useCallback(async () => {
    if (!state.user) return

    setState(prev => ({ ...prev, isLoading: true }))
    const staff = await fetchStaffData(state.user.id)
    setState(prev => ({
      ...prev,
      staff,
      isLoading: false,
    }))
  }, [state.user, fetchStaffData])

  return {
    ...state,
    signOut,
    refreshStaff,
    isAuthenticated: !!state.user,
  }
}

export type { AuthState }
