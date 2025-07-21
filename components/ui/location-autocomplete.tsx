"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MapPin, Loader2 } from "lucide-react"

interface LocationSuggestion {
  id: string
  display_name: string
  city?: string
  country?: string
  coordinates: {
    lat: number
    lng: number
  }
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onLocationSelect?: (location: LocationSuggestion) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter location...",
  disabled = false,
  className = ""
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)



  useEffect(() => {
    const fetchLocationSuggestions = async (query: string) => {
      if (query.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/geocode?text=${encodeURIComponent(query)}`)
        const data = await response.json()
        
        if (response.ok) {
          setSuggestions(data.suggestions || [])
          setShowSuggestions(true)
          setSelectedIndex(-1)
        } else {
          console.error('Geocoding error:', data.error)
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
      }
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(value)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.display_name)
    onLocationSelect?.(suggestion)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 150)
  }

  const handleFocus = () => {
    if (suggestions.length > 0 && value.length >= 2) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-9 pr-9 ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-gray-800 border-gray-700 shadow-xl">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              ref={el => { suggestionRefs.current[index] = el }}
              className={`p-3 cursor-pointer border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition-colors ${
                index === selectedIndex ? 'bg-blue-600 hover:bg-blue-600' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {suggestion.display_name}
                  </div>
                  {(suggestion.city || suggestion.country) && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {[suggestion.city, suggestion.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
} 