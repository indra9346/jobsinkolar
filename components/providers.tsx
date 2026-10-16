'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase/client'
import { ToastProvider } from '@/components/ui/toast'
import { LangProvider } from '@/lib/i18n'
import type { Profile } from '@/lib/types'

type AuthState = {
  user: User | null
  profile: Profile | null
  ready: boolean
  refreshProfile: () => Promise<void>
}

const AuthCtx = createContext<AuthState>({ user: null, profile: null, ready: false, refreshProfile: async () => {} })

function AuthProvider({ children, initialProfile }: { children: React.ReactNode; initialProfile?: Profile | null }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null)
  const [ready, setReady] = useState(Boolean(initialProfile))

  const load = async (u: User | null) => {
    setUser(u)
    if (!u) {
      setProfile(null)
      setReady(true)
      return
    }
    const { data } = await getSupabase().from('profiles').select('*').eq('id', u.id).maybeSingle()
    setProfile(data as Profile | null)
    setReady(true)
  }

  useEffect(() => {
    const sb = getSupabase()
    let current: string | undefined
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      if (event === 'TOKEN_REFRESHED' && u?.id === current) return
      current = u?.id
      void load(u)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthCtx.Provider value={{ user, profile, ready, refreshProfile: () => load(user) }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, gcTime: 10 * 60_000, refetchOnWindowFocus: true, retry: 1 },
        },
      }),
  )
  return (
    <QueryClientProvider client={qc}>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </LangProvider>
    </QueryClientProvider>
  )
}
