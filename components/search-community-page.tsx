"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { User } from "lucide-react"
import { INDIA_LOCATIONS } from "../data/india-locations"
import SignInModal from "./sign-in-modal"

const tabs = ["Schools", "Colleges", "Jobs", "Companies"]

export default function SearchCommunityPage() {
  const [activeTab, setActiveTab] = useState("Schools")
  const [searchQuery, setSearchQuery] = useState("")
  const [locationValue, setLocationValue] = useState("")
  const [locationQuery, setLocationQuery] = useState("")
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [previewState, setPreviewState] = useState<string | null>(null)
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [supportsHover, setSupportsHover] = useState(false)
  const locationRef = useRef<HTMLDivElement>(null)
  const citiesRef = useRef<HTMLDivElement>(null)
  const lastStateTapRef = useRef<{ state: string | null; time: number }>({ state: null, time: 0 })

  const filteredStates = useMemo(() => {
    const query = locationQuery.trim().toLowerCase()
    if (!query) return INDIA_LOCATIONS

    return INDIA_LOCATIONS.filter((entry) => {
      if (entry.state.toLowerCase().includes(query)) return true
      return entry.cities.some((city) => city.toLowerCase().includes(query))
    })
  }, [locationQuery])

  const activeState = hoveredState ?? previewState ?? selectedState
  const highlightState = previewState ?? selectedState

  const activeStateData = useMemo(() => {
    if (!activeState) return null
    return INDIA_LOCATIONS.find((entry) => entry.state === activeState) ?? null
  }, [activeState])

  const filteredCities = useMemo(() => {
    if (!activeStateData) return []
    const query = locationQuery.trim().toLowerCase()
    if (!query || activeStateData.state.toLowerCase().includes(query)) {
      return activeStateData.cities
    }
    return activeStateData.cities.filter((city) => city.toLowerCase().includes(query))
  }, [locationQuery, activeStateData])

  const handleStateSelect = (state: string) => {
    setSelectedState(state)
    setSelectedCity(null)
    setPreviewState(null)
    setLocationValue(state)
    setLocationQuery("")
    setHoveredState(null)
    setIsLocationOpen(false)
  }

  const handleStatePreview = (state: string) => {
    setSelectedCity(null)
    setPreviewState(state)
    setLocationQuery("")
    setHoveredState(null)
    setIsLocationOpen(true)
    requestAnimationFrame(() => {
      citiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const handleStateClick = (state: string) => {
    if (supportsHover) {
      handleStateSelect(state)
      return
    }
    const now = Date.now()
    const lastTap = lastStateTapRef.current
    if (lastTap.state === state && now - lastTap.time < 350) {
      handleStateSelect(state)
      lastStateTapRef.current = { state: null, time: 0 }
      return
    }
    lastStateTapRef.current = { state, time: now }
    handleStatePreview(state)
  }

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)")
    const handleChange = () => setSupportsHover(media.matches)
    handleChange()
    if (media.addEventListener) {
      media.addEventListener("change", handleChange)
    } else {
      media.addListener(handleChange)
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange)
      } else {
        media.removeListener(handleChange)
      }
    }
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!locationRef.current) return
      if (!locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false)
        setLocationQuery("")
        setHoveredState(null)
        setPreviewState(null)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#E6E8EA] flex flex-col">
      {/* Header */}
      <header className="relative flex items-center justify-center px-4 sm:px-5 pt-8 pb-4 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full">
        <h1 className="text-2xl font-semibold">Search</h1>
        <button
          type="button"
          onClick={() => setIsSignInOpen(true)}
          className="absolute right-2 top-8 p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Open profile"
        >
          <User className="h-6 w-6 text-[#E6E8EA]" />
        </button>
      </header>

      {/* Search Container - Centered on desktop */}
      <div className="px-4 sm:px-5 mt-2 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full">
        {/* Search Inputs */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-3 h-12 md:h-14 rounded-full px-5 md:px-6 border border-white/25 bg-[rgba(255,255,255,0.12)] backdrop-blur-2xl ring-1 ring-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[rgba(255,255,255,0.16)]"
              style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
            >
              <CuteSearchIcon />
              <input
                type="text"
                placeholder={activeTab}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[#E6E8EA] placeholder-[#9AA0A6] outline-none text-[15px]"
              />
            </div>

            <div
              ref={locationRef}
              className="relative z-30 flex items-center gap-3 h-12 md:h-14 rounded-full px-5 md:px-6 border border-white/25 bg-[rgba(255,255,255,0.12)] backdrop-blur-2xl ring-1 ring-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition-colors hover:bg-[rgba(255,255,255,0.16)]"
              style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
            >
              <CuteLocationIcon />
              <input
                type="text"
                placeholder="All locations"
                value={isLocationOpen && locationQuery ? locationQuery : locationValue}
                onChange={(e) => {
                  setLocationQuery(e.target.value)
                  setIsLocationOpen(true)
                }}
                onFocus={() => {
                  setIsLocationOpen(true)
                  setLocationQuery("")
                  setHoveredState(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsLocationOpen(false)
                    setLocationQuery("")
                    e.currentTarget.blur()
                  }
                }}
                className="flex-1 bg-transparent text-[#E6E8EA] placeholder-[#9AA0A6] outline-none text-[15px]"
              />

              {isLocationOpen && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-[#2F353A] bg-[#23282D] p-4 shadow-2xl"
                  style={{ opacity: 1, backgroundColor: '#23282D' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#9AA0A6] mb-2">States</p>
                      <div className="max-h-60 overflow-y-auto pr-1 space-y-1">
                        {filteredStates.length > 0 ? (
                          filteredStates.map((entry) => (
                            <button
                              key={entry.state}
                              type="button"
                              onMouseEnter={() => {
                                if (supportsHover) setHoveredState(entry.state)
                              }}
                              onClick={() => handleStateClick(entry.state)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                highlightState === entry.state
                                  ? "bg-[#0CAA41]/20 text-[#E6E8EA]"
                                  : "text-[#C2C7CC] hover:bg-[#2B3136]"
                              }`}
                            >
                              {entry.state}
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-[#9AA0A6] px-3 py-2">No states found.</p>
                        )}
                      </div>
                    </div>

                    <div ref={citiesRef}>
                      <p className="text-xs uppercase tracking-wide text-[#9AA0A6] mb-2">
                        {activeStateData ? `Cities in ${activeStateData.state}` : "Cities"}
                      </p>
                      <div className="max-h-60 overflow-y-auto pr-1 space-y-1">
                        {activeStateData ? (
                          filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => {
                                  setLocationValue(`${city}, ${activeStateData.state}`)
                                  setSelectedState(activeStateData.state)
                                  setSelectedCity(city)
                                  setPreviewState(null)
                                  setHoveredState(null)
                                  setIsLocationOpen(false)
                                  setLocationQuery("")
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  selectedCity === city && selectedState === activeStateData.state
                                    ? "bg-[#0CAA41]/20 text-[#E6E8EA]"
                                    : "text-[#C2C7CC] hover:bg-[#2B3136]"
                                }`}
                              >
                                {city}
                              </button>
                            ))
                          ) : (
                            <p className="text-sm text-[#9AA0A6] px-3 py-2">No cities found.</p>
                          )
                        ) : (
                          <p className="text-sm text-[#9AA0A6] px-3 py-2">Select a state to view cities.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="mt-6 border-b border-[#2A2F33]">
          <div className="flex items-end justify-between gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-[15px] whitespace-nowrap transition-colors ${
                  activeTab === tab ? "text-[#E6E8EA] font-semibold" : "text-[#8F959B] font-medium"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute left-0 right-0 -bottom-px h-1 bg-[#0CAA41]" />
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-5 sm:px-6 py-6 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full" />
      
      {/* Backdrop overlay for location dropdown - covers entire viewport */}
      {isLocationOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20"
          onClick={() => {
            setIsLocationOpen(false)
            setLocationQuery("")
          }}
        />
      )}
      
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </div>
  )
}

function CuteSearchIcon() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
      <svg className="h-4 w-4 text-[#C7CCD1]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15.3 15.3L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8.5" cy="8.5" r="1" fill="currentColor" opacity="0.6" />
      </svg>
    </span>
  )
}

function CuteLocationIcon() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
      <svg className="h-4 w-4 text-[#C7CCD1]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21C12 21 17 16.5 17 10.5C17 7.5 14.76 5 12 5C9.24 5 7 7.5 7 10.5C7 16.5 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10.5" r="2" fill="currentColor" opacity="0.6" />
      </svg>
    </span>
  )
}
