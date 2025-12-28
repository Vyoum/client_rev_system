"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ExternalLink, User } from "lucide-react"
import { INDIA_LOCATIONS } from "../data/india-locations"
import SignInModal from "./sign-in-modal"
import { collection, query, onSnapshot, Timestamp, addDoc, serverTimestamp, where, orderBy } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

const tabs = ["Feed", "School", "Colleges", "Kindergarden"]
const detailTabs = [
  { id: "about", label: "About" },
  { id: "reviews", label: "Reviews" },
] as const

type ListingItem = {
  id: string
  name: string
  location: string
  state?: string
  city?: string
  status: "Draft" | "Published"
  description: string
  updatedAt: string | Timestamp
  rating?: number | null
  jobsCount?: number | null
  reviewsCount?: number | null
  salariesCount?: number | null
  logoUrl?: string
  website?: string
  employeeCount?: string
  type?: string
  revenue?: string
  founded?: string
  industry?: string
  locationsCount?: number | null
}

type ReviewItem = {
  id: string
  listingId: string
  authorName: string
  authorId?: string
  rating: number
  message: string
  createdAt: Timestamp | string
  updatedAt?: Timestamp | string
}

const getCollectionName = (tab: string): string => {
  const tabMap: Record<string, string> = {
    Feed: "feed",
    School: "school",
    Colleges: "colleges",
    Kindergarden: "kindergarden",
  }
  return tabMap[tab] || "feed"
}

export default function SearchCommunityPage() {
  const [activeTab, setActiveTab] = useState("Feed")
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
  const [listings, setListings] = useState<ListingItem[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null)
  const [detailTab, setDetailTab] = useState<(typeof detailTabs)[number]["id"]>("about")
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, message: "" })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const locationRef = useRef<HTMLDivElement>(null)
  const citiesRef = useRef<HTMLDivElement>(null)

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
    setSelectedState(state)
    setSelectedCity(null)
    setPreviewState(state)
    setLocationValue(state)
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
    handleStatePreview(state)
  }

  const handleOpenListing = (listing: ListingItem) => {
    setSelectedListing(listing)
    setDetailTab("about")
    setIsLocationOpen(false)
    setLocationQuery("")
  }

  const handleCloseListing = () => {
    setSelectedListing(null)
    setReviews([])
    setReviewForm({ rating: 5, message: "" })
    setReviewError(null)
  }

  // Load reviews for selected listing
  useEffect(() => {
    if (!selectedListing) {
      setReviews([])
      return
    }

    setReviewsLoading(true)
    const reviewsRef = collection(db, "reviews")
    const reviewsQuery = query(
      reviewsRef,
      where("listingId", "==", selectedListing.id),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const nextReviews = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            listingId: data.listingId || "",
            authorName: data.authorName || "Anonymous",
            authorId: data.authorId || "",
            rating: data.rating || 0,
            message: data.message || "",
            createdAt: data.createdAt || serverTimestamp(),
            updatedAt: data.updatedAt,
          }
        })
        setReviews(nextReviews)
        setReviewsLoading(false)
      },
      (error) => {
        console.error("Error loading reviews:", error)
        setReviews([])
        setReviewsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [selectedListing])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedListing) return

    const trimmedMessage = reviewForm.message.trim()
    if (!trimmedMessage) {
      setReviewError("Please enter a review message.")
      return
    }

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewError("Rating must be between 1 and 5.")
      return
    }

    setIsSubmittingReview(true)
    setReviewError(null)

    try {
      const currentUser = auth.currentUser
      const reviewData = {
        listingId: selectedListing.id,
        authorName: currentUser?.displayName || "Anonymous",
        authorId: currentUser?.uid || "",
        rating: reviewForm.rating,
        message: trimmedMessage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, "reviews"), reviewData)
      
      // Reset form
      setReviewForm({ rating: 5, message: "" })
      setReviewError(null)
    } catch (error) {
      console.error("Error submitting review:", error)
      setReviewError("Failed to submit review. Please try again.")
    } finally {
      setIsSubmittingReview(false)
    }
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

  // Load listings from Firestore based on active tab
  useEffect(() => {
    const collectionName = getCollectionName(activeTab)
    setListingsLoading(true)

    const listingsRef = collection(db, collectionName)
    // Use simple query and sort client-side to avoid index requirements
    // For production, create a composite index: (status, updatedAt) in Firestore console
    const listingsQuery = query(listingsRef)

    const unsubscribe = onSnapshot(
      listingsQuery,
      (snapshot) => {
        const nextListings = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              name: data.name || "",
              location: data.location || "",
              state: data.state || "",
              city: data.city || "",
              status: data.status || "Draft",
              description: data.description || "",
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toLocaleString() : new Date().toLocaleString(),
              rating: parseNumber(data.rating),
              jobsCount: parseNumber(data.jobsCount ?? data.jobs),
              reviewsCount: parseNumber(data.reviewsCount ?? data.reviews),
              salariesCount: parseNumber(data.salariesCount ?? data.salaries),
              logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : "",
              website: typeof data.website === "string" ? data.website : "",
              employeeCount: data.employeeCount != null ? String(data.employeeCount) : "",
              type: typeof data.type === "string" ? data.type : "",
              revenue: typeof data.revenue === "string" ? data.revenue : "",
              founded: data.founded != null ? String(data.founded) : "",
              industry: typeof data.industry === "string" ? data.industry : "",
              locationsCount: parseNumber(data.locationsCount ?? data.locations),
            }
          })
          .filter((listing) => listing.status === "Published") // Filter published listings client-side
          .sort((a, b) => {
            // Sort by updatedAt (newest first)
            const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
            const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
            return bTime - aTime
          })
        setListings(nextListings)
        setListingsLoading(false)
      },
      (error) => {
        console.error("Error loading listings:", error)
        setListings([])
        setListingsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [activeTab])

  // Filter listings based on search query and location
  const filteredListings = useMemo(() => {
    let filtered = listings

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(
        (listing) =>
          listing.name.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.location.toLowerCase().includes(query)
      )
    }

    // Filter by location
    if (selectedCity && selectedState) {
      filtered = filtered.filter(
        (listing) =>
          (listing.city?.toLowerCase() === selectedCity.toLowerCase() &&
            listing.state?.toLowerCase() === selectedState.toLowerCase()) ||
          listing.location.toLowerCase().includes(selectedCity.toLowerCase())
      )
    } else if (selectedState) {
      filtered = filtered.filter(
        (listing) =>
          listing.state?.toLowerCase() === selectedState.toLowerCase() ||
          listing.location.toLowerCase().includes(selectedState.toLowerCase())
      )
    }

    return filtered
  }, [listings, searchQuery, selectedState, selectedCity])

  const detailLocation = selectedListing ? getListingLocation(selectedListing) : ""
  const aboutLines = selectedListing
    ? [
        selectedListing.employeeCount ? `${selectedListing.employeeCount} Employees` : null,
        selectedListing.type ? `Type: ${selectedListing.type}` : null,
        selectedListing.revenue ? `Revenue: ${selectedListing.revenue}` : null,
        detailLocation || null,
        typeof selectedListing.locationsCount === "number"
          ? `${formatCount(selectedListing.locationsCount)} Locations`
          : null,
        selectedListing.founded ? `Founded in ${selectedListing.founded}` : null,
        selectedListing.industry || null,
      ].filter((line): line is string => Boolean(line))
    : []

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col">
      {/* Header */}
      <header className="relative flex items-center justify-center px-4 sm:px-5 pt-8 pb-4 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full">
        {selectedListing ? (
          <>
            <button
              type="button"
              onClick={handleCloseListing}
              className="absolute left-2 top-8 flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] transition-colors"
              aria-label="Back to results"
            >
              <ChevronLeft className="h-5 w-5 text-[#111827]" />
            </button>
            <button
              type="button"
              onClick={() => setIsSignInOpen(true)}
              className="absolute right-2 top-8 p-2 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Open profile"
            >
              <User className="h-6 w-6 text-[#111827]" />
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Search</h1>
            <button
              type="button"
              onClick={() => setIsSignInOpen(true)}
              className="absolute right-2 top-8 p-2 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Open profile"
            >
              <User className="h-6 w-6 text-[#111827]" />
            </button>
          </>
        )}
      </header>

      {selectedListing ? (
        <div className="px-4 sm:px-5 mt-2 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full pb-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {selectedListing.logoUrl ? (
                <img
                  src={selectedListing.logoUrl}
                  alt={selectedListing.name}
                  className="h-14 w-14 rounded-full border border-[#E5E7EB] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#111827]">
                  {getInitials(selectedListing.name)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-[#111827]">{selectedListing.name}</h2>
                {typeof selectedListing.rating === "number" && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-[#111827]">
                    <span>{selectedListing.rating.toFixed(1)}</span>
                    <StarIcon />
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="rounded-full border border-[#D1D5DB] px-5 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F3F4F6] transition-colors"
            >
              Follow
            </button>
          </div>

          <nav className="mt-6 border-b border-[#E5E7EB]">
            <div className="flex items-end gap-8">
              {detailTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id)}
                  className={`relative pb-3 text-[15px] font-semibold transition-colors ${
                    detailTab === tab.id ? "text-[#111827]" : "text-[#6B7280]"
                  }`}
                >
                  {tab.label}
                  {detailTab === tab.id && (
                    <div className="absolute left-0 right-0 -bottom-px h-1 bg-[#0CAA41]" />
                  )}
                </button>
              ))}
            </div>
          </nav>

          {detailTab === "about" ? (
            <div className="mt-5 space-y-4">
              {selectedListing.website && (
                <a
                  href={normalizeUrl(selectedListing.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0CAA41] hover:text-[#0B8A35]"
                >
                  {selectedListing.website}
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {aboutLines.length > 0 ? (
                <div className="space-y-2 text-sm text-[#111827]">
                  {aboutLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6B7280]">No details available yet.</p>
              )}

              {selectedListing.description && (
                <p className="text-sm text-[#4B5563]">{selectedListing.description}</p>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-[#6B7280]">
                {typeof selectedListing.reviewsCount === "number"
                  ? `${formatCount(selectedListing.reviewsCount)} reviews`
                  : "No reviews yet."}
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#0CAA41] px-5 py-2 text-sm font-semibold text-[#0CAA41] hover:bg-[#0CAA41]/10 transition-colors"
              >
                Add review
                <span className="text-lg leading-none">+</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Search Container - Centered on desktop */}
      <div className="px-4 sm:px-5 mt-2 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full">
        {/* Search Inputs */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center gap-3 h-12 md:h-14 rounded-full px-5 md:px-6 border border-[#E5E7EB] bg-[rgba(255,255,255,0.82)] backdrop-blur-xl ring-1 ring-black/5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-colors hover:bg-white"
              style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            >
              <CuteSearchIcon />
              <input
                type="text"
                placeholder={activeTab}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-[#111827] placeholder-[#6B7280] outline-none text-[15px]"
              />
            </div>

            <div
              ref={locationRef}
              className="relative z-30 flex items-center gap-3 h-12 md:h-14 rounded-full px-5 md:px-6 border border-[#E5E7EB] bg-[rgba(255,255,255,0.82)] backdrop-blur-xl ring-1 ring-black/5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-colors hover:bg-white"
              style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
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
                className="flex-1 bg-transparent text-[#111827] placeholder-[#6B7280] outline-none text-[15px]"
              />

              {isLocationOpen && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-orange-300 bg-orange-50 p-4 shadow-[0_20px_60px_rgba(249,115,22,0.25)]"
                  style={{ opacity: 1, backgroundColor: "#FFF7ED" }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-orange-700 mb-2">States</p>
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
                                  ? "bg-orange-200 text-orange-900"
                                  : "text-orange-800 hover:bg-orange-100"
                              }`}
                            >
                              {entry.state}
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-orange-600 px-3 py-2">No states found.</p>
                        )}
                      </div>
                    </div>

                    <div ref={citiesRef}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase tracking-wide text-orange-700">
                          {activeStateData ? `Cities in ${activeStateData.state}` : "Cities"}
                        </p>
                        {activeStateData && (
                          <button
                            type="button"
                            onClick={() => handleStateSelect(activeStateData.state)}
                            className="rounded-full border border-orange-300 bg-orange-100 px-3 py-1 text-[11px] font-medium text-orange-800 hover:bg-orange-200 transition-colors"
                          >
                            Use state only
                          </button>
                        )}
                      </div>
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
                                    ? "bg-orange-200 text-orange-900"
                                    : "text-orange-800 hover:bg-orange-100"
                                }`}
                              >
                                {city}
                              </button>
                            ))
                          ) : (
                            <p className="text-sm text-orange-600 px-3 py-2">No cities found.</p>
                          )
                        ) : (
                          <p className="text-sm text-orange-600 px-3 py-2">Select a state to view cities.</p>
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
        <nav className="mt-6 border-b border-[#E5E7EB]">
          <div className="flex items-end justify-between gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 text-[15px] whitespace-nowrap transition-colors ${
                  activeTab === tab ? "text-[#111827] font-semibold" : "text-[#6B7280] font-medium"
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
      <div className="flex-1 px-5 sm:px-6 py-6 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full">
        {listingsLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-[#6B7280]">Loading {activeTab.toLowerCase()}...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-[#111827] mb-2">
              {searchQuery || selectedState || selectedCity
                ? `No ${activeTab.toLowerCase()} found matching your search`
                : `No ${activeTab.toLowerCase()} available yet`}
            </p>
            <p className="text-sm text-[#6B7280]">
              {searchQuery || selectedState || selectedCity
                ? "Try adjusting your search or location filters"
                : "Check back soon for new listings"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Found {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
            </p>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white">
              <ul className="divide-y divide-[#E5E7EB]">
                {filteredListings.map((listing) => {
                  const metaParts: string[] = []
                  if (typeof listing.jobsCount === "number") {
                    metaParts.push(`${formatCount(listing.jobsCount)} jobs`)
                  }
                  if (typeof listing.reviewsCount === "number") {
                    metaParts.push(`${formatCount(listing.reviewsCount)} reviews`)
                  }
                  if (typeof listing.salariesCount === "number") {
                    metaParts.push(`${formatCount(listing.salariesCount)} salaries`)
                  }
                  const metaLine = metaParts.length > 0 ? metaParts.join(" | ") : listing.location || "Location not specified"
                  const showDescription = !metaParts.length && listing.description

                  return (
                    <li key={listing.id}>
                      <button
                        type="button"
                        onClick={() => handleOpenListing(listing)}
                        className="flex w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F9FAFB]"
                      >
                        {listing.logoUrl ? (
                          <img
                            src={listing.logoUrl}
                            alt={listing.name}
                            className="h-12 w-12 rounded-full border border-[#E5E7EB] object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F3F4F6] text-sm font-semibold text-[#111827]">
                            {getInitials(listing.name)}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-[#111827]">{listing.name}</h3>
                            {typeof listing.rating === "number" && (
                              <span className="flex items-center gap-1 text-sm text-[#111827]">
                                {listing.rating.toFixed(1)}
                                <StarIcon />
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-[#6B7280]">{metaLine}</p>
                          {showDescription && (
                            <p className="mt-1 text-sm text-[#4B5563] line-clamp-2">{listing.description}</p>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
        </>
      )}
      
      {/* Backdrop overlay for location dropdown - covers entire viewport */}
      {isLocationOpen && !selectedListing && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
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
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5">
      <svg className="h-4 w-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15.3 15.3L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8.5" cy="8.5" r="1" fill="currentColor" opacity="0.6" />
      </svg>
    </span>
  )
}

function CuteLocationIcon() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5">
      <svg className="h-4 w-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function StarIcon() {
  return (
    <svg className="h-4 w-4 text-[#111827]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 17.27l5.18 3.04-1.4-5.95L20.5 9.5l-6.12-.52L12 3.5 9.62 8.98 3.5 9.5l4.72 4.86-1.4 5.95z" />
    </svg>
  )
}

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatCount = (value: number) => {
  if (value < 1000) return `${Math.round(value)}`
  if (value < 1000000) {
    const rounded = Math.round((value / 1000) * 10) / 10
    return `${rounded}K`
  }
  const rounded = Math.round((value / 1000000) * 10) / 10
  return `${rounded}M`
}

const getInitials = (name: string) => {
  const trimmed = name.trim()
  if (!trimmed) return "?"
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

const normalizeUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return "#"
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`
}

const getListingLocation = (listing: ListingItem) => {
  if (listing.location) return listing.location
  const parts = [listing.city, listing.state].filter(Boolean)
  return parts.join(", ")
}
