"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, ExternalLink, User, MoreVertical, ThumbsUp } from "lucide-react"
import { INDIA_LOCATIONS } from "../data/india-locations"
import SignInModal from "./sign-in-modal"
import Footer from "./footer"
import { onAuthStateChanged } from "firebase/auth"
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  increment,
  addDoc,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { INDIA_COURSES } from "@/data/india-courses"

const tabs = ["Feeds", "Colleges", "School", "Kindergarden", "Courses"]
const detailTabs = [
  { id: "whatsnew", label: "What's New" },
  { id: "reviews", label: "Reviews" },
  { id: "about", label: "About" },
  { id: "photos", label: "Photos" },
  { id: "others", label: "Courses" },
] as const

type ListingItem = {
  id: string
  name: string
  location?: string // Optional - derived from city + state
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
  locationLink?: string
  employeeCount?: string
  type?: string
  revenue?: string
  founded?: string
  industry?: string
  locationsCount?: number | null
  others?: string
  courseName?: string
  courseField?: string
  courseFacultyMembers?: number | null
  courseStudentsEnrolled?: number | null
  mission?: string
  vision?: string
  facultyCount?: number | null
  photos?: string[]
  ceoName?: string
  ceoPhotoUrl?: string
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
  likes?: number
  likedBy?: string[] // Array of user IDs who liked this review
}

type CollegeSummary = {
  id: string
  name: string
  city?: string
  state?: string
  status?: "Draft" | "Published"
}

const getCollectionName = (tab: string): string => {
  const tabMap: Record<string, string> = {
    Feeds: "feed",
    School: "school",
    Colleges: "colleges",
    Kindergarden: "kindergarden",
    Courses: "courses",
  }
  return tabMap[tab] || "feed"
}

export default function SearchCommunityPage() {
  const [activeTab, setActiveTab] = useState("Feeds")
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
  const [calculatedRatings, setCalculatedRatings] = useState<Record<string, { average: number; count: number }>>({})
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
  const [expandedCourseColleges, setExpandedCourseColleges] = useState<CollegeSummary[]>([])
  const [expandedCourseCollegesLoading, setExpandedCourseCollegesLoading] = useState(false)
  const [expandedCourseCollegesError, setExpandedCourseCollegesError] = useState<string | null>(null)
  const [coursesSeeding, setCoursesSeeding] = useState(false)
  const [coursesSeedError, setCoursesSeedError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser)
  const locationRef = useRef<HTMLDivElement>(null)
  const citiesRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const coursesSeededRef = useRef(false)
  const coursesSeedingRef = useRef(false)
  const isSignedIn = Boolean(currentUser)

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isSignedIn && activeTab !== "Feeds") {
      setActiveTab("Feeds")
    }
  }, [activeTab, isSignedIn])

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

  // Load reviews for all listings to calculate average ratings
  const loadReviewsForListings = (listingIds: string[]) => {
    if (listingIds.length === 0) return

    // Firestore 'in' query supports max 10 items, so we need to batch
    const batches: string[][] = []
    for (let i = 0; i < listingIds.length; i += 10) {
      batches.push(listingIds.slice(i, i + 10))
    }

    batches.forEach((batch) => {
      const reviewsRef = collection(db, "reviews")
      const reviewsQuery = query(reviewsRef, where("listingId", "in", batch))

      const unsubscribe = onSnapshot(
        reviewsQuery,
        (snapshot) => {
          const reviewsByListing: Record<string, number[]> = {}
          
          snapshot.docs.forEach((doc) => {
            const data = doc.data()
            const listingId = data.listingId
            const rating = typeof data.rating === "number" ? data.rating : null
            
            if (listingId && rating !== null && rating >= 1 && rating <= 5) {
              if (!reviewsByListing[listingId]) {
                reviewsByListing[listingId] = []
              }
              reviewsByListing[listingId].push(rating)
            }
          })

          // Calculate average ratings
          setCalculatedRatings((prev) => {
            const newRatings = { ...prev }
            Object.keys(reviewsByListing).forEach((listingId) => {
              const ratings = reviewsByListing[listingId]
              const sum = ratings.reduce((acc, rating) => acc + rating, 0)
              const average = sum / ratings.length
              newRatings[listingId] = {
                average: Math.round(average * 10) / 10, // Round to 1 decimal place
                count: ratings.length
              }
            })
            return newRatings
          })
        },
        (error) => {
          console.error("Error loading reviews for listings:", error)
        }
      )
    })
  }

  // Load reviews for selected listing
  useEffect(() => {
    if (!selectedListing) {
      setReviews([])
      return
    }

    setReviewsLoading(true)
    const reviewsRef = collection(db, "reviews")
    
    // Try with orderBy first, fallback to simple query if index is missing
    let reviewsQuery
    try {
      reviewsQuery = query(
        reviewsRef,
        where("listingId", "==", selectedListing.id),
        orderBy("createdAt", "desc")
      )
    } catch (error) {
      // If orderBy fails, use simple query
      reviewsQuery = query(reviewsRef, where("listingId", "==", selectedListing.id))
    }

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const nextReviews = snapshot.docs
          .map((doc) => {
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
              likes: typeof data.likes === "number" ? data.likes : 0,
              likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            }
          })
          .sort((a, b) => {
            // Client-side sort by createdAt (newest first)
            const aTime = a.createdAt && typeof a.createdAt === "object" && "toDate" in a.createdAt
              ? a.createdAt.toDate().getTime()
              : typeof a.createdAt === "string"
              ? new Date(a.createdAt).getTime()
              : 0
            const bTime = b.createdAt && typeof b.createdAt === "object" && "toDate" in b.createdAt
              ? b.createdAt.toDate().getTime()
              : typeof b.createdAt === "string"
              ? new Date(b.createdAt).getTime()
              : 0
            return bTime - aTime
          })
        setReviews(nextReviews)
        setReviewsLoading(false)
      },
      (error) => {
        console.error("Error loading reviews:", error)
        // If query with orderBy fails, try without orderBy
        if (error.code === "failed-precondition") {
          const fallbackQuery = query(reviewsRef, where("listingId", "==", selectedListing.id))
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            (snapshot) => {
              const nextReviews = snapshot.docs
                .map((doc) => {
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
                    likes: typeof data.likes === "number" ? data.likes : 0,
                    likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
                  }
                })
                .sort((a, b) => {
                  const aTime = a.createdAt && typeof a.createdAt === "object" && "toDate" in a.createdAt
                    ? a.createdAt.toDate().getTime()
                    : typeof a.createdAt === "string"
                    ? new Date(a.createdAt).getTime()
                    : 0
                  const bTime = b.createdAt && typeof b.createdAt === "object" && "toDate" in b.createdAt
                    ? b.createdAt.toDate().getTime()
                    : typeof b.createdAt === "string"
                    ? new Date(b.createdAt).getTime()
                    : 0
                  return bTime - aTime
                })
              setReviews(nextReviews)
              setReviewsLoading(false)
            },
            (fallbackError) => {
              console.error("Error loading reviews (fallback):", fallbackError)
              setReviews([])
              setReviewsLoading(false)
            }
          )
          return () => fallbackUnsubscribe()
        } else {
          setReviews([])
          setReviewsLoading(false)
        }
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

    // Check if user is signed in, if not prompt them
    const currentUser = auth.currentUser
    if (!currentUser) {
      setReviewError("Please sign in to submit a review.")
      setIsSignInOpen(true)
      return
    }

    setIsSubmittingReview(true)
    setReviewError(null)

    try {
      const reviewData = {
        listingId: selectedListing.id,
        authorName: currentUser.displayName || currentUser.email?.split("@")[0] || "Anonymous",
        authorId: currentUser.uid,
        likes: 0,
        likedBy: [],
        rating: reviewForm.rating,
        message: trimmedMessage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      console.log("Submitting review to Firebase:", {
        collection: "reviews",
        data: reviewData,
        listingId: selectedListing.id,
        listingName: selectedListing.name
      })

      const docRef = await addDoc(collection(db, "reviews"), reviewData)
      console.log("Review successfully saved to Firestore with ID:", docRef.id)
      
      // Update calculated rating for this listing immediately
      if (selectedListing) {
        const currentRatings = calculatedRatings[selectedListing.id]
        const newRating = reviewForm.rating
        const currentCount = currentRatings?.count || 0
        const currentAverage = currentRatings?.average || 0
        
        let newAverage: number
        if (currentCount === 0) {
          newAverage = newRating
        } else {
          const totalSum = currentAverage * currentCount + newRating
          newAverage = totalSum / (currentCount + 1)
        }
        
        setCalculatedRatings((prev) => ({
          ...prev,
          [selectedListing.id]: {
            average: Math.round(newAverage * 10) / 10,
            count: currentCount + 1
          }
        }))
      }
      
      // Reset form
      setReviewForm({ rating: 5, message: "" })
      setReviewError(null)
    } catch (error) {
      console.error("Error submitting review:", error)
      console.error("Error details:", {
        code: error?.code,
        message: error?.message,
        stack: error?.stack
      })
      setReviewError(`Failed to submit review: ${error?.message || "Unknown error"}. Please check console for details.`)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleLikeReview = async (reviewId: string, currentLikedBy: string[] = [], currentLikes: number = 0) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      setIsSignInOpen(true)
      return
    }

    const userId = currentUser.uid
    const isLiked = currentLikedBy.includes(userId)

    try {
      const reviewRef = doc(db, "reviews", reviewId)
      
      if (isLiked) {
        // Unlike: remove user from likedBy and decrement likes
        await updateDoc(reviewRef, {
          likedBy: arrayRemove(userId),
          likes: increment(-1)
        })
      } else {
        // Like: add user to likedBy and increment likes
        await updateDoc(reviewRef, {
          likedBy: arrayUnion(userId),
          likes: increment(1)
        })
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleReportReview = (reviewId: string) => {
    setReportingReviewId(reviewId)
    setReportModalOpen(true)
    setOpenMenuId(null)
  }

  const handleSubmitReport = async () => {
    if (!reportingReviewId || !reportReason.trim()) {
      return
    }

    const currentUser = auth.currentUser
    if (!currentUser) {
      setIsSignInOpen(true)
      setReportModalOpen(false)
      return
    }

    try {
      // Create a report document in a "reports" collection
      await addDoc(collection(db, "reports"), {
        reviewId: reportingReviewId,
        reason: reportReason.trim(),
        reportedBy: currentUser.uid,
        reportedByName: currentUser.displayName || currentUser.email || "Anonymous",
        createdAt: serverTimestamp(),
        status: "pending"
      })

      setReportModalOpen(false)
      setReportingReviewId(null)
      setReportReason("")
      alert("Thank you for reporting this review. We will review it shortly.")
    } catch (error) {
      console.error("Error submitting report:", error)
      alert("Failed to submit report. Please try again.")
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [openMenuId])

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

  const seedIndiaCourses = async () => {
    if (coursesSeedingRef.current || coursesSeededRef.current) return
    coursesSeedingRef.current = true
    setCoursesSeeding(true)
    setCoursesSeedError(null)
    try {
      const batch = writeBatch(db)
      INDIA_COURSES.forEach((course) => {
        const ref = doc(collection(db, "courses"))
        batch.set(ref, {
          name: course.courseName,
          courseName: course.courseName,
          courseField: course.courseField,
          status: "Published",
          description: "",
          others: "",
          collegeIds: [],
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
      })
      await batch.commit()
      coursesSeededRef.current = true
    } catch (error) {
      console.error("Auto-seeding courses failed:", error)
      setCoursesSeedError("Unable to load courses right now. Please try again later.")
      coursesSeededRef.current = true
    } finally {
      coursesSeedingRef.current = false
      setCoursesSeeding(false)
    }
  }

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
            const city = typeof data.city === "string" ? data.city : ""
            const state = typeof data.state === "string" ? data.state : ""
            return {
              id: doc.id,
              name: data.name || "",
              location: typeof data.location === "string" ? data.location : "",
              state,
              city,
              status: data.status || "Draft",
              description: data.description || "",
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toLocaleString() : new Date().toLocaleString(),
              rating: parseNumber(data.rating),
              jobsCount: parseNumber(data.jobsCount ?? data.jobs),
              reviewsCount: parseNumber(data.reviewsCount ?? data.reviews),
              salariesCount: parseNumber(data.salariesCount ?? data.salaries),
              logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : "",
              website: typeof data.website === "string" ? data.website : "",
              locationLink: typeof data.locationLink === "string" ? data.locationLink : "",
              employeeCount: data.employeeCount != null ? String(data.employeeCount) : "",
              type: typeof data.type === "string" ? data.type : "",
              revenue: typeof data.revenue === "string" ? data.revenue : "",
              founded: data.founded != null ? String(data.founded) : "",
              industry: typeof data.industry === "string" ? data.industry : "",
              locationsCount: parseNumber(data.locationsCount ?? data.locations),
              mission: typeof data.mission === "string" ? data.mission : "",
              vision: typeof data.vision === "string" ? data.vision : "",
              facultyCount: parseNumber(data.facultyCount),
              photos: Array.isArray(data.photos) ? data.photos.filter((url): url is string => typeof url === "string" && url.trim() !== "") : [],
              whatsNew: typeof data.whatsNew === "string" ? data.whatsNew : "",
              others: typeof data.others === "string" ? data.others : "",
              courseName: typeof data.courseName === "string" ? data.courseName : "",
              courseField: typeof data.courseField === "string" ? data.courseField : "",
              courseFacultyMembers: parseNumber(data.courseFacultyMembers),
              courseStudentsEnrolled: parseNumber(data.courseStudentsEnrolled),
              ceoName: typeof data.ceoName === "string" ? data.ceoName : "",
              ceoPhotoUrl: typeof data.ceoPhotoUrl === "string" ? data.ceoPhotoUrl : "",
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

        if (activeTab === "Courses") {
          if (snapshot.empty && !coursesSeededRef.current && !coursesSeedingRef.current) {
            void seedIndiaCourses()
          } else if (!snapshot.empty) {
            coursesSeededRef.current = true
            setCoursesSeedError(null)
          }
        }
        
        // Load reviews for all listings to calculate average ratings
        if (nextListings.length > 0) {
          const listingIds = nextListings.map(l => l.id)
          loadReviewsForListings(listingIds)
        }
      },
      (error) => {
        console.error("Error loading listings:", error)
        setListings([])
        setListingsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== "Courses") {
      setExpandedCourseId(null)
      setExpandedCourseColleges([])
      setExpandedCourseCollegesLoading(false)
      setExpandedCourseCollegesError(null)
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== "Courses" || !expandedCourseId) {
      setExpandedCourseColleges([])
      setExpandedCourseCollegesLoading(false)
      setExpandedCourseCollegesError(null)
      return
    }

    setExpandedCourseCollegesLoading(true)
    setExpandedCourseCollegesError(null)
    setExpandedCourseColleges([])

    const collegesRef = collection(db, "colleges")
    const collegesQuery = query(collegesRef, where("courseIds", "array-contains", expandedCourseId))

    const unsubscribe = onSnapshot(
      collegesQuery,
      (snapshot) => {
        const nextColleges: CollegeSummary[] = snapshot.docs
          .map((doc) => {
            const data = doc.data() as Record<string, unknown>
            return {
              id: doc.id,
              name: typeof data.name === "string" ? data.name : "",
              city: typeof data.city === "string" ? data.city : "",
              state: typeof data.state === "string" ? data.state : "",
              status: (typeof data.status === "string" ? (data.status as "Draft" | "Published") : "Draft") ?? "Draft",
            }
          })
          .filter((college) => college.status === "Published")
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        setExpandedCourseColleges(nextColleges)
        setExpandedCourseCollegesLoading(false)
      },
      (error) => {
        console.error("Error loading course colleges:", error)
        setExpandedCourseColleges([])
        setExpandedCourseCollegesLoading(false)
        setExpandedCourseCollegesError(error?.message ?? "Unable to load colleges for this course.")
      }
    )

    return () => unsubscribe()
  }, [activeTab, expandedCourseId])

  // Filter listings based on search query and location
  const filteredListings = useMemo(() => {
    let filtered = listings

    if (activeTab === "Courses") {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        filtered = filtered.filter((listing) => {
          const courseName = (listing.courseName || listing.name || "").toLowerCase()
          const courseField = (listing.courseField || "").toLowerCase()
          const description = (listing.description || "").toLowerCase()
          const extra = (listing.others || "").toLowerCase()
          return courseName.includes(query) || courseField.includes(query) || description.includes(query) || extra.includes(query)
        })
      }
      return filtered
        .slice()
        .sort((a, b) =>
          (a.courseName || a.name || "").localeCompare(b.courseName || b.name || "", "en", { sensitivity: "base" })
        )
    }

    // Filter by search query - using city and state fields only
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(
        (listing) =>
          listing.name.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.city?.toLowerCase().includes(query) ||
          listing.state?.toLowerCase().includes(query)
      )
    }

    // Filter by location - using city and state fields as primary source
    if (selectedCity && selectedState) {
      filtered = filtered.filter(
        (listing) => {
          const cityMatch = listing.city?.toLowerCase() === selectedCity.toLowerCase()
          const stateMatch = listing.state?.toLowerCase() === selectedState.toLowerCase()
          
          // Primary: Exact match on both city and state fields
          return cityMatch && stateMatch
        }
      )
    } else if (selectedState) {
      filtered = filtered.filter(
        (listing) =>
          listing.state?.toLowerCase() === selectedState.toLowerCase()
      )
    }

    return filtered
  }, [listings, searchQuery, selectedState, selectedCity, activeTab])

  const detailLocation = selectedListing ? getListingLocation(selectedListing) : ""
  const hasDetailLocation = detailLocation && detailLocation !== "Location not specified"
  const locationHref = selectedListing?.locationLink
    ? normalizeUrl(selectedListing.locationLink)
    : hasDetailLocation
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailLocation)}`
      : ""
  const locationLabel = hasDetailLocation ? detailLocation : "View location"
  const primaryAboutLines = selectedListing
    ? [
        selectedListing.founded ? `Founded in: ${selectedListing.founded}` : null,
        typeof selectedListing.facultyCount === "number"
          ? `Total number of faculty: ${selectedListing.facultyCount.toLocaleString()}`
          : null,
      ].filter((line): line is string => Boolean(line))
    : []
  const secondaryAboutLines = selectedListing
    ? [
        selectedListing.employeeCount ? `${selectedListing.employeeCount} Employees` : null,
        selectedListing.type ? `Type: ${selectedListing.type}` : null,
        selectedListing.revenue ? `Revenue: ${selectedListing.revenue}` : null,
        typeof selectedListing.locationsCount === "number"
          ? `${formatCount(selectedListing.locationsCount)} Locations`
          : null,
        selectedListing.industry || null,
      ].filter((line): line is string => Boolean(line))
    : []
  const courseDetails = selectedListing
    ? [
        selectedListing.courseName ? `Course name: ${selectedListing.courseName}` : null,
        selectedListing.courseField ? `Course field: ${selectedListing.courseField}` : null,
        typeof selectedListing.courseFacultyMembers === "number"
          ? `Faculty members: ${selectedListing.courseFacultyMembers.toLocaleString()}`
          : null,
        typeof selectedListing.courseStudentsEnrolled === "number"
          ? `Students currently enrolled: ${selectedListing.courseStudentsEnrolled.toLocaleString()}`
          : null,
      ].filter((line): line is string => Boolean(line))
    : []

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col scroll-smooth">
      {/* Header */}
      <header className="relative flex items-center justify-center px-4 sm:px-5 pt-8 pb-6 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full">
        {selectedListing ? (
          <button
            type="button"
            onClick={handleCloseListing}
            className="absolute left-4 top-8 flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-colors z-10 shadow-sm"
            aria-label="Back to results"
          >
            <ChevronLeft className="h-5 w-5 text-[#111827]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsSignInOpen(true)}
            className="absolute right-2 top-8 p-2 rounded-full hover:bg-black/5 transition-colors z-10"
            aria-label="Open profile"
          >
            <User className="h-6 w-6 text-[#111827]" />
          </button>
        )}
      </header>

      {selectedListing ? (
        <div className="px-4 sm:px-5 mt-2 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full pb-10">
          <div className="flex items-center justify-between gap-4 pl-12 sm:pl-14">
            <div className="flex items-center gap-3">
              {selectedListing.logoUrl ? (
                <img
                  src={selectedListing.logoUrl}
                  alt={selectedListing.name}
                  className="h-14 w-14 rounded-full border border-[#E5E7EB] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-base font-semibold text-[#111827]">
                  {getInitials(selectedListing.name)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-[#111827]">{selectedListing.name}</h2>
                {(() => {
                  const calculatedRating = calculatedRatings[selectedListing.id]
                  const displayRating = calculatedRating?.average ?? null
                  return displayRating !== null && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-[#111827]">
                      <span>{displayRating.toFixed(1)}</span>
                      <StarIcon />
                      {calculatedRating.count > 0 && (
                        <span className="text-[#6B7280]">({formatCount(calculatedRating.count)} reviews)</span>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
            <button
              type="button"
              className="rounded-full border border-[#D1D5DB] px-5 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F9FAFB] transition-colors"
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
                    <div className="absolute left-0 right-0 -bottom-px h-1 bg-orange-500" />
                  )}
                </button>
              ))}
            </div>
          </nav>

          {detailTab === "whatsnew" ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4">What's New</h3>
                <div className="space-y-3 text-sm text-[#4B5563]">
                  <p>Stay updated with the latest news and updates about this listing.</p>
                  <p className="text-[#6B7280]">Recent updates and announcements will appear here.</p>
                </div>
              </div>
            </div>
          ) : detailTab === "about" ? (
            <div className="mt-5 space-y-4">
              {selectedListing.website && (
                <a
                  href={normalizeUrl(selectedListing.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600"
                >
                  {selectedListing.website}
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {primaryAboutLines.length > 0 && (
                <div className="space-y-2 text-sm text-[#111827]">
                  {primaryAboutLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}

              {locationHref && (
                <p className="text-sm text-[#111827]">
                  Location:{" "}
                  <a
                    href={locationHref}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-orange-500 hover:text-orange-600"
                  >
                    {locationLabel}
                  </a>
                </p>
              )}

              {selectedListing.mission && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#111827]">Mission</p>
                  <p className="text-sm text-[#4B5563]">{selectedListing.mission}</p>
                </div>
              )}

              {selectedListing.vision && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#111827]">Vision</p>
                  <p className="text-sm text-[#4B5563]">{selectedListing.vision}</p>
                </div>
              )}

              {secondaryAboutLines.length > 0 && (
                <div className="space-y-2 text-sm text-[#111827]">
                  {secondaryAboutLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}

              {selectedListing.description && (
                <p className="text-sm text-[#4B5563]">{selectedListing.description}</p>
              )}

              {!selectedListing.website &&
                primaryAboutLines.length === 0 &&
                secondaryAboutLines.length === 0 &&
                !locationHref &&
                !selectedListing.mission &&
                !selectedListing.vision &&
                !selectedListing.description && (
                  <p className="text-sm text-[#6B7280]">No details available yet.</p>
                )}
            </div>
          ) : detailTab === "reviews" ? (
            <div className="mt-5 space-y-8">
              {(() => {
                // Calculate overall rating and statistics
                const calculatedRating = calculatedRatings[selectedListing.id]
                const averageRating = calculatedRating?.average ?? 0
                const totalReviews = calculatedRating?.count ?? reviews.length
                
                // Calculate recommendation percentage (ratings >= 4)
                const recommendedCount = reviews.filter(r => typeof r.rating === "number" && r.rating >= 4).length
                const recommendationPercentage = totalReviews > 0 ? Math.round((recommendedCount / totalReviews) * 100) : 0
                
                // Calculate ratings distribution
                const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                reviews.forEach(r => {
                  if (typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5) {
                    distribution[Math.round(r.rating) as keyof typeof distribution]++
                  }
                })
                const distributionPercentages = {
                  5: totalReviews > 0 ? Math.round((distribution[5] / totalReviews) * 100) : 0,
                  4: totalReviews > 0 ? Math.round((distribution[4] / totalReviews) * 100) : 0,
                  3: totalReviews > 0 ? Math.round((distribution[3] / totalReviews) * 100) : 0,
                  2: totalReviews > 0 ? Math.round((distribution[2] / totalReviews) * 100) : 0,
                  1: totalReviews > 0 ? Math.round((distribution[1] / totalReviews) * 100) : 0,
                }
                
                // Calculate CEO approval (using average rating as proxy, or can be separate field)
                const ceoApprovalPercentage = averageRating > 0 ? Math.round((averageRating / 5) * 100) : 0
                
                return (
                  <>
                    {/* Overall Rating and Recommendation */}
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-bold text-orange-500">{averageRating > 0 ? averageRating.toFixed(1) : "0.0"}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`h-6 w-6 ${star <= Math.round(averageRating) ? "text-orange-500 fill-orange-500" : "text-gray-300"}`}
                              viewBox="0 0 24 24"
                              fill={star <= Math.round(averageRating) ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth={star <= Math.round(averageRating) ? 0 : 1.5}
                            >
                              <path d="M12 17.27l5.18 3.04-1.4-5.95L20.5 9.5l-6.12-.52L12 3.5 9.62 8.98 3.5 9.5l4.72 4.86-1.4 5.95z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {totalReviews > 0 && (
                        <p className="text-sm text-[#4B5563]">{recommendationPercentage}% would recommend to a friend</p>
                      )}
                    </div>

                    {/* CEO Approval */}
                    {selectedListing.ceoName && (
                      <div className="flex items-center gap-3">
                        {selectedListing.ceoPhotoUrl ? (
                          <img
                            src={selectedListing.ceoPhotoUrl}
                            alt={selectedListing.ceoName}
                            className="h-12 w-12 rounded-full object-cover border border-[#E5E7EB]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-semibold border border-[#E5E7EB]">
                            {selectedListing.ceoName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">{selectedListing.ceoName}</p>
                          <p className="text-xs text-[#6B7280]">{ceoApprovalPercentage}% approve of CEO</p>
                        </div>
                      </div>
                    )}

                    {/* Ratings Distribution */}
                    {totalReviews > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-[#111827]">Ratings distribution</h4>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const percentage = distributionPercentages[star as keyof typeof distributionPercentages]
                          return (
                            <div key={star} className="flex items-center gap-3">
                              <span className="text-xs text-[#6B7280] w-8">{star} star</span>
                              <div className="flex-1 flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#374151] rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-[#6B7280] w-10 text-right">{percentage}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Reviews by Job Title Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#111827]">Reviews by job title</h4>
                        <button
                          onClick={() => {
                            // Scroll to review form
                            document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth" })
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#111827] bg-white text-sm font-semibold text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Add a review
                        </button>
                      </div>

                      {/* Review Form */}
                      <div id="review-form" className="border-t border-[#E5E7EB] pt-6">
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-[#111827] mb-2">
                              Your Rating
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                                  className={`transition-transform hover:scale-110 ${
                                    star <= reviewForm.rating ? "text-orange-500" : "text-gray-300"
                                  }`}
                                >
                                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill={star <= reviewForm.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={star <= reviewForm.rating ? 0 : 1.5}>
                                    <path d="M12 17.27l5.18 3.04-1.4-5.95L20.5 9.5l-6.12-.52L12 3.5 9.62 8.98 3.5 9.5l4.72 4.86-1.4 5.95z" />
                                  </svg>
                                </button>
                              ))}
                              <span className="ml-2 text-sm text-[#6B7280]">{reviewForm.rating}/5</span>
                            </div>
                          </div>

                          <div>
                            <label htmlFor="review-message" className="block text-sm font-semibold text-[#111827] mb-2">
                              Your Review
                            </label>
                            <textarea
                              id="review-message"
                              value={reviewForm.message}
                              onChange={(e) => setReviewForm((prev) => ({ ...prev, message: e.target.value }))}
                              placeholder="Share your experience..."
                              rows={4}
                              className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            />
                          </div>

                          {reviewError && (
                            <p className="text-sm text-red-600">{reviewError}</p>
                          )}

                          <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className="w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmittingReview ? "Submitting..." : "Submit Review"}
                          </button>
                        </form>
                      </div>

                      {/* Existing Reviews */}
                      <div className="border-t border-[#E5E7EB] pt-6">
                        {reviewsLoading ? (
                          <p className="text-sm text-[#6B7280]">Loading reviews...</p>
                        ) : reviews.length === 0 ? (
                          <p className="text-sm text-[#6B7280]">Be the first to review this listing!</p>
                        ) : (
                          <div className="space-y-4">
                            {reviews.map((review) => {
                              const currentUser = auth.currentUser
                              const userId = currentUser?.uid || ""
                              const isLiked = review.likedBy?.includes(userId) || false
                              const likeCount = review.likes || 0
                              
                              return (
                                <div key={review.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                                  <div className="flex items-start gap-2 mb-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10 text-sm font-semibold text-orange-500">
                                      {review.authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm text-[#111827]">
                                            <span className="font-semibold">{review.authorName}</span>
                                            {typeof review.rating === "number" && (
                                              <span className="font-bold text-[#111827] ml-2">
                                                {review.rating.toFixed(1)}★
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-xs text-[#6B7280] mt-0.5">
                                            {(() => {
                                              if (!review.createdAt) return "Recently"
                                              if (typeof review.createdAt === "string") {
                                                return new Date(review.createdAt).toLocaleDateString()
                                              }
                                              if (review.createdAt && typeof review.createdAt === "object" && "toDate" in review.createdAt) {
                                                return review.createdAt.toDate().toLocaleDateString()
                                              }
                                              return "Recently"
                                            })()}
                                          </p>
                                        </div>
                                        {/* 3-dot menu */}
                                        <div className="relative" ref={menuRef}>
                                          <button
                                            type="button"
                                            onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)}
                                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                          >
                                            <MoreVertical className="h-5 w-5 text-[#6B7280]" />
                                          </button>
                                          {openMenuId === review.id && (
                                            <div className="absolute right-0 top-8 z-10 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 min-w-[120px]">
                                              <button
                                                type="button"
                                                onClick={() => handleReportReview(review.id)}
                                                className="w-full text-left px-4 py-2 text-sm text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                                              >
                                                Report
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-sm text-[#4B5563] whitespace-pre-wrap mb-3">{review.message}</p>
                                  {/* Like button */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleLikeReview(review.id, review.likedBy, review.likes)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
                                        isLiked
                                          ? "bg-orange-500/10 text-orange-500"
                                          : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                                      }`}
                                    >
                                      <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                                      <span className="text-sm font-medium">{likeCount > 0 ? likeCount : "Helpful"}</span>
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total Review Count */}
                    {totalReviews > 0 && (
                      <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                        <span className="text-sm text-[#6B7280]">{formatCount(totalReviews)} reviews</span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          ) : detailTab === "others" ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4">Course details</h3>
                {courseDetails.length > 0 ? (
                  <div className="space-y-2 text-sm text-[#4B5563]">
                    {courseDetails.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">No course details available yet.</p>
                )}
                {selectedListing.others && (
                  <p className="mt-4 text-sm text-[#4B5563]">{selectedListing.others}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              {selectedListing.photos && selectedListing.photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedListing.photos.map((photoUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photoUrl}
                        alt={`${selectedListing.name} - Photo ${index + 1}`}
                        className="w-full h-64 object-cover rounded-xl border border-[#E5E7EB] cursor-pointer transition-transform hover:scale-105"
                        loading="lazy"
                        onClick={() => window.open(photoUrl, "_blank")}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors pointer-events-none" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="h-16 w-16 text-[#D1D5DB] mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-[#6B7280]">No photos available yet.</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Photos will be added by the admin.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Search Container - Centered on desktop */}
      <div className="px-4 sm:px-5 mt-4 max-w-[430px] md:max-w-[720px] lg:max-w-[860px] mx-auto w-full">
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
                placeholder="Search"
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
            {tabs.map((tab) => {
              const isLocked = !isSignedIn && tab !== "Feeds"
              const isActive = activeTab === tab && !isLocked

              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (isLocked) {
                      setIsSignInOpen(true)
                      return
                    }
                    setActiveTab(tab)
                  }}
                  className={`relative pb-3 text-[15px] whitespace-nowrap transition-colors ${
                    isActive ? "text-[#111827] font-semibold" : "text-[#6B7280] font-medium"
                  } ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
                  aria-disabled={isLocked}
                  title={isLocked ? "Sign in to access this section" : undefined}
                >
                  {tab}
                  {isActive && (
                    <div className="absolute left-0 right-0 -bottom-px h-1 bg-orange-500" />
                  )}
                </button>
              )
            })}
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
          activeTab === "Courses" ? (
            <div className="space-y-4">
              <p className="text-sm text-[#6B7280]">
                Found {filteredListings.length} {filteredListings.length === 1 ? "course" : "courses"}
              </p>
              {coursesSeeding && filteredListings.length === 0 && (
                <p className="text-sm text-[#6B7280]">Loading the India courses catalog...</p>
              )}
              {coursesSeedError && filteredListings.length === 0 && (
                <p className="text-sm text-red-600">{coursesSeedError}</p>
              )}

              <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1.5fr_1fr_0.8fr_1fr_28px] gap-3 px-5 py-3 text-xs font-semibold text-[#6B7280] bg-[#F9FAFB]">
                  <span>Course</span>
                  <span>Field</span>
                  <span>Faculty</span>
                  <span>Enrolled</span>
                  <span />
                </div>

                <div className="divide-y divide-[#E5E7EB]">
                  {filteredListings.map((course) => {
                    const courseName = course.courseName || course.name || "Untitled course"
                    const courseField = course.courseField || "—"
                    const facultyMembers =
                      typeof course.courseFacultyMembers === "number"
                        ? course.courseFacultyMembers.toLocaleString()
                        : "—"
                    const studentsEnrolled =
                      typeof course.courseStudentsEnrolled === "number"
                        ? course.courseStudentsEnrolled.toLocaleString()
                        : "—"
                    const isExpanded = expandedCourseId === course.id

                    return (
                      <div key={course.id}>
                        <button
                          type="button"
                          onClick={() => setExpandedCourseId((prev) => (prev === course.id ? null : course.id))}
                          className="w-full px-5 py-4 text-left transition-colors hover:bg-[#F9FAFB]"
                        >
                          <div className="flex items-start gap-3 sm:hidden">
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-semibold text-[#111827] truncate">{courseName}</p>
                              <p className="mt-1 text-sm text-[#6B7280]">
                                {courseField}
                                {(facultyMembers !== "—" || studentsEnrolled !== "—") && " · "}
                                {facultyMembers !== "—" ? `${facultyMembers} faculty` : null}
                                {facultyMembers !== "—" && studentsEnrolled !== "—" ? " · " : null}
                                {studentsEnrolled !== "—" ? `${studentsEnrolled} enrolled` : null}
                              </p>
                            </div>
                            <ChevronRight
                              className={`mt-0.5 h-5 w-5 text-orange-500 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </div>

                          <div className="hidden sm:grid grid-cols-[1.5fr_1fr_0.8fr_1fr_28px] gap-3 items-center">
                            <span className="text-sm font-semibold text-[#111827]">{courseName}</span>
                            <span className="text-sm text-[#6B7280]">{courseField}</span>
                            <span className="text-sm text-[#111827]">{facultyMembers}</span>
                            <span className="text-sm text-[#111827]">{studentsEnrolled}</span>
                            <ChevronRight
                              className={`h-5 w-5 text-orange-500 transition-transform justify-self-end ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-1 bg-orange-50/60">
                            <p className="mt-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                              Colleges offering this course
                            </p>

                            {expandedCourseCollegesLoading ? (
                              <p className="mt-3 text-sm text-[#6B7280]">Loading colleges...</p>
                            ) : expandedCourseCollegesError ? (
                              <p className="mt-3 text-sm text-red-600">{expandedCourseCollegesError}</p>
                            ) : expandedCourseColleges.length === 0 ? (
                              <p className="mt-3 text-sm text-[#6B7280]">
                                No colleges linked yet. Ask the admin to add colleges for this course.
                              </p>
                            ) : (
                              <div className="mt-3 space-y-2">
                                {expandedCourseColleges.map((college) => {
                                  const location = [college.city, college.state].filter(Boolean).join(", ")
                                  return (
                                    <div
                                      key={college.id}
                                      className="rounded-xl border border-orange-200 bg-white px-4 py-3"
                                    >
                                      <p className="text-sm font-semibold text-[#111827]">
                                        {college.name || "Untitled college"}
                                      </p>
                                      {location && <p className="text-xs text-[#6B7280]">{location}</p>}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#6B7280]">
                Found {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
              </p>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white">
                <ul className="divide-y divide-[#E5E7EB]">
                  {filteredListings.map((listing) => {
                    // Get calculated rating from user reviews (preferred over admin rating)
                    const calculatedRating = calculatedRatings[listing.id]
                    const displayRating = calculatedRating?.average ?? null
                    const reviewCount = calculatedRating?.count ?? 0
                    
                    // Build stats parts (excluding reviews, which will be shown with rating)
                    const statsParts: string[] = []
                    if (typeof listing.jobsCount === "number") {
                      statsParts.push(`${formatCount(listing.jobsCount)} jobs`)
                    }
                    if (typeof listing.salariesCount === "number") {
                      statsParts.push(`${formatCount(listing.salariesCount)} salaries`)
                    }
                    
                    const locationDisplay = [listing.city, listing.state].filter(Boolean).join(", ") || "Location not specified"
                    const hasLocationDisplay = locationDisplay !== "Location not specified"
                    const locationHref = listing.locationLink
                      ? normalizeUrl(listing.locationLink)
                      : hasLocationDisplay
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationDisplay)}`
                        : ""
                    const showDescription = !displayRating && statsParts.length === 0 && listing.description

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
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-sm font-semibold text-[#111827]">
                              {getInitials(listing.name)}
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold text-[#111827]">{listing.name}</h3>
                              {displayRating !== null && (
                                <span className="font-bold text-[#111827] text-base">
                                  {displayRating.toFixed(1)}★
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-[#6B7280]">
                              {reviewCount > 0 && (
                                <>
                                  <span>{formatCount(reviewCount)} reviews</span>
                                  {statsParts.length > 0 && " · "}
                                </>
                              )}
                              {statsParts.length > 0 && statsParts.join(" · ")}
                              {(reviewCount > 0 || statsParts.length > 0) && locationDisplay && " · "}
                              {locationHref ? (
                                <span
                                  role="link"
                                  tabIndex={0}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    window.open(locationHref, "_blank", "noopener,noreferrer")
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      window.open(locationHref, "_blank", "noopener,noreferrer")
                                    }
                                  }}
                                  className="font-semibold text-orange-500 hover:text-orange-600 cursor-pointer"
                                >
                                  {locationDisplay}
                                </span>
                              ) : (
                                locationDisplay
                              )}
                            </p>
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
          )
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
      
      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Report Review</h3>
            <p className="text-sm text-[#6B7280] mb-4">
              Please tell us why you're reporting this review. This helps us keep our community safe.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter reason for reporting..."
              rows={4}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false)
                  setReportingReviewId(null)
                  setReportReason("")
                }}
                className="px-4 py-2 text-sm font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={!reportReason.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
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
  const parts = [listing.city, listing.state].filter(Boolean)
  if (parts.length > 0) return parts.join(", ")
  const fallbackLocation = listing.location?.trim()
  return fallbackLocation ? fallbackLocation : "Location not specified"
}
