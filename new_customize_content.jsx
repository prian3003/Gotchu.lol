// New content structure for CustomizationPage based on customizepage.png

{/* Assets Uploader Section */}
<SectionHeader>
  <h2>Assets Uploader</h2>
</SectionHeader>

<AssetsGrid>
  {/* Background Upload */}
  <AssetCard onClick={() => fileInputRefs.current.background?.click()}>
    <AssetIcon>
      <HiPhoto />
    </AssetIcon>
    <AssetLabel>Background</AssetLabel>
    <AssetDescription>
      {uploading.background ? 'Uploading...' : 'Click to upload a file'}
    </AssetDescription>
    <input
      ref={el => fileInputRefs.current.background = el}
      type="file"
      accept="image/*"
      onChange={(e) => handleFileUpload(e.target.files[0], 'background')}
      style={{ display: 'none' }}
    />
  </AssetCard>

  {/* Audio Upload */}
  <AssetCard onClick={() => fileInputRefs.current.audio?.click()}>
    <AssetIcon>
      <HiSpeakerWave />
    </AssetIcon>
    <AssetLabel>Audio</AssetLabel>
    <AssetDescription>
      {uploading.audio ? 'Uploading...' : 'Click to open audio manager'}
    </AssetDescription>
    <input
      ref={el => fileInputRefs.current.audio = el}
      type="file"
      accept="audio/*"
      onChange={(e) => handleFileUpload(e.target.files[0], 'audio')}
      style={{ display: 'none' }}
    />
  </AssetCard>

  {/* Profile Avatar Upload */}
  <AssetCard onClick={() => fileInputRefs.current.avatar?.click()}>
    <AssetIcon>
      <HiUser />
    </AssetIcon>
    <AssetLabel>Profile Avatar</AssetLabel>
    <AssetDescription>
      {uploading.avatar ? 'Uploading...' : 'Click to upload a file'}
    </AssetDescription>
    <input
      ref={el => fileInputRefs.current.avatar = el}
      type="file"
      accept="image/*"
      onChange={(e) => handleFileUpload(e.target.files[0], 'avatar')}
      style={{ display: 'none' }}
    />
  </AssetCard>

  {/* Custom Cursor Upload */}
  <AssetCard onClick={() => fileInputRefs.current.cursor?.click()}>
    <AssetIcon>
      <HiCursorArrowRays />
    </AssetIcon>
    <AssetLabel>Custom Cursor</AssetLabel>
    <AssetDescription>
      {uploading.cursor ? 'Uploading...' : 'Click to upload a file'}
    </AssetDescription>
    <input
      ref={el => fileInputRefs.current.cursor = el}
      type="file"
      accept="image/png,image/gif"
      onChange={(e) => handleFileUpload(e.target.files[0], 'cursor')}
      style={{ display: 'none' }}
    />
  </AssetCard>
</AssetsGrid>

{/* Premium Banner */}
<PremiumBanner>
  <HiStar />
  <span>Want exclusive features? Unlock more with 💎 Premium</span>
</PremiumBanner>

{/* General Customization Section */}
<SectionHeader>
  <h2>General Customization</h2>
</SectionHeader>

<CustomizationGrid>
  {/* Description */}
  <CustomizationCard>
    <CardLabel>Description</CardLabel>
    <CardIcon>
      <HiInformationCircle />
    </CardIcon>
    <CardInput>
      <input
        type="text"
        placeholder="deadassadas"
        value={settings.description || ''}
        onChange={(e) => updateSetting('description', e.target.value)}
      />
    </CardInput>
  </CustomizationCard>

  {/* Discord Presence */}
  <CustomizationCard>
    <CardLabel>Discord Presence</CardLabel>
    <CardIcon>
      <HiGlobeAlt />
    </CardIcon>
    <CardDescription>Click here to connect your Discord and unlock this feature.</CardDescription>
  </CustomizationCard>

  {/* Profile Opacity */}
  <CustomizationCard>
    <CardLabel>Profile Opacity</CardLabel>
    <OpacitySlider>
      <input
        type="range"
        min="0"
        max="100"
        value={settings.profileOpacity || 90}
        onChange={(e) => updateSetting('profileOpacity', parseInt(e.target.value))}
      />
      <OpacityIndicators>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </OpacityIndicators>
    </OpacitySlider>
  </CustomizationCard>

  {/* Profile Blur */}
  <CustomizationCard>
    <CardLabel>Profile Blur</CardLabel>
    <BlurSlider>
      <input
        type="range"
        min="0"
        max="20"
        value={settings.profileBlur || 0}
        onChange={(e) => updateSetting('profileBlur', parseInt(e.target.value))}
      />
      <BlurIndicators>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </BlurIndicators>
    </BlurSlider>
  </CustomizationCard>
</CustomizationGrid>

{/* Glow Settings */}
<GlowSettings>
  <GlowLabel>Glow Settings</GlowLabel>
  <GlowGrid>
    <GlowButton
      $active={settings.glowUsername}
      onClick={() => updateSetting('glowUsername', !settings.glowUsername)}
    >
      <HiSparkles />
      Username
    </GlowButton>
    <GlowButton
      $active={settings.glowSocials}
      onClick={() => updateSetting('glowSocials', !settings.glowSocials)}
    >
      <HiGlobeAlt />
      Socials
    </GlowButton>
    <GlowButton
      $active={settings.glowBadges}
      onClick={() => updateSetting('glowBadges', !settings.glowBadges)}
    >
      <HiShieldCheck />
      Badges
    </GlowButton>
  </GlowGrid>
</GlowSettings>

{/* Color Customization Section */}
<SectionHeader>
  <h2>Color Customization</h2>
</SectionHeader>

<ColorGrid>
  {/* Accent Color */}
  <ColorCard>
    <ColorLabel>Accent Color</ColorLabel>
    <ColorPicker>
      <ColorSwatch style={{ background: settings.accentColor || '#58A4B0' }} />
      <input
        type="color"
        value={settings.accentColor || '#58A4B0'}
        onChange={(e) => updateSetting('accentColor', e.target.value)}
      />
      <ColorCode>{settings.accentColor || '#58A4B0'}</ColorCode>
      <HiPencilSquare className="edit-icon" />
    </ColorPicker>
  </ColorCard>

  {/* Text Color */}
  <ColorCard>
    <ColorLabel>Text Color</ColorLabel>
    <ColorPicker>
      <ColorSwatch style={{ background: settings.textColor || '#ffffff' }} />
      <input
        type="color"
        value={settings.textColor || '#ffffff'}
        onChange={(e) => updateSetting('textColor', e.target.value)}
      />
      <ColorCode>{settings.textColor || '#ffffff'}</ColorCode>
      <HiPencilSquare className="edit-icon" />
    </ColorPicker>
  </ColorCard>

  {/* Background Color */}
  <ColorCard>
    <ColorLabel>Background Color</ColorLabel>
    <ColorPicker>
      <ColorSwatch style={{ background: settings.backgroundColor || '#0F0F23' }} />
      <input
        type="color"
        value={settings.backgroundColor || '#0F0F23'}
        onChange={(e) => updateSetting('backgroundColor', e.target.value)}
      />
      <ColorCode>{settings.backgroundColor || '#0F0F23'}</ColorCode>
      <HiPencilSquare className="edit-icon" />
    </ColorPicker>
  </ColorCard>

  {/* Icon Color */}
  <ColorCard>
    <ColorLabel>Icon Color</ColorLabel>
    <ColorPicker>
      <ColorSwatch style={{ background: settings.iconColor || '#ffffff' }} />
      <input
        type="color"
        value={settings.iconColor || '#ffffff'}
        onChange={(e) => updateSetting('iconColor', e.target.value)}
      />
      <ColorCode>{settings.iconColor || '#ffffff'}</ColorCode>
      <HiPencilSquare className="edit-icon" />
    </ColorPicker>
  </ColorCard>
</ColorGrid>

{/* Enable Profile Gradient */}
<GradientSection>
  <GradientButton
    $active={settings.profileGradient}
    onClick={() => updateSetting('profileGradient', !settings.profileGradient)}
  >
    Enable Profile Gradient
  </GradientButton>
</GradientSection>

{/* Other Customization Section */}
<SectionHeader>
  <h2>Other Customization</h2>
</SectionHeader>

<OtherGrid>
  {/* Monochrome Icons */}
  <OtherCard>
    <OtherLabel>
      Monochrome Icons
      <HiInformationCircle className="info-icon" />
    </OtherLabel>
    <ToggleSwitch
      $active={settings.monochromeIcons}
      onClick={() => updateSetting('monochromeIcons', !settings.monochromeIcons)}
    >
      <div className="slider" />
    </ToggleSwitch>
  </OtherCard>

  {/* Animated Title */}
  <OtherCard>
    <OtherLabel>Animated Title</OtherLabel>
    <ToggleSwitch
      $active={settings.enableAnimations}
      onClick={() => updateSetting('enableAnimations', !settings.enableAnimations)}
    >
      <div className="slider" />
    </ToggleSwitch>
  </OtherCard>

  {/* Swap Box Colors */}
  <OtherCard>
    <OtherLabel>
      Swap Box Colors
      <HiInformationCircle className="info-icon" />
    </OtherLabel>
    <ToggleSwitch
      $active={settings.swapBoxColors}
      onClick={() => updateSetting('swapBoxColors', !settings.swapBoxColors)}
    >
      <div className="slider" />
    </ToggleSwitch>
  </OtherCard>

  {/* Volume Control */}
  <OtherCard>
    <OtherLabel>Volume Control</OtherLabel>
    <ToggleSwitch
      $active={settings.volumeControl}
      onClick={() => updateSetting('volumeControl', !settings.volumeControl)}
    >
      <div className="slider" />
    </ToggleSwitch>
  </OtherCard>

  {/* Use Discord Avatar */}
  <OtherCard>
    <OtherLabel>Use Discord Avatar</OtherLabel>
    <ToggleSwitch
      $active={settings.useDiscordAvatar}
      onClick={() => updateSetting('useDiscordAvatar', !settings.useDiscordAvatar)}
    >
      <div className="slider" />
    </ToggleSwitch>
  </OtherCard>

  {/* Discord Avatar Decoration */}
  <OtherCard>
    <OtherLabel>Discord Avatar Decoration</OtherLabel>
    <ToggleSwitch
      $active={settings.discordAvatarDecoration}
      onClick={() => updateSetting('discordAvatarDecoration', !settings.discordAvatarDecoration)}
    >
      <div className="slider" />
    </ToggleSwitch>
  </OtherCard>
</OtherGrid>