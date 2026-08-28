import { create } from 'zustand'

type FetchToken = () => Promise<string | null>

type AuthStore = {
  sessionToken: string | null
  tokenLoading: boolean
  tokenError: string | null
  tokenRequestInFlight: boolean

  setSessionToken: (token: string | null) => void
  clearSessionToken: () => void

  fetchSessionToken: (
    getToken: FetchToken
  ) => Promise<void>
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  sessionToken: null,
  tokenLoading: false,
  tokenError: null,
  tokenRequestInFlight: false,

  setSessionToken: (token) => {
    set({
      sessionToken: token,
      tokenError: null,
    })
  },

  clearSessionToken: () => {
    set({
      sessionToken: null,
      tokenLoading: false,
      tokenError: null,
      tokenRequestInFlight: false,
    })
  },

  fetchSessionToken: async (getToken) => {
    if (get().tokenRequestInFlight) {
      return
    }

    set({
      tokenLoading: true,
      tokenError: null,
      tokenRequestInFlight: true,
    })

    try {
      const token = await getToken()

      set({
        sessionToken: token,
        tokenLoading: false,
        tokenError: null,
        tokenRequestInFlight: false,
      })
    } catch (error) {
      console.error(
        'Failed to get Clerk session token:',
        error
      )

      set({
        sessionToken: null,
        tokenLoading: false,
        tokenRequestInFlight: false,
        tokenError:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve session token.',
      })
    }
  },
}))