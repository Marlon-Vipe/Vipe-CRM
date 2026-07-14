import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'

import { useAuthContext } from '@/context/AuthContext'
import { translateAuthError } from '@/utils/authErrors'

export const useAuth = () => {
  const navigate = useNavigate()
  const auth = useAuthContext()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      setError(null)
      const { error: signInError } = await auth.signIn(email, password)
      setLoading(false)

      if (signInError) {
        setError(translateAuthError(signInError.message))
        return
      }
      navigate('/', { replace: true })
    },
    [auth, navigate]
  )

  const logout = useCallback(async () => {
    await auth.signOut()
    navigate('/auth/sign-in', { replace: true })
  }, [auth, navigate])

  return {
    login,
    logout,
    isAuthenticated: !!auth.session,
    loading: loading || auth.loading,
    error,
    session: auth.session,
    user: auth.user,
    tenantId: auth.tenantId,
    role: auth.role,
    tenant: auth.tenant,
    membershipError: auth.membershipError,
    signUp: auth.signUp,
    refreshMembership: auth.refreshMembership,
  }
}
