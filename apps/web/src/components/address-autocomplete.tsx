'use client'

import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddressAutocompleteProps {
  id: string
  label?: string
  placeholder?: string
  defaultValue?: string
  value?: string
  className?: string
  onChange?: (address: string, placeId?: string) => void
}

export function AddressAutocomplete({
  id,
  label,
  placeholder = 'Digite um endereço',
  defaultValue = '',
  value,
  className,
  onChange,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [address, setAddress] = useState(defaultValue)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Carrega o script do Google Maps API
    const googleMapScript = document.createElement('script')
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    googleMapScript.async = true
    googleMapScript.defer = true
    window.document.body.appendChild(googleMapScript)

    googleMapScript.addEventListener('load', () => {
      setLoaded(true)
    })

    return () => {
      window.document.body.removeChild(googleMapScript)
    }
  }, [])

  useEffect(() => {
    if (!loaded || !inputRef.current) return

    // Use typed global from @types/google.maps
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        setAddress(place.formatted_address)
        onChange?.(place.formatted_address, place.place_id)
      }
    })

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete)
    }
  }, [loaded, onChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
    onChange?.(e.target.value)
  }

  return (
    <div className="space-y-1">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        ref={inputRef}
        id={id}
        value={value ?? address}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    </div>
  )
}
