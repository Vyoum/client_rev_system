"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, MapPin, User } from "lucide-react"
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
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const locationRef = useRef<HTMLDivElement>(null)

  const filteredStates = useMemo(() => {
    const query = locationQuery.trim().toLowerCase()
    if (!query) return INDIA_LOCATIONS

    return INDIA_LOCATIONS.filter((entry) => {
      if (entry.state.toLowerCase().includes(query)) return true
      return entry.cities.some((city) => city.toLowerCase().includes(query))
    })
  }, [locationQuery])

  const selectedStateData = useMemo(() => {
    if (!selectedState) return null
    return INDIA_LOCATIONS.find((entry) => entry.state === selectedState) ?? null
  }, [selectedState])

  const filteredCities = useMemo(() => {
    if (!selectedStateData) return []
    const query = locationQuery.trim().toLowerCase()
    if (!query || selectedStateData.state.toLowerCase().includes(query)) {
      return selectedStateData.cities
    }
    return selectedStateData.cities.filter((city) => city.toLowerCase().includes(query))
  }, [locationQuery, selectedStateData])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!locationRef.current) return
      if (!locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false)
        setLocationQuery("")
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
            <div className="flex items-center gap-3 h-12 md:h-14 rounded-full px-5 md:px-6 border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              <Search className="h-5 w-5 text-[#9AA0A6]" />
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
              className="relative flex items-center gap-3 h-12 md:h-14 rounded-full px-5 md:px-6 border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
            >
              <MapPin className="h-5 w-5 text-[#9AA0A6]" />
              <input
                type="text"
                placeholder="All locations"
                value={isLocationOpen ? locationQuery : locationValue}
                onChange={(e) => {
                  setLocationQuery(e.target.value)
                  setIsLocationOpen(true)
                }}
                onFocus={() => {
                  setIsLocationOpen(true)
                  setLocationQuery("")
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
                <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl border border-[#2F353A] bg-[#23282D] p-4 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#9AA0A6] mb-2">States</p>
                      <div className="max-h-60 overflow-y-auto pr-1 space-y-1">
                        {filteredStates.length > 0 ? (
                          filteredStates.map((entry) => (
                            <button
                              key={entry.state}
                              type="button"
                              onClick={() => {
                                setSelectedState(entry.state)
                                setLocationValue(entry.state)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedState === entry.state
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

                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#9AA0A6] mb-2">
                        {selectedStateData ? `Cities in ${selectedStateData.state}` : "Cities"}
                      </p>
                      <div className="max-h-60 overflow-y-auto pr-1 space-y-1">
                        {selectedStateData ? (
                          filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => {
                                  setLocationValue(`${city}, ${selectedStateData.state}`)
                                  setSelectedState(selectedStateData.state)
                                  setIsLocationOpen(false)
                                  setLocationQuery("")
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#C2C7CC] hover:bg-[#2B3136] transition-colors"
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
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </div>
  )
}
