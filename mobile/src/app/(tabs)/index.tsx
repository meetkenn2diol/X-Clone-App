import {
  useAuth,
  useUser,
  useClerk,
} from '@clerk/expo'

import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native'

import { Redirect } from 'expo-router'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-stores'


export default function TabsIndex() {
  const {
    isLoaded,
    isSignedIn,
    sessionId,
    getToken,
  } = useAuth()

  const { user } = useUser()
  const { signOut } = useClerk()

  /*
   * Zustand
   */
  const token = useAuthStore(
    (state) => state.sessionToken
  )

  const tokenLoading = useAuthStore(
    (state) => state.tokenLoading
  )

  const tokenError = useAuthStore(
    (state) => state.tokenError
  )

  const fetchSessionToken = useAuthStore(
    (state) => state.fetchSessionToken
  )

  const clearSessionToken = useAuthStore(
    (state) => state.clearSessionToken
  )

  /*
   * Store Clerk's latest getToken function here.
   *
   * IMPORTANT:
   * We do NOT modify the ref during render.
   */
  const getTokenRef = useRef(getToken)

  /*
   * Update the ref AFTER render.
   *
   * This satisfies React 19's ref rules.
   */
  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  /*
   * Fetch token when the actual Clerk session changes.
   *
   * getToken is intentionally NOT a dependency here.
   */
  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!isSignedIn || !sessionId) {
      clearSessionToken()
      return
    }

    void fetchSessionToken(() => {
      return getTokenRef.current()
    })
  }, [
    isLoaded,
    isSignedIn,
    sessionId,
    fetchSessionToken,
    clearSessionToken,
  ])

  /*
   * Clerk still loading.
   */
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator
          size="large"
          color="#000"
        />
      </View>
    )
  }

  /*
   * Not authenticated.
   */
  if (!isSignedIn) {
    return <Redirect href="/" />
  }

  const name =
    user?.fullName ||
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'N/A'

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    'N/A'

  const handleSignOut = async () => {
    try {
      clearSessionToken()
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleRefreshToken = () => {
    void fetchSessionToken(() => {
      return getTokenRef.current()
    })
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-6 pb-12"
    >
      <Text className="mb-6 text-2xl font-bold text-black">
        User Information
      </Text>

      <View className="mb-4 rounded-xl bg-gray-50 p-4">
        <Text className="text-xs uppercase tracking-wide text-gray-500">
          Name
        </Text>

        <Text className="mt-1 text-lg font-semibold text-black">
          {name}
        </Text>
      </View>

      <View className="mb-4 rounded-xl bg-gray-50 p-4">
        <Text className="text-xs uppercase tracking-wide text-gray-500">
          Email
        </Text>

        <Text className="mt-1 text-lg font-semibold text-black">
          {email}
        </Text>
      </View>

      <View className="mb-4 rounded-xl bg-gray-50 p-4">
        <Text className="text-xs uppercase tracking-wide text-gray-500">
          User ID
        </Text>

        <Text
          selectable
          className="mt-1 text-lg font-semibold text-black"
        >
          {user?.id || 'N/A'}
        </Text>
      </View>

      <View className="mb-4 rounded-xl bg-gray-50 p-4">
        <Text className="text-xs uppercase tracking-wide text-gray-500">
          Session ID
        </Text>

        <Text
          selectable
          className="mt-1 text-lg font-semibold text-black"
        >
          {sessionId || 'N/A'}
        </Text>
      </View>

      <View className="mb-4 rounded-xl bg-gray-50 p-4">
        <Text className="text-xs uppercase tracking-wide text-gray-500">
          Token
        </Text>

        <Text
          selectable
          className="text-xs leading-5 text-black"
          numberOfLines={2}
        >
          {token
            ? `${token.substring(0, 30)}...`
            : tokenLoading
              ? 'Loading...'
              : 'N/A'}
        </Text>

        {tokenError ? (
          <Text className="mt-2 text-xs text-red-500">
            {tokenError}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={handleRefreshToken}
        disabled={tokenLoading}
        className={`mb-3 h-12 items-center justify-center rounded-xl border border-gray-200 ${
          tokenLoading ? 'opacity-50' : 'active:opacity-70'
        }`}
      >
        <Text className="text-sm font-semibold text-black">
          {tokenLoading
            ? 'Refreshing...'
            : 'Refresh Token'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleSignOut}
        className="mt-3 h-14 items-center justify-center rounded-2xl bg-red-500 active:opacity-80"
      >
        <Text className="text-base font-semibold text-white">
          Sign Out
        </Text>
      </Pressable>
    </ScrollView>
  )
}