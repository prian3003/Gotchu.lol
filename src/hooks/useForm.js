import { useState, useCallback, useRef, useEffect } from 'react'
import logger from '../utils/logger'

// Form validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Built-in validators
export const validators = {
  required: (value) => {
    if (typeof value === 'string') {
      return value.trim() ? null : 'This field is required'
    }
    return value ? null : 'This field is required'
  },
  
  email: (value) => {
    if (!value) return null
    return isValidEmail(value) ? null : 'Please enter a valid email address'
  },
  
  url: (value) => {
    if (!value) return null
    return isValidUrl(value) ? null : 'Please enter a valid URL'
  },
  
  password: (value) => {
    if (!value) return null
    return isValidPassword(value) 
      ? null 
      : 'Password must be at least 8 characters with uppercase, lowercase, and number'
  },
  
  minLength: (min) => (value) => {
    if (!value) return null
    return value.length >= min ? null : `Must be at least ${min} characters`
  },
  
  maxLength: (max) => (value) => {
    if (!value) return null
    return value.length <= max ? null : `Must be no more than ${max} characters`
  },
  
  min: (minimum) => (value) => {
    if (value === '' || value === null || value === undefined) return null
    const num = Number(value)
    return num >= minimum ? null : `Must be at least ${minimum}`
  },
  
  max: (maximum) => (value) => {
    if (value === '' || value === null || value === undefined) return null
    const num = Number(value)
    return num <= maximum ? null : `Must be no more than ${maximum}`
  },
  
  pattern: (regex, message = 'Invalid format') => (value) => {
    if (!value) return null
    return regex.test(value) ? null : message
  },
  
  match: (fieldName, fieldValue) => (value) => {
    return value === fieldValue ? null : `Must match ${fieldName}`
  },
  
  custom: (validatorFn, message) => (value) => {
    try {
      const isValid = validatorFn(value)
      return isValid ? null : message
    } catch (error) {
      logger.error('Custom validator error', error)
      return 'Validation error'
    }
  }
}

// Main useForm hook
export const useForm = ({
  initialValues = {},
  validationSchema = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  resetOnSubmit = false,
  enableReinitialize = false
}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  const [isValid, setIsValid] = useState(true)
  
  const initialValuesRef = useRef(initialValues)
  const validationSchemaRef = useRef(validationSchema)
  
  // Update refs when props change
  useEffect(() => {
    initialValuesRef.current = initialValues
    validationSchemaRef.current = validationSchema
  }, [initialValues, validationSchema])
  
  // Reinitialize form when initialValues change
  useEffect(() => {
    if (enableReinitialize) {
      setValues(initialValues)
      setErrors({})
      setTouched({})
    }
  }, [initialValues, enableReinitialize])
  
  // Validate a single field
  const validateField = useCallback((fieldName, value, allValues = values) => {
    const fieldValidators = validationSchemaRef.current[fieldName]
    
    if (!fieldValidators) return null
    
    // Ensure fieldValidators is an array
    const validators = Array.isArray(fieldValidators) ? fieldValidators : [fieldValidators]
    
    for (const validator of validators) {
      const error = validator(value, allValues)
      if (error) return error
    }
    
    return null
  }, [values])
  
  // Validate all fields
  const validateForm = useCallback(async (valuesToValidate = values) => {
    setIsValidating(true)
    const newErrors = {}
    
    for (const fieldName in validationSchemaRef.current) {
      const error = validateField(fieldName, valuesToValidate[fieldName], valuesToValidate)
      if (error) {
        newErrors[fieldName] = error
      }
    }
    
    setErrors(newErrors)
    setIsValidating(false)
    
    const formIsValid = Object.keys(newErrors).length === 0
    setIsValid(formIsValid)
    
    return formIsValid
  }, [validateField, values])
  
  // Set field value
  const setValue = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    
    // Validate on change if enabled
    if (validateOnChange && touched[fieldName]) {
      const error = validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }, [validateOnChange, touched, validateField])
  
  // Set multiple values
  const setValues_ = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }))
    
    if (validateOnChange) {
      const newErrors = {}
      for (const fieldName in newValues) {
        if (touched[fieldName]) {
          const error = validateField(fieldName, newValues[fieldName], { ...values, ...newValues })
          newErrors[fieldName] = error
        }
      }
      setErrors(prev => ({ ...prev, ...newErrors }))
    }
  }, [validateOnChange, touched, validateField, values])
  
  // Set field error
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [])
  
  // Set multiple errors
  const setErrors_ = useCallback((newErrors) => {
    setErrors(prev => ({ ...prev, ...newErrors }))
  }, [])
  
  // Mark field as touched
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }))
  }, [])
  
  // Handle field change
  const handleChange = useCallback((fieldName) => (event) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value
    
    setValue(fieldName, value)
  }, [setValue])
  
  // Handle field blur
  const handleBlur = useCallback((fieldName) => (event) => {
    setFieldTouched(fieldName, true)
    
    // Validate on blur if enabled
    if (validateOnBlur) {
      const error = validateField(fieldName, values[fieldName])
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }, [validateOnBlur, validateField, values])
  
  // Get field props for easy integration with input components
  const getFieldProps = useCallback((fieldName) => ({
    value: values[fieldName] || '',
    onChange: handleChange(fieldName),
    onBlur: handleBlur(fieldName),
    error: touched[fieldName] ? errors[fieldName] : null
  }), [values, handleChange, handleBlur, touched, errors])
  
  // Handle form submission
  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault()
    }
    
    setIsSubmitting(true)
    setSubmitCount(prev => prev + 1)
    
    // Mark all fields as touched
    const allTouched = {}
    for (const fieldName in validationSchemaRef.current) {
      allTouched[fieldName] = true
    }
    setTouched(allTouched)
    
    try {
      // Validate form
      const isValid = await validateForm()
      
      if (isValid && onSubmit) {
        logger.userAction('form_submit', { 
          fields: Object.keys(values),
          submitCount: submitCount + 1
        })
        
        await onSubmit(values, {
          setFieldError,
          setErrors: setErrors_,
          setSubmitting: setIsSubmitting,
          resetForm
        })
        
        if (resetOnSubmit) {
          resetForm()
        }
      } else if (!isValid) {
        logger.userAction('form_submit_invalid', {
          errors: Object.keys(errors),
          submitCount: submitCount + 1
        })
      }
    } catch (error) {
      logger.error('Form submission error', error)
      setFieldError('_form', 'An error occurred while submitting the form')
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, onSubmit, values, setFieldError, setErrors_, submitCount, errors, resetOnSubmit])
  
  // Reset form
  const resetForm = useCallback((newValues = initialValuesRef.current) => {
    setValues(newValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setSubmitCount(0)
    setIsValid(true)
    
    logger.userAction('form_reset')
  }, [])
  
  // Check if form has been modified
  const isDirty = useCallback(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current)
  }, [values])
  
  // Get form state
  const formState = {
    values,
    errors,
    touched,
    isSubmitting,
    isValidating,
    isValid,
    submitCount,
    isDirty: isDirty()
  }
  
  // Form actions
  const formActions = {
    setValue,
    setValues: setValues_,
    setFieldError,
    setErrors: setErrors_,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateForm,
    resetForm,
    getFieldProps
  }
  
  return {
    ...formState,
    ...formActions
  }
}

// Hook for form arrays (dynamic fields)
export const useFieldArray = (form, fieldName) => {
  const fieldValue = form.values[fieldName] || []
  
  const append = useCallback((value) => {
    const newArray = [...fieldValue, value]
    form.setValue(fieldName, newArray)
  }, [fieldValue, form, fieldName])
  
  const remove = useCallback((index) => {
    const newArray = fieldValue.filter((_, i) => i !== index)
    form.setValue(fieldName, newArray)
    
    // Clean up errors for removed field
    const newErrors = { ...form.errors }
    delete newErrors[`${fieldName}.${index}`]
    form.setErrors(newErrors)
  }, [fieldValue, form, fieldName])
  
  const insert = useCallback((index, value) => {
    const newArray = [...fieldValue]
    newArray.splice(index, 0, value)
    form.setValue(fieldName, newArray)
  }, [fieldValue, form, fieldName])
  
  const move = useCallback((from, to) => {
    const newArray = [...fieldValue]
    const item = newArray.splice(from, 1)[0]
    newArray.splice(to, 0, item)
    form.setValue(fieldName, newArray)
  }, [fieldValue, form, fieldName])
  
  const replace = useCallback((index, value) => {
    const newArray = [...fieldValue]
    newArray[index] = value
    form.setValue(fieldName, newArray)
  }, [fieldValue, form, fieldName])
  
  const getFieldProps = useCallback((index, subFieldName) => {
    const fullFieldName = `${fieldName}.${index}.${subFieldName}`
    return {
      value: fieldValue[index]?.[subFieldName] || '',
      onChange: (event) => {
        const value = event.target.type === 'checkbox' 
          ? event.target.checked 
          : event.target.value
        
        const newArray = [...fieldValue]
        if (!newArray[index]) newArray[index] = {}
        newArray[index][subFieldName] = value
        form.setValue(fieldName, newArray)
      },
      onBlur: () => form.setFieldTouched(fullFieldName, true),
      error: form.touched[fullFieldName] ? form.errors[fullFieldName] : null
    }
  }, [fieldValue, fieldName, form])
  
  return {
    fields: fieldValue,
    append,
    remove,
    insert,
    move,
    replace,
    getFieldProps
  }
}

export default useForm