import React from 'react'
import OxaPayModal from '../payments/OxaPayModal'

const PremiumModal = ({ isOpen, onClose }) => {
  // Simply use the OxaPayModal which has all the payment functionality
  return <OxaPayModal isOpen={isOpen} onClose={onClose} />
}

export default PremiumModal