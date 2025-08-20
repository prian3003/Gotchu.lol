import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { 
  HiRectangleStack, 
  HiPlus, 
  HiMagnifyingGlass, 
  HiChevronDown,
  HiStar,
  HiEye,
  HiLink,
  HiUsers,
  HiArrowTrendingUp,
  HiFunnel,
  HiXMark,
  HiHeart,
  HiArrowDownTray,
  HiInformationCircle
} from 'react-icons/hi2'
import logger from '../../utils/logger'
import { useDashboard } from '../../hooks/dashboard/useDashboard'

// Helper Functions
const formatCategoryName = (category) => {
  if (!category) return 'Unknown'
  return category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ')
}

const TemplatesSection = () => {
  const navigate = useNavigate()
  const { user } = useDashboard()
  const [activeTab, setActiveTab] = useState('library')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [templates, setTemplates] = useState([])
  const [likedTemplates, setLikedTemplates] = useState([])
  const [userTemplates, setUserTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUseTemplateModal, setShowUseTemplateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)

  const tabs = [
    { id: 'library', label: 'Template Library', count: templates.length },
    { id: 'favorites', label: 'Favorite Templates', count: likedTemplates.length },
    { id: 'uploads', label: 'My Uploads', count: userTemplates.length }
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Newest' },
    { value: 'downloads', label: 'Most Popular' },
    { value: 'likes', label: 'Most Liked' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'name', label: 'Alphabetical' }
  ]

  // API Functions
  const fetchTemplates = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort: sortBy,
        order: 'desc'
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/templates?${params}`)
      const data = await response.json()

      if (data.success) {
        setTemplates(data.data.templates)
        setPagination(data.data.pagination)
      } else {
        logger.error('Failed to fetch templates:', data.error)
      }
    } catch (error) {
      logger.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLikedTemplates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')

      const response = await fetch('/api/templates/liked', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-ID': sessionId
        }
      })
      const data = await response.json()

      if (data.success) {
        setLikedTemplates(data.data.templates)
      } else {
        logger.error('Failed to fetch liked templates:', data.error)
      }
    } catch (error) {
      logger.error('Error fetching liked templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserTemplates = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')

      console.log('🔍 Fetching user templates...')
      
      const response = await fetch('/api/templates/my-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-ID': sessionId
        }
      })
      
      console.log('📡 User templates response status:', response.status)
      
      const data = await response.json()
      console.log('📋 User templates data:', data)

      if (data.success) {
        setUserTemplates(data.data.templates)
        console.log('✅ User templates set:', data.data.templates.length, 'templates')
        
        // Store template limit info for UI
        const limitInfo = data.data.template_limit
        console.log(`📊 Templates: ${limitInfo.current}/${limitInfo.maximum} (${limitInfo.remaining} remaining)`)
      } else {
        console.error('❌ Failed to fetch user templates:', data.error)
        logger.error('Failed to fetch user templates:', data.error)
      }
    } catch (error) {
      console.error('💥 Error fetching user templates:', error)
      logger.error('Error fetching user templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/templates/categories')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data.categories)
      }
    } catch (error) {
      logger.error('Error fetching categories:', error)
    }
  }

  const handleLikeTemplate = async (templateId) => {
    try {
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')

      const response = await fetch(`/api/templates/${templateId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-ID': sessionId
        }
      })
      const data = await response.json()

      if (data.success) {
        // Update the templates list to reflect the like status
        if (activeTab === 'library') {
          fetchTemplates(pagination.page)
        } else if (activeTab === 'favorites') {
          fetchLikedTemplates()
        }
      } else {
        logger.error('Failed to like template:', data.error)
      }
    } catch (error) {
      logger.error('Error liking template:', error)
    }
  }

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template)
    setShowUseTemplateModal(true)
  }

  const handleApplyTemplate = async (template) => {
    try {
      setApplyLoading(true)
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')

      const response = await fetch(`/api/templates/${template.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-ID': sessionId
        }
      })
      const data = await response.json()

      if (data.success) {
        setShowUseTemplateModal(false)
        // TODO: Show success notification
        console.log('Template applied successfully!')
      } else {
        logger.error('Failed to apply template:', data.error)
        // TODO: Show error notification
      }
    } catch (error) {
      logger.error('Error applying template:', error)
    } finally {
      setApplyLoading(false)
    }
  }

  const handlePreviewTemplate = (template) => {
    if (user?.username) {
      // Navigate to user's profile page with template preview parameters
      navigate(`/${user.username}?templatePreview=true&templateId=${template.id}`)
    } else {
      // Fallback to modal if no username available
      setSelectedTemplate(template)
      setShowUseTemplateModal(false)
      setShowPreviewModal(true)
    }
  }

  const handleCopyLink = (template) => {
    navigator.clipboard.writeText(`${window.location.origin}/template/${template.id}`)
    // TODO: Show toast notification
  }

  const handlePreview = (template) => {
    setSelectedTemplate(template)
    setShowPreviewModal(true)
  }

  const handleCreateTemplate = () => {
    setShowCreateModal(true)
  }

  const handleCreateFromCurrent = async (templateData) => {
    try {
      setCreateLoading(true)
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')

      // Create FormData to handle file upload
      const formData = new FormData()
      
      // Add text fields
      formData.append('name', templateData.name)
      formData.append('description', templateData.description)
      formData.append('category', templateData.category)
      formData.append('isPublic', templateData.isPublic)
      formData.append('isPremiumOnly', templateData.isPremiumOnly)
      formData.append('tags', templateData.tags)
      
      // Add thumbnail file if present
      if (templateData.thumbnail) {
        formData.append('thumbnail', templateData.thumbnail)
      }

      const response = await fetch('/api/templates/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Session-ID': sessionId
        },
        body: formData
      })
      const data = await response.json()

      if (data.success) {
        setShowCreateModal(false)
        // Refresh templates list
        fetchTemplates(1)
        // TODO: Show success notification
        console.log('Template created successfully!')
      } else {
        logger.error('Failed to create template:', data.error)
        // TODO: Show error notification
      }
    } catch (error) {
      logger.error('Error creating template:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  const getCurrentTemplates = () => {
    let currentTemplates
    switch (activeTab) {
      case 'favorites':
        currentTemplates = likedTemplates
        console.log('💖 Getting favorites templates:', currentTemplates.length)
        break
      case 'uploads':
        currentTemplates = userTemplates
        console.log('📤 Getting user templates:', currentTemplates.length)
        break
      default:
        currentTemplates = templates
        console.log('📚 Getting library templates:', currentTemplates.length)
        break
    }
    return currentTemplates
  }

  const filteredTemplates = getCurrentTemplates().filter(template => {
    if (!searchQuery) return true
    
    const searchTerm = searchQuery.toLowerCase()
    const nameMatch = template.name?.toLowerCase().includes(searchTerm)
    const descMatch = template.description?.toLowerCase().includes(searchTerm)
    const authorMatch = template.creator?.username?.toLowerCase().includes(searchTerm)
    const tagsMatch = template.tags && JSON.parse(template.tags || '[]').some(tag => 
      tag.toLowerCase().includes(searchTerm)
    )
    
    return nameMatch || descMatch || authorMatch || tagsMatch
  })

  // useEffect hooks
  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    console.log('🔄 Tab changed to:', activeTab)
    if (activeTab === 'library') {
      console.log('📚 Fetching library templates...')
      fetchTemplates(1)
    } else if (activeTab === 'favorites') {
      console.log('❤️ Fetching liked templates...')
      fetchLikedTemplates()
    } else if (activeTab === 'uploads') {
      console.log('📤 Fetching user uploads...')
      fetchUserTemplates()
    }
  }, [activeTab, sortBy])

  useEffect(() => {
    if (activeTab === 'library') {
      const timeoutId = setTimeout(() => {
        fetchTemplates(1)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery])

  return (
    <TemplatesWrapper>
      <ContentWrapper>
        <SectionHeader>
          <HiRectangleStack style={{ fontSize: '2rem', color: '#58A4B0' }} />
          <HeaderContent>
            <h2>Discover the perfect Template for your Profile</h2>
            <p>Browse community-created templates, or design your own to share with the community.</p>
          </HeaderContent>
        </SectionHeader>

        <TemplateControls>
          <TabsContainer>
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                $active={activeTab === tab.id}
                onClick={() => {
                  console.log('🖱️ Tab clicked:', tab.id)
                  setActiveTab(tab.id)
                }}
              >
                {tab.label}
                {tab.count > 0 && <TabCount>{tab.count}</TabCount>}
              </TabButton>
            ))}
          </TabsContainer>

          <CreateTemplateButton onClick={handleCreateTemplate}>
            <HiPlus />
            Create Template
          </CreateTemplateButton>
        </TemplateControls>

        <FilterControls>
          <SearchContainer>
            <HiMagnifyingGlass />
            <SearchInput
              type="text"
              placeholder="Explore community-created templates"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchContainer>

          <SortContainer>
            <HiFunnel />
            <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SortSelect>
            <HiChevronDown />
          </SortContainer>

          <FilterButton>
            <HiUsers />
          </FilterButton>
        </FilterControls>

        {loading ? (
          <LoadingGrid>
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i}>
                <SkeletonImage />
                <SkeletonInfo>
                  <SkeletonLine width="80%" />
                  <SkeletonLine width="60%" />
                  <SkeletonLine width="40%" />
                </SkeletonInfo>
              </SkeletonCard>
            ))}
          </LoadingGrid>
        ) : (
          <TemplatesGrid>
            {filteredTemplates.map(template => {
              const tags = template.tags ? JSON.parse(template.tags) : []
              const previewImage = template.preview_image_url || template.thumbnail_url || 
                template.background_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop'
              
              return (
                <TemplateCard key={template.id}>
                  <TemplatePreview>
                    <img src={previewImage} alt={template.name} />
                    <FavoriteButton
                      $favorited={activeTab === 'favorites'}
                      onClick={() => handleLikeTemplate(template.id)}
                    >
                      <HiHeart />
                    </FavoriteButton>
                    {template.is_premium_only && (
                      <PremiumBadge>
                        <HiStar />
                        Premium
                      </PremiumBadge>
                    )}
                  </TemplatePreview>

                  <TemplateInfo>
                    <TemplateTitle>{template.name}</TemplateTitle>
                    <TemplateAuthor>@{template.creator?.username || 'Unknown'}</TemplateAuthor>

                    <TemplateStats>
                      <StatItem>
                        <HiArrowDownTray />
                        {template.downloads?.toLocaleString() || 0} downloads
                      </StatItem>
                      <StatItem>
                        <HiEye />
                        {template.views?.toLocaleString() || 0} views
                      </StatItem>
                      <StatItem>
                        <HiHeart />
                        {template.likes?.toLocaleString() || 0} likes
                      </StatItem>
                    </TemplateStats>

                    {template.description && (
                      <TemplateDescription>{template.description}</TemplateDescription>
                    )}

                    <TemplateTags>
                      <CategoryTag category={template.category}>
                        {template.category}
                      </CategoryTag>
                      {tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </TemplateTags>

                    <TemplateActions>
                      <UseTemplateButton 
                        onClick={() => handleUseTemplate(template)}
                        disabled={template.is_premium_only && !template.user_has_premium}
                      >
                        {template.is_premium_only && !template.user_has_premium ? 'Premium Required' : 'Use Template'}
                      </UseTemplateButton>
                      <ActionButton onClick={() => handleCopyLink(template)}>
                        <HiLink />
                      </ActionButton>
                      <ActionButton onClick={() => handlePreview(template)}>
                        <HiEye />
                      </ActionButton>
                    </TemplateActions>
                  </TemplateInfo>
                </TemplateCard>
              )
            })}
          </TemplatesGrid>
        )}

        {activeTab === 'uploads' && (
          <EmptyState>
            <HiRectangleStack style={{ fontSize: '3rem', color: '#58A4B0', marginBottom: '1rem' }} />
            <h3>No templates uploaded yet</h3>
            <p>Create your first template to share with the community</p>
            <CreateTemplateButton>
              <HiPlus />
              Create First Template
            </CreateTemplateButton>
          </EmptyState>
        )}

        {filteredTemplates.length === 0 && activeTab !== 'uploads' && !loading && (
          <EmptyState>
            <HiMagnifyingGlass style={{ fontSize: '3rem', color: '#58A4B0', marginBottom: '1rem' }} />
            <h3>No templates found</h3>
            <p>Try adjusting your search or filters</p>
          </EmptyState>
        )}
      </ContentWrapper>

      {/* Template Preview Modal */}
      {showPreviewModal && selectedTemplate && createPortal(
        <TemplateModal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>{selectedTemplate.name}</ModalTitle>
              <CloseButton onClick={() => setShowPreviewModal(false)}>
                <HiXMark />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <TemplatePreviewLarge>
                <img 
                  src={selectedTemplate.preview_image_url || selectedTemplate.thumbnail_url || selectedTemplate.background_url}
                  alt={selectedTemplate.name}
                />
              </TemplatePreviewLarge>

              <TemplateDetailsSection>
                <TemplateMetadata>
                  <MetadataItem>
                    <MetadataLabel>Creator</MetadataLabel>
                    <MetadataValue>@{selectedTemplate.creator?.username}</MetadataValue>
                  </MetadataItem>
                  <MetadataItem>
                    <MetadataLabel>Category</MetadataLabel>
                    <MetadataValue>{selectedTemplate.category}</MetadataValue>
                  </MetadataItem>
                  <MetadataItem>
                    <MetadataLabel>Downloads</MetadataLabel>
                    <MetadataValue>{selectedTemplate.downloads?.toLocaleString()}</MetadataValue>
                  </MetadataItem>
                  <MetadataItem>
                    <MetadataLabel>Likes</MetadataLabel>
                    <MetadataValue>{selectedTemplate.likes?.toLocaleString()}</MetadataValue>
                  </MetadataItem>
                </TemplateMetadata>

                {selectedTemplate.description && (
                  <TemplateFullDescription>
                    <h4>Description</h4>
                    <p>{selectedTemplate.description}</p>
                  </TemplateFullDescription>
                )}

                <TemplateFeatures>
                  <h4>Template Features</h4>
                  <FeaturesList>
                    {selectedTemplate.accent_color && <FeatureItem>Custom accent color</FeatureItem>}
                    {selectedTemplate.background_url && <FeatureItem>Custom background</FeatureItem>}
                    {selectedTemplate.audio_url && <FeatureItem>Background music</FeatureItem>}
                    {selectedTemplate.glow_username && <FeatureItem>Username glow effect</FeatureItem>}
                    {selectedTemplate.animated_title && <FeatureItem>Animated title</FeatureItem>}
                    {selectedTemplate.profile_gradient && <FeatureItem>Gradient effects</FeatureItem>}
                  </FeaturesList>
                </TemplateFeatures>

                <ModalActions>
                  <UseTemplateButton 
                    onClick={() => {
                      handleUseTemplate(selectedTemplate)
                      setShowPreviewModal(false)
                    }}
                    disabled={selectedTemplate.is_premium_only && !selectedTemplate.user_has_premium}
                  >
                    {selectedTemplate.is_premium_only && !selectedTemplate.user_has_premium ? 'Premium Required' : 'Apply Template'}
                  </UseTemplateButton>
                  <ActionButton onClick={() => handleLikeTemplate(selectedTemplate.id)}>
                    <HiHeart />
                  </ActionButton>
                  <ActionButton onClick={() => handleCopyLink(selectedTemplate)}>
                    <HiLink />
                  </ActionButton>
                </ModalActions>
              </TemplateDetailsSection>
            </ModalBody>
          </ModalContent>
        </TemplateModal>,
        document.body
      )}

      {/* Create Template Modal */}
      {showCreateModal && createPortal(
        <CreateTemplateModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateFromCurrent}
          loading={createLoading}
          categories={categories}
        />,
        document.body
      )}

      {/* Use Template Modal */}
      {showUseTemplateModal && selectedTemplate && createPortal(
        <UseTemplateModal 
          template={selectedTemplate}
          onClose={() => setShowUseTemplateModal(false)}
          onPreview={() => handlePreviewTemplate(selectedTemplate)}
          onApply={() => handleApplyTemplate(selectedTemplate)}
          applyLoading={applyLoading}
        />,
        document.body
      )}
    </TemplatesWrapper>
  )
}

// Create Template Modal Component
const CreateTemplateModal = ({ onClose, onSubmit, loading, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'PERSONAL',
    isPublic: true,
    isPremiumOnly: false,
    tags: [],
    thumbnail: null
  })
  const [tagInput, setTagInput] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.thumbnail) return

    const templateData = {
      ...formData,
      tags: JSON.stringify(formData.tags)
    }

    onSubmit(templateData)
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, thumbnail: file }))
        
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setThumbnailPreview(e.target.result)
        }
        reader.readAsDataURL(file)
      } else {
        alert('Please select an image file')
      }
    }
  }

  const removeThumbnail = () => {
    setFormData(prev => ({ ...prev, thumbnail: null }))
    setThumbnailPreview(null)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <TemplateModal>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Create New Template</ModalTitle>
          <CloseButton onClick={onClose}>
            <HiXMark />
          </CloseButton>
        </ModalHeader>

        <CreateModalBody>
          <CreateForm onSubmit={handleSubmit}>
            <FormSection>
              <FormLabel>Template Name *</FormLabel>
              <FormInput
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
                required
              />
            </FormSection>

            <FormSection>
              <FormLabel>Description</FormLabel>
              <FormTextarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your template..."
                rows={3}
              />
            </FormSection>

            <FormSection>
              <FormLabel>Template Thumbnail *</FormLabel>
              <ThumbnailUploadArea>
                {thumbnailPreview ? (
                  <ThumbnailPreview>
                    <img src={thumbnailPreview} alt="Thumbnail preview" />
                    <RemoveThumbnailButton onClick={removeThumbnail}>
                      <HiXMark />
                    </RemoveThumbnailButton>
                  </ThumbnailPreview>
                ) : (
                  <ThumbnailUploadButton>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      style={{ display: 'none' }}
                      id="thumbnail-upload"
                    />
                    <label htmlFor="thumbnail-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <HiPlus style={{ fontSize: '2rem', color: '#58A4B0' }} />
                      <span>Upload Thumbnail *</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>PNG, JPG up to 5MB (Required)</span>
                    </label>
                  </ThumbnailUploadButton>
                )}
              </ThumbnailUploadArea>
            </FormSection>

            <FormRow>
              <FormSection>
                <FormLabel>Category</FormLabel>
                <FormSelect
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.length > 0 ? categories.map(category => (
                    <option key={category} value={category}>
                      {formatCategoryName(category)}
                    </option>
                  )) : (
                    <option value="PERSONAL">Personal</option>
                  )}
                </FormSelect>
              </FormSection>
            </FormRow>

            <FormSection>
              <FormLabel>Tags</FormLabel>
              <TagInputContainer>
                <TagInput
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags (press Enter)"
                />
                <AddTagButton type="button" onClick={addTag}>
                  <HiPlus />
                </AddTagButton>
              </TagInputContainer>
              <TagsList>
                {formData.tags.map(tag => (
                  <TagItem key={tag}>
                    {tag}
                    <RemoveTagButton type="button" onClick={() => removeTag(tag)}>
                      <HiXMark />
                    </RemoveTagButton>
                  </TagItem>
                ))}
              </TagsList>
            </FormSection>

            <FormSection>
              <CheckboxContainer>
                <FormCheckbox
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <CheckboxLabel htmlFor="isPublic">
                  Make this template public
                </CheckboxLabel>
              </CheckboxContainer>
            </FormSection>

            <FormSection>
              <CheckboxContainer>
                <FormCheckbox
                  type="checkbox"
                  id="isPremiumOnly"
                  checked={formData.isPremiumOnly}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPremiumOnly: e.target.checked }))}
                />
                <CheckboxLabel htmlFor="isPremiumOnly">
                  Premium only template
                </CheckboxLabel>
              </CheckboxContainer>
            </FormSection>

            <CreateFormActions>
              <SecondaryButton type="button" onClick={onClose}>
                Cancel
              </SecondaryButton>
              <SubmitButton type="submit" disabled={loading || !formData.name.trim() || !formData.thumbnail}>
                {loading ? 'Creating...' : 'Create Template'}
              </SubmitButton>
            </CreateFormActions>
          </CreateForm>

          <TemplatePreviewInfo>
            <h4>Template Preview</h4>
            <p>This template will be created using your current profile customization settings including:</p>
            <PreviewFeaturesList>
              <li>Current color scheme</li>
              <li>Background settings</li>
              <li>Audio configuration</li>
              <li>Visual effects</li>
              <li>Profile settings</li>
            </PreviewFeaturesList>
            <PreviewNote>
              <HiInformationCircle />
              Users will be able to apply your template to get the same look and feel.
            </PreviewNote>
          </TemplatePreviewInfo>
        </CreateModalBody>
      </ModalContent>
    </TemplateModal>
  )
}

// Use Template Modal Component
const UseTemplateModal = ({ template, onClose, onPreview, onApply, applyLoading }) => {
  const creatorAvatar = template.creator?.avatar_url || `https://ui-avatars.com/api/?name=${template.creator?.username || 'User'}&background=58A4B0&color=fff`
  const templateThumbnail = template.thumbnail_url || template.preview_image_url || template.background_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop'

  return (
    <TemplateModal>
      <UseTemplateModalContent>
        <ModalHeader>
          <ModalTitle>Use Template</ModalTitle>
          <CloseButton onClick={onClose}>
            <HiXMark />
          </CloseButton>
        </ModalHeader>

        <UseTemplateModalBody>
          <TemplateImageContainer>
            <TemplateImage src={templateThumbnail} alt={template.name} />
          </TemplateImageContainer>

          <TemplateDetails>
            <TemplateName>{template.name}</TemplateName>
            
            {template.description && (
              <UseModalDescription>{template.description}</UseModalDescription>
            )}

            <CreatorInfo>
              <CreatorAvatar src={creatorAvatar} alt={template.creator?.username} />
              <CreatorDetails>
                <CreatorLabel>Created by</CreatorLabel>
                <CreatorUsername>@{template.creator?.username || 'Unknown'}</CreatorUsername>
              </CreatorDetails>
            </CreatorInfo>

            <TemplateStats>
              <StatItem>
                <HiArrowDownTray />
                {template.downloads?.toLocaleString() || 0} downloads
              </StatItem>
              <StatItem>
                <HiHeart />
                {template.likes?.toLocaleString() || 0} likes
              </StatItem>
            </TemplateStats>

            <UseTemplateActions>
              <PreviewButton onClick={onPreview}>
                <HiEye />
                Preview Template
              </PreviewButton>
              <UseButton onClick={onApply} disabled={applyLoading}>
                {applyLoading ? 'Applying...' : 'Use Template'}
              </UseButton>
            </UseTemplateActions>
          </TemplateDetails>
        </UseTemplateModalBody>
      </UseTemplateModalContent>
    </TemplateModal>
  )
}

// Styled Components matching CustomizationPage structure
const TemplatesWrapper = styled.div`
  min-height: 100vh;
  position: relative;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 200px);
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  
  svg {
    font-size: 2rem;
    color: #58A4B0;
  }
`

const HeaderContent = styled.div`
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }
  
  p {
    font-size: 0.9rem;
    color: #a0a0a0;
    margin: 0.25rem 0 0 0;
  }
`

const TemplateControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${props => props.$active ? 'rgba(88, 164, 176, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active ? 'rgba(88, 164, 176, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: ${props => props.$active ? '#58A4B0' : '#a0a0a0'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
  
  &:hover {
    background: rgba(88, 164, 176, 0.15);
    color: #58A4B0;
    border-color: rgba(88, 164, 176, 0.3);
  }
`

const TabCount = styled.span`
  background: rgba(88, 164, 176, 0.3);
  color: #58A4B0;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
`

const CreateTemplateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
  
  &:hover {
    background: linear-gradient(135deg, #7C3AED, #6D28D9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
  
  svg {
    font-size: 1rem;
  }
`

const FilterControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  
  svg {
    color: #a0a0a0;
    font-size: 1.2rem;
  }
`

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 0.9rem;
  outline: none;
  
  &::placeholder {
    color: #a0a0a0;
  }
`

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  
  svg {
    color: #a0a0a0;
    font-size: 1rem;
  }
`

const SortSelect = styled.select`
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  
  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(88, 164, 176, 0.1);
    color: #58A4B0;
    border-color: rgba(88, 164, 176, 0.3);
  }
  
  svg {
    font-size: 1.2rem;
  }
`

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const TemplateCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    border-color: rgba(88, 164, 176, 0.3);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }
`

const TemplatePreview = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
`

const FavoriteButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  color: ${props => props.$favorited ? '#FFD700' : '#ffffff'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.1);
  }
  
  svg {
    font-size: 1rem;
  }
`

const TemplateInfo = styled.div`
  padding: 1rem;
`

const TemplateTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TemplateAuthor = styled.p`
  font-size: 0.8rem;
  color: #a0a0a0;
  margin: 0 0 0.75rem 0;
`

const TemplateStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #a0a0a0;
  
  svg {
    font-size: 0.875rem;
  }
`

const TemplateTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`

const Tag = styled.span`
  background: rgba(88, 164, 176, 0.2);
  color: #58A4B0;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(88, 164, 176, 0.3);
`

const TemplateActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const UseTemplateButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  border: none;
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: 600;
  
  &:hover {
    background: linear-gradient(135deg, #7C3AED, #6D28D9);
    transform: translateY(-1px);
  }
`

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(88, 164, 176, 0.2);
    color: #58A4B0;
    border-color: rgba(88, 164, 176, 0.4);
  }
  
  svg {
    font-size: 1rem;
  }
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem;
  color: #a0a0a0;
  
  h3 {
    font-size: 1.25rem;
    color: #ffffff;
    margin: 0 0 0.5rem 0;
  }
  
  p {
    margin: 0 0 2rem 0;
  }
`

// Loading components
const LoadingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const SkeletonCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`

const SkeletonImage = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`

const SkeletonInfo = styled.div`
  padding: 1rem;
`

const SkeletonLine = styled.div`
  height: 12px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  width: ${props => props.width || '100%'};
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`

// New styled components for backend data
const PremiumBadge = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  
  svg {
    font-size: 0.75rem;
  }
`

const TemplateDescription = styled.p`
  font-size: 0.8rem;
  color: #a0a0a0;
  margin: 0.5rem 0;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`

const CategoryTag = styled.span`
  background: ${props => getCategoryColor(props.category)};
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
`

// Template Modal Components
const TemplateModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
`

const ModalContent = styled.div`
  background: linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(18, 18, 18, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(20px);
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
  
  svg {
    font-size: 1.25rem;
  }
`

const ModalBody = styled.div`
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const TemplatePreviewLarge = styled.div`
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 300px;
    object-fit: cover;
  }
`

const TemplateDetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const TemplateMetadata = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const MetadataLabel = styled.span`
  font-size: 0.8rem;
  color: #a0a0a0;
  font-weight: 600;
`

const MetadataValue = styled.span`
  font-size: 1rem;
  color: #ffffff;
  font-weight: 700;
`

const TemplateFullDescription = styled.div`
  h4 {
    font-size: 1rem;
    color: #ffffff;
    margin: 0 0 0.5rem 0;
  }
  
  p {
    font-size: 0.9rem;
    color: #a0a0a0;
    line-height: 1.6;
    margin: 0;
  }
`

const TemplateFeatures = styled.div`
  h4 {
    font-size: 1rem;
    color: #ffffff;
    margin: 0 0 0.75rem 0;
  }
`

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const FeatureItem = styled.li`
  font-size: 0.9rem;
  color: #a0a0a0;
  display: flex;
  align-items: center;
  
  &:before {
    content: '✓';
    color: #58A4B0;
    font-weight: bold;
    margin-right: 0.5rem;
  }
`

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`

// Create Template Modal Styled Components
const CreateModalBody = styled.div`
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const CreateForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const FormLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
`

const FormInput = styled.input`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: #a0a0a0;
  }
`

const FormTextarea = styled.textarea`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: #a0a0a0;
  }
`

const FormSelect = styled.select`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  option {
    background: #1a1a1a;
    color: #ffffff;
  }
`

const TagInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`

const TagInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: #a0a0a0;
  }
`

const AddTagButton = styled.button`
  width: 40px;
  height: 40px;
  background: rgba(88, 164, 176, 0.2);
  border: 1px solid rgba(88, 164, 176, 0.4);
  border-radius: 8px;
  color: #58A4B0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(88, 164, 176, 0.3);
    transform: scale(1.05);
  }
  
  svg {
    font-size: 1rem;
  }
`

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`

const TagItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(88, 164, 176, 0.2);
  color: #58A4B0;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(88, 164, 176, 0.3);
`

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: #58A4B0;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #ffffff;
  }
  
  svg {
    font-size: 0.8rem;
  }
`

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const FormCheckbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #58A4B0;
`

const CheckboxLabel = styled.label`
  font-size: 0.9rem;
  color: #ffffff;
  cursor: pointer;
`

const CreateFormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const SecondaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
`

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #7C3AED, #6D28D9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const TemplatePreviewInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  height: fit-content;
  
  h4 {
    font-size: 1rem;
    color: #ffffff;
    margin: 0 0 0.75rem 0;
  }
  
  p {
    font-size: 0.9rem;
    color: #a0a0a0;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }
`

const PreviewFeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  
  li {
    font-size: 0.85rem;
    color: #a0a0a0;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    
    &:before {
      content: '•';
      color: #58A4B0;
      font-weight: bold;
      margin-right: 0.5rem;
    }
  }
`

const PreviewNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: rgba(88, 164, 176, 0.1);
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.8rem;
  color: #58A4B0;
  
  svg {
    font-size: 1rem;
    margin-top: 0.1rem;
    flex-shrink: 0;
  }
`

const ThumbnailUploadArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ThumbnailUploadButton = styled.div`
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #58A4B0;
    background: rgba(88, 164, 176, 0.05);
  }
  
  label {
    color: #ffffff;
    font-size: 0.9rem;
  }
`

const ThumbnailPreview = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
  }
`

const RemoveThumbnailButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  
  &:hover {
    background: rgba(255, 255, 255, 1);
  }
  
  svg {
    font-size: 0.8rem;
  }
`

// Use Template Modal Styled Components
const UseTemplateModalContent = styled.div`
  background: linear-gradient(135deg, rgba(15, 15, 35, 0.95), rgba(30, 30, 60, 0.95));
  border-radius: 12px;
  width: 90vw;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const UseTemplateModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const TemplateImageContainer = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
`

const TemplateImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
`

const TemplateDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const TemplateName = styled.h2`
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
`

const UseModalDescription = styled.p`
  color: #a0a0a0;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`

const CreatorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`

const CreatorAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`

const CreatorDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const CreatorLabel = styled.span`
  color: #a0a0a0;
  font-size: 0.8rem;
`

const CreatorUsername = styled.span`
  color: #58A4B0;
  font-size: 0.9rem;
  font-weight: 500;
`

const UseTemplateActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`

const PreviewButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  svg {
    font-size: 1rem;
  }
`

const UseButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #58A4B0, #4A90A4);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4A90A4, #3C7A86);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

// Helper function for category colors
function getCategoryColor(category) {
  const colors = {
    MINIMAL: '#6B7280',
    PROFESSIONAL: '#3B82F6',
    CREATIVE: '#8B5CF6',
    GAMING: '#EF4444',
    MUSIC: '#F59E0B',
    BUSINESS: '#10B981',
    PERSONAL: '#EC4899',
    COMMUNITY: '#06B6D4',
    SEASONAL: '#F97316',
    OTHER: '#6B7280'
  }
  return colors[category] || colors.OTHER
}

export default TemplatesSection