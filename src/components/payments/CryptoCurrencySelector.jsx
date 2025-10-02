import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTheme } from '../../contexts/ThemeContext'
import { HiChevronDown, HiMagnifyingGlass } from 'react-icons/hi2'
import { FaSpinner } from 'react-icons/fa'

const CryptoCurrencySelector = ({ 
  selectedCurrency, 
  onCurrencySelect, 
  placeholder = "Select cryptocurrency",
  disabled = false 
}) => {
  const { colors } = useTheme()
  const [currencies, setCurrencies] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  // Popular cryptocurrencies to show at the top
  const popularCurrencies = ['btc', 'eth', 'usdt', 'usdc', 'ltc', 'doge', 'xmr']

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8080/api/payments/currencies', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success && data.data.currencies) {
        setCurrencies(data.data.currencies)
      } else {
        setError('Failed to load cryptocurrencies')
      }
    } catch (err) {
      setError('Network error loading currencies')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCurrencies = currencies.filter(currency =>
    currency.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort currencies: popular first, then alphabetical
  const sortedCurrencies = filteredCurrencies.sort((a, b) => {
    const aIsPopular = popularCurrencies.includes(a.toLowerCase())
    const bIsPopular = popularCurrencies.includes(b.toLowerCase())
    
    if (aIsPopular && !bIsPopular) return -1
    if (!aIsPopular && bIsPopular) return 1
    return a.localeCompare(b)
  })

  const getCurrencyName = (code) => {
    const names = {
      'btc': 'Bitcoin',
      'eth': 'Ethereum',
      'usdt': 'Tether',
      'usdc': 'USD Coin',
      'ltc': 'Litecoin',
      'doge': 'Dogecoin',
      'xmr': 'Monero',
      'bnb': 'Binance Coin',
      'ada': 'Cardano',
      'dot': 'Polkadot',
      'sol': 'Solana',
      'matic': 'Polygon',
      'avax': 'Avalanche',
      'atom': 'Cosmos',
      'xlm': 'Stellar'
    }
    return names[code.toLowerCase()] || code.toUpperCase()
  }

  const getCurrencyIcon = (code) => {
    // You can add crypto icons here or use a crypto icon library
    return `https://cryptoicons.org/api/icon/${code.toLowerCase()}/32`
  }

  const handleCurrencySelect = (currency) => {
    onCurrencySelect(currency)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <SelectorContainer>
      <SelectorButton 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        isOpen={isOpen}
      >
        {selectedCurrency ? (
          <SelectedCurrency>
            <CurrencyIcon 
              src={getCurrencyIcon(selectedCurrency)} 
              alt={selectedCurrency}
              onError={(e) => e.target.style.display = 'none'}
            />
            <CurrencyInfo>
              <CurrencyCode>{selectedCurrency.toUpperCase()}</CurrencyCode>
              <CurrencyName>{getCurrencyName(selectedCurrency)}</CurrencyName>
            </CurrencyInfo>
          </SelectedCurrency>
        ) : (
          <PlaceholderText>{placeholder}</PlaceholderText>
        )}
        <ChevronIcon isOpen={isOpen}>
          <HiChevronDown />
        </ChevronIcon>
      </SelectorButton>

      {isOpen && (
        <DropdownContainer>
          <SearchContainer>
            <SearchIcon>
              <HiMagnifyingGlass />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </SearchContainer>

          <CurrencyList>
            {isLoading ? (
              <LoadingItem>
                <FaSpinner className="animate-spin" />
                Loading currencies...
              </LoadingItem>
            ) : error ? (
              <ErrorItem>{error}</ErrorItem>
            ) : sortedCurrencies.length === 0 ? (
              <NoResultsItem>No cryptocurrencies found</NoResultsItem>
            ) : (
              sortedCurrencies.map((currency) => (
                <CurrencyItem
                  key={currency}
                  onClick={() => handleCurrencySelect(currency)}
                  isPopular={popularCurrencies.includes(currency.toLowerCase())}
                >
                  <CurrencyIcon 
                    src={getCurrencyIcon(currency)} 
                    alt={currency}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <CurrencyInfo>
                    <CurrencyCode>{currency.toUpperCase()}</CurrencyCode>
                    <CurrencyName>{getCurrencyName(currency)}</CurrencyName>
                  </CurrencyInfo>
                  {popularCurrencies.includes(currency.toLowerCase()) && (
                    <PopularBadge>Popular</PopularBadge>
                  )}
                </CurrencyItem>
              ))
            )}
          </CurrencyList>
        </DropdownContainer>
      )}
    </SelectorContainer>
  )
}

const SelectorContainer = styled.div`
  position: relative;
  width: 100%;
`

const SelectorButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  padding: 0.75rem;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #58A4B0;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  ${props => props.isOpen && `
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.1);
  `}
`

const SelectedCurrency = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const PlaceholderText = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
`

const ChevronIcon = styled.div`
  color: rgba(255, 255, 255, 0.6);
  transition: transform 0.2s ease;
  
  ${props => props.isOpen && `
    transform: rotate(180deg);
  `}
`

const CurrencyIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
`

const CurrencyInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
`

const CurrencyCode = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
  color: #ffffff;
`

const CurrencyName = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
`

const DropdownContainer = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(88, 164, 176, 0.3);
  border-radius: 12px;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`

const SearchContainer = styled.div`
  position: relative;
  padding: 0.75rem;
  border-bottom: 1px solid rgba(88, 164, 176, 0.2);
`

const SearchIcon = styled.div`
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
`

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(88, 164, 176, 0.2);
  border-radius: 8px;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  color: #ffffff;
  font-size: 0.9rem;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    border-color: #58A4B0;
    background: rgba(255, 255, 255, 0.1);
  }
`

const CurrencyList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(88, 164, 176, 0.4);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(88, 164, 176, 0.6);
  }
`

const CurrencyItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease;
  position: relative;
  
  &:hover {
    background: rgba(88, 164, 176, 0.1);
  }
  
  ${props => props.isPopular && `
    background: rgba(88, 164, 176, 0.05);
  `}
`

const PopularBadge = styled.span`
  background: #58A4B0;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: auto;
`

const LoadingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.6);
  justify-content: center;
`

const ErrorItem = styled.div`
  padding: 1rem;
  color: #ef4444;
  text-align: center;
  font-size: 0.9rem;
`

const NoResultsItem = styled.div`
  padding: 1rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  font-size: 0.9rem;
`

export default CryptoCurrencySelector