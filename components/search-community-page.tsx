"use client"

import { useState } from "react"
import { ChevronLeft, Search, MapPin, User } from "lucide-react"
import SignInModal from "./sign-in-modal"

const tabs = ["Schools", "Colleges", "Jobs", "Companies"]

export default function SearchCommunityPage() {
  const [activeTab, setActiveTab] = useState("Schools")
  const [searchQuery, setSearchQuery] = useState("")
  const [locationSearch, setLocationSearch] = useState("")
  const [isSignInOpen, setIsSignInOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Header */}
      <header className="flex items-center px-4 md:px-8 lg:px-16 py-3 md:py-5 max-w-6xl mx-auto w-full">
        <button className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="h-7 w-7 md:h-8 md:w-8 text-white" />
        </button>
        <h1 className="flex-1 text-center text-xl md:text-2xl lg:text-3xl font-semibold text-white">
          Search Community
        </h1>
        <button onClick={() => setIsSignInOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <User className="h-6 w-6 md:h-7 md:w-7 text-white" />
        </button>
      </header>

      {/* Search Container - Centered on desktop */}
      <div className="px-4 md:px-8 lg:px-16 mt-2 md:mt-6 max-w-3xl mx-auto w-full">
        {/* Search Inputs */}
        <div className="space-y-3 md:space-y-4">
          {/* Desktop: Side by side inputs */}
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-full px-4 md:px-6 py-3 md:py-4 flex-1 hover:bg-[#333] transition-colors">
              <Search className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Schools"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-base md:text-lg"
              />
            </div>

            <div className="flex items-center gap-3 bg-[#2a2a2a] rounded-full px-4 md:px-6 py-3 md:py-4 hover:bg-[#333] transition-colors">
              <MapPin className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search location..."
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-base md:text-lg"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex mt-6 md:mt-8 overflow-x-auto scrollbar-hide md:justify-center">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 md:px-6 lg:px-8 py-3 md:py-4 text-base md:text-lg font-medium whitespace-nowrap transition-colors hover:text-white ${
                activeTab === tab ? "text-white" : "text-gray-500"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-4 right-4 md:left-6 md:right-6 lg:left-8 lg:right-8 h-1 bg-[#0CAA41] rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 md:px-8 lg:px-16 py-6 md:py-10 max-w-6xl mx-auto w-full">
        <div className="hidden md:flex flex-col items-center justify-center h-64 text-gray-500">
          <Search className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">Search for schools, colleges, jobs, or companies</p>
        </div>
      </div>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </div>
  )
}
