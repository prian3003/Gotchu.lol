import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import logger from '../utils/logger'

// Create a client with optimized defaults
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes by default
        staleTime: 1000 * 60 * 5,
        // Keep in cache for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Retry failed requests up to 2 times
        retry: (failureCount, error) => {
          // Don't retry on 401/403 (auth errors)
          if (error?.status === 401 || error?.status === 403) {
            return false
          }
          // Retry up to 2 times for other errors
          return failureCount < 2
        },
        // Retry with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus in production
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        // Don't refetch on reconnect automatically
        refetchOnReconnect: false,
        // Show errors but don't throw them by default
        throwOnError: false,
        // Network mode - continue to retry even when offline
        networkMode: 'offlineFirst'
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        // Don't throw errors by default for mutations
        throwOnError: false,
        // Network mode for mutations
        networkMode: 'offlineFirst',
        // Global mutation error handler
        onError: (error, variables, context) => {
          logger.error('Mutation failed', error, { variables, context })
        },
        // Global mutation success handler
        onSuccess: (data, variables, context) => {
          logger.userAction('mutation_success', { variables, context })
        }
      }
    }
  })
}

let queryClient

// Get or create singleton query client
export const getQueryClient = () => {
  if (!queryClient) {
    queryClient = createQueryClient()
  }
  return queryClient
}

// Query provider component
const QueryProvider = ({ children }) => {
  const client = getQueryClient()

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* React Query DevTools disabled to prevent loading UI confusion */}
      {false && process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              fontSize: '12px',
              padding: '4px 8px',
              backgroundColor: '#58A4B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }
          }}
        />
      )}
    </QueryClientProvider>
  )
}

// Utility to invalidate all queries (useful for logout)
export const invalidateAllQueries = () => {
  const client = getQueryClient()
  client.invalidateQueries()
}

// Utility to clear all query cache
export const clearQueryCache = () => {
  const client = getQueryClient()
  client.clear()
}

// Utility to remove specific queries
export const removeQueries = (filters) => {
  const client = getQueryClient()
  client.removeQueries(filters)
}

// Utility to prefetch data
export const prefetchQuery = (queryKey, queryFn, options = {}) => {
  const client = getQueryClient()
  return client.prefetchQuery({
    queryKey,
    queryFn,
    ...options
  })
}

// Utility to set query data manually
export const setQueryData = (queryKey, data) => {
  const client = getQueryClient()
  client.setQueryData(queryKey, data)
}

export default QueryProvider