import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { Icon } from '@iconify/react'
import ParticleBackground from '../effects/ParticleBackground'

const PremiumPage = () => {
  const { colors } = useTheme()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [openFAQ, setOpenFAQ] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const faqItems = [
    {
      question: "What is gotchu.lol Premium?",
      answer: "gotchu.lol Premium is our enhanced tier that unlocks exclusive features, advanced customization options, and premium effects to make your profile truly stand out."
    },
    {
      question: "Is this a one-time payment?",
      answer: "Yes! Pay once and keep Premium forever. No monthly subscriptions, no hidden fees. Your Premium access never expires."
    },
    {
      question: "Can I upgrade from Free to Premium anytime?",
      answer: "Absolutely! You can upgrade to Premium at any time and instantly access all premium features. Your existing profile data is preserved."
    },
    {
      question: "What happens to my profile if I don't upgrade?",
      answer: "Your free profile remains fully functional with all basic features. Premium just adds extra customization and exclusive effects on top."
    },
    {
      question: "Can I gift Premium to someone else?",
      answer: "Yes! Use the gift button on our Premium plans to purchase Premium access for friends, family, or anyone you'd like to surprise."
    }
  ]

  const premiumFeatures = [
    {
      icon: "mdi:shield-crown",
      title: "Exclusive Premium Badge",
      description: "Show off your Premium status with a special badge on your profile",
      color: "#8b5cf6"
    },
    {
      icon: "mdi:palette-advanced",
      title: "Advanced Customization",
      description: "Access to premium themes, layouts, and unlimited color options",
      color: "#06b6d4"
    },
    {
      icon: "mdi:auto-fix",
      title: "Special Effects",
      description: "Typewriter animations, cursor effects, and exclusive visual elements",
      color: "#f59e0b"
    },
    {
      icon: "mdi:search-web",
      title: "SEO & Metadata",
      description: "Customize meta tags, descriptions, and search engine optimization",
      color: "#10b981"
    },
    {
      icon: "mdi:web",
      title: "Custom Domains",
      description: "Use your own domain name for a professional appearance",
      color: "#ef4444"
    },
    {
      icon: "mdi:rocket-launch",
      title: "Priority Support",
      description: "Get faster response times and dedicated premium support",
      color: "#8b5cf6"
    }
  ]

  const comparisonFeatures = [
    { name: "Profile Creation", free: true, premium: true, icon: "mdi:check-circle" },
    { name: "Basic Customization", free: true, premium: true, icon: "mdi:check-circle" },
    { name: "Social Links", free: true, premium: true, icon: "mdi:check-circle" },
    { name: "Basic Analytics", free: true, premium: true, icon: "mdi:check-circle" },
    { name: "Premium Badge", free: false, premium: true, icon: "mdi:shield-crown" },
    { name: "Advanced Themes", free: false, premium: true, icon: "mdi:palette-advanced" },
    { name: "Custom Fonts", free: false, premium: true, icon: "mdi:format-font" },
    { name: "Typewriter Effects", free: false, premium: true, icon: "mdi:auto-fix" },
    { name: "Custom Domains", free: false, premium: true, icon: "mdi:web" },
    { name: "SEO Optimization", free: false, premium: true, icon: "mdi:search-web" },
    { name: "Priority Support", free: false, premium: true, icon: "mdi:heart-plus" },
    { name: "Advanced Analytics", free: false, premium: true, icon: "mdi:chart-line" }
  ]

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const handlePurchase = () => {
    if (isAuthenticated) {
      // Navigate to dashboard with premium modal open
      navigate('/dashboard', { state: { openPremiumModal: true } })
    } else {
      // Navigate to signup
      navigate('/signup')
    }
  }

  const handleGetStartedFree = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/signup')
    }
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 50%, ${colors.background} 100%)`,
      color: colors.text,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ParticleBackground />
      
      {/* Hero Section */}
      <div style={{
        padding: '120px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
        background: `radial-gradient(ellipse at center, ${colors.accent}08 0%, transparent 70%)`
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: `${colors.accent}20`,
            border: `1px solid ${colors.accent}40`,
            borderRadius: '50px',
            padding: '8px 16px',
            marginBottom: '32px',
            fontSize: '14px',
            color: colors.accent
          }}>
            <Icon icon="mdi:crown" style={{ fontSize: '18px' }} />
            Premium Plans
          </div>
          
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            margin: '0 0 24px 0',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.text})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.2'
          }}>
            Unlock Your Creative Potential
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: colors.muted,
            margin: '0 0 48px 0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6'
          }}>
            Transform your profile with premium features, exclusive effects, and unlimited customization options
          </p>

          {/* Pricing Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {/* Free Plan */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '20px',
              padding: '32px',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: `${colors.muted}20`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: colors.muted
                }}>
                  <Icon icon="mdi:account" style={{ fontSize: '30px' }} />
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  color: colors.text
                }}>Free</h3>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: colors.text,
                  margin: '0 0 8px 0'
                }}>
                  0€
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '400',
                    color: colors.muted
                  }}>/lifetime</span>
                </div>
                <p style={{
                  color: colors.muted,
                  margin: 0,
                  fontSize: '14px'
                }}>Perfect for getting started</p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                {['Basic Profile Creation', 'Social Links', 'Basic Customization', 'Community Access'].map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '12px 0'
                  }}>
                    <Icon icon="mdi:check-circle" style={{ 
                      fontSize: '20px', 
                      color: colors.accent 
                    }} />
                    <span style={{ 
                      color: colors.text,
                      fontSize: '14px'
                    }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleGetStartedFree}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'transparent',
                  border: `2px solid ${colors.border}`,
                  borderRadius: '12px',
                  color: colors.text,
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = colors.accent
                  e.target.style.background = `${colors.accent}10`
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = colors.border
                  e.target.style.background = 'transparent'
                }}
              >
                Get Started Free
              </button>
            </div>

            {/* Premium Plan */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.accent}15, ${colors.surface})`,
              border: `2px solid ${colors.accent}`,
              borderRadius: '20px',
              padding: '32px',
              position: 'relative',
              transform: 'scale(1.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: colors.accent,
                color: 'white',
                padding: '6px 20px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                Most Popular
              </div>

              <div style={{
                textAlign: 'center',
                marginBottom: '32px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: `${colors.accent}20`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: colors.accent
                }}>
                  <Icon icon="mdi:crown" style={{ fontSize: '30px' }} />
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  color: colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Icon icon="mdi:diamond" style={{ color: colors.accent }} />
                  Premium
                </h3>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: colors.text,
                  margin: '0 0 8px 0'
                }}>
                  6.99€
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '400',
                    color: colors.muted
                  }}>/lifetime</span>
                </div>
                <p style={{
                  color: colors.muted,
                  margin: 0,
                  fontSize: '14px'
                }}>Pay once, keep forever</p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                {['Everything in Free', 'Premium Badge', 'Advanced Themes', 'Custom Effects', 'Priority Support', 'SEO Features'].map((feature, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '12px 0'
                  }}>
                    <Icon icon="mdi:check-circle" style={{ 
                      fontSize: '20px', 
                      color: colors.accent 
                    }} />
                    <span style={{ 
                      color: colors.text,
                      fontSize: '14px'
                    }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={handlePurchase}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: colors.accent,
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = `0 8px 25px ${colors.accent}40`
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Purchase Now
                <Icon icon="mdi:arrow-right" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Features Grid */}
      <div style={{
        padding: '80px 24px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: colors.text
          }}>Premium Features</h2>
          <p style={{
            fontSize: '1.1rem',
            color: colors.muted,
            margin: '0 0 64px 0',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Unlock exclusive features designed to make your profile stand out from the crowd
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {premiumFeatures.map((feature, index) => (
              <div key={index} style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = feature.color
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: `${feature.color}20`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  color: feature.color
                }}>
                  <Icon icon={feature.icon} style={{ fontSize: '24px' }} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: colors.text
                }}>{feature.title}</h3>
                <p style={{
                  color: colors.muted,
                  margin: 0,
                  lineHeight: '1.6'
                }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{
        padding: '80px 24px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: colors.text,
            textAlign: 'center'
          }}>Frequently Asked Questions</h2>
          <p style={{
            fontSize: '1.1rem',
            color: colors.muted,
            margin: '0 0 48px 0',
            textAlign: 'center'
          }}>
            Everything you need to know about gotchu.lol Premium
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {faqItems.map((item, index) => (
              <div key={index} style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}>
                <button
                  onClick={() => toggleFAQ(index)}
                  style={{
                    width: '100%',
                    padding: '28px',
                    background: 'transparent',
                    border: 'none',
                    color: colors.text,
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = `${colors.accent}08`
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                  }}
                >
                  <span>{item.question}</span>
                  <Icon 
                    icon={openFAQ === index ? "mdi:chevron-up" : "mdi:chevron-down"} 
                    style={{ 
                      fontSize: '24px',
                      color: colors.accent,
                      transition: 'transform 0.3s ease'
                    }} 
                  />
                </button>
                {openFAQ === index && (
                  <div style={{
                    padding: '0 28px 28px',
                    color: colors.muted,
                    lineHeight: '1.7',
                    fontSize: '1rem',
                    borderTop: `1px solid ${colors.border}`,
                    animation: 'fadeInDown 0.3s ease-out',
                    backgroundColor: `${colors.accent}02`
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        padding: '80px 24px',
        textAlign: 'center',
        background: `radial-gradient(ellipse at center, ${colors.accent}08 0%, transparent 70%)`,
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: colors.text
          }}>Ready to Get Started?</h2>
          <p style={{
            fontSize: '1.1rem',
            color: colors.muted,
            margin: '0 0 32px 0'
          }}>
            Join thousands of users creating amazing profiles with gotchu.lol
          </p>
          <button 
            onClick={handlePurchase}
            style={{
              background: colors.accent,
              border: 'none',
              borderRadius: '12px',
              padding: '18px 36px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: `0 6px 20px ${colors.accent}30`
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)'
              e.target.style.boxShadow = `0 10px 30px ${colors.accent}40`
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = `0 6px 20px ${colors.accent}30`
            }}
          >
            Get Started Now
            <Icon icon="mdi:rocket-launch" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default PremiumPage