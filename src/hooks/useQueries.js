import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiService from '../services/apiService'
import logger from '../utils/logger'

// Query keys for consistent caching
export const QUERY_KEYS = {
  // User queries
  USER_PROFILE: ['user', 'profile'],
  USER_PUBLIC_PROFILE: (username) => ['user', 'public', username],
  
  // Dashboard queries
  DASHBOARD: ['dashboard'],
  ANALYTICS: (timeframe) => ['analytics', timeframe],
  
  // Links queries
  LINKS: ['links'],
  LINK: (id) => ['links', id],
  
  // Customization queries
  CUSTOMIZATION: ['customization']
}

// Auth hooks
export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: apiService.auth.login,
    onSuccess: (data) => {
      logger.auth('login', true, { userId: data.user?.id })
      // Invalidate and refetch user profile after login
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => {
      logger.auth('login', false, error.message)
    }
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: apiService.auth.logout,
    onSuccess: () => {
      logger.auth('logout', true)
      // Clear all cached data on logout
      queryClient.clear()
    },
    onError: (error) => {
      logger.auth('logout', false, error.message)
      // Still clear cache even if logout API fails
      queryClient.clear()
    }
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: apiService.auth.register,
    onSuccess: (data) => {
      logger.auth('register', true, { userId: data.user?.id })
    },
    onError: (error) => {
      logger.auth('register', false, error.message)
    }
  })
}

// User profile hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: QUERY_KEYS.USER_PROFILE,
    queryFn: async () => {
      const response = await apiService.user.getProfile()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if unauthorized
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return false
      }
      return failureCount < 2
    }
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: apiService.user.updateProfile,
    onSuccess: (data) => {
      logger.userAction('profile_updated', { userId: data.user?.id })
      // Update the profile cache
      queryClient.setQueryData(QUERY_KEYS.USER_PROFILE, data)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => {
      logger.error('Profile update failed', error)
    }
  })
}

export const useUploadAvatar = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ file }) => {
      const formData = new FormData()
      formData.append('file', file)
      return apiService.user.uploadAvatar(formData)
    },
    onSuccess: (data, variables) => {
      logger.upload(variables.file.name, variables.file.size, true)
      // Update profile cache with new avatar
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error, variables) => {
      logger.upload(variables.file.name, variables.file.size, false, error)
    }
  })
}

export const usePublicProfile = (username) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER_PUBLIC_PROFILE(username),
    queryFn: () => apiService.user.getPublicProfile(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 2, // 2 minutes for public profiles
    retry: (failureCount, error) => {
      // Don't retry on 404 (user not found)
      if (error.message?.includes('404')) {
        return false
      }
      return failureCount < 2
    }
  })
}

// Dashboard hooks
export const useDashboard = () => {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: async () => {
      const response = await apiService.dashboard.getDashboard()
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5 // 5 minutes
  })
}

export const useAnalytics = (timeframe = '7d') => {
  return useQuery({
    queryKey: QUERY_KEYS.ANALYTICS(timeframe),
    queryFn: async () => {
      const response = await apiService.dashboard.getAnalytics(timeframe)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!timeframe
  })
}

// Links hooks
export const useLinks = () => {
  return useQuery({
    queryKey: QUERY_KEYS.LINKS,
    queryFn: async () => {
      const response = await apiService.links.getLinks()
      return response.data || []
    },
    staleTime: 1000 * 60 * 3 // 3 minutes
  })
}

export const useCreateLink = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: apiService.links.createLink,
    onSuccess: (data) => {
      logger.userAction('link_created', { linkId: data.data?.id })
      // Add the new link to the cache
      queryClient.setQueryData(QUERY_KEYS.LINKS, (old) => {
        return old ? [...old, data.data] : [data.data]
      })
      // Invalidate dashboard to update stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => {
      logger.error('Link creation failed', error)
    }
  })
}

export const useUpdateLink = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ linkId, ...data }) => apiService.links.updateLink(linkId, data),
    onSuccess: (data, variables) => {
      logger.userAction('link_updated', { linkId: variables.linkId })
      // Update the specific link in cache
      queryClient.setQueryData(QUERY_KEYS.LINKS, (old) => {
        return old ? old.map(link => 
          link.id === variables.linkId ? data.data : link
        ) : []
      })
      // Invalidate dashboard to update stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => {
      logger.error('Link update failed', error)
    }
  })
}

export const useDeleteLink = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (linkId) => apiService.links.deleteLink(linkId),
    onSuccess: (data, linkId) => {
      logger.userAction('link_deleted', { linkId })
      // Remove the link from cache
      queryClient.setQueryData(QUERY_KEYS.LINKS, (old) => {
        return old ? old.filter(link => link.id !== linkId) : []
      })
      // Invalidate dashboard to update stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => {
      logger.error('Link deletion failed', error)
    }
  })
}

// Customization hooks
export const useCustomizationSettings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMIZATION,
    queryFn: async () => {
      const response = await apiService.customization.getSettings()
      return response.data || {}
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

export const useUpdateCustomization = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: apiService.customization.updateSettings,
    onSuccess: (data) => {
      logger.userAction('customization_updated')
      // Update customization cache
      queryClient.setQueryData(QUERY_KEYS.CUSTOMIZATION, data.data)
      // Invalidate dashboard to show updated preview
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => {
      logger.error('Customization update failed', error)
    }
  })
}

export const useUploadAsset = (assetType) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ file }) => {
      const formData = new FormData()
      formData.append('file', file)
      
      switch (assetType) {
        case 'background':
          return apiService.customization.uploadBackground(formData)
        case 'audio':
          return apiService.customization.uploadAudio(formData)
        case 'cursor':
          return apiService.customization.uploadCursor(formData)
        default:
          throw new Error(`Unknown asset type: ${assetType}`)
      }
    },
    onSuccess: (data, variables) => {
      logger.upload(variables.file.name, variables.file.size, true, null, assetType)
      // Invalidate customization to refetch with new asset URL
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CUSTOMIZATION })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error, variables) => {
      logger.upload(variables.file.name, variables.file.size, false, error, assetType)
    }
  })
}

export const useResetCustomization = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: apiService.customization.resetSettings,
    onSuccess: (data) => {
      logger.userAction('customization_reset')
      // Update cache with reset settings
      queryClient.setQueryData(QUERY_KEYS.CUSTOMIZATION, data.data || {})
      // Invalidate dashboard
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD })
    },
    onError: (error) => {
      logger.error('Customization reset failed', error)
    }
  })
}

// Link click tracking (fire and forget)
export const useTrackLinkClick = () => {
  return useMutation({
    mutationFn: ({ linkId, metadata }) => apiService.links.trackClick(linkId, metadata),
    // Don't show errors for click tracking
    onError: () => {},
    // Track success for analytics
    onSuccess: (data, variables) => {
      logger.userAction('link_clicked', { linkId: variables.linkId })
    }
  })
}