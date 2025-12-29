"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { INDIA_COURSES } from "@/data/india-courses"
import { db, auth } from "@/lib/firebase"
import { X, ExternalLink, Upload } from "lucide-react"

type ListingStatus = "Draft" | "Published"
type ReviewStatus = "Visible" | "Hidden"
type UserRole = "user" | "subadmin" | "admin"

type ListingItem = {
  id: string
  name: string
  location?: string // Optional - derived from city + state for backward compatibility
  state?: string
  city?: string
  status: ListingStatus
  description: string
  whatsNew?: string
  others?: string
  collegeIds?: string[]
  courseIds?: string[]
  updatedAt: string
  createdAt?: Timestamp | string
  rating?: number | null
  jobsCount?: number | null
  reviewsCount?: number | null
  salariesCount?: number | null
  locationsCount?: number | null
  logoUrl?: string
  website?: string
  locationLink?: string
  employeeCount?: string
  type?: string
  revenue?: string
  founded?: string
  industry?: string
  photos?: string[]
  ceoName?: string
  ceoPhotoUrl?: string
  mission?: string
  vision?: string
  facultyCount?: number | null
  courseName?: string
  courseField?: string
  courseFacultyMembers?: number | null
  courseStudentsEnrolled?: number | null
}

type ReviewItem = {
  id: string
  author: string
  rating: number
  message: string
  source: string
  status: ReviewStatus
  createdAt: string
}

type UserRecord = {
  id: string
  name: string
  phone: string
  email?: string | null
  provider?: string
  createdAt?: unknown
  role?: UserRole
}

const tabs = [
  { id: "users", label: "Users" },
  { id: "schools", label: "Feeds" },
  { id: "jobs", label: "Colleges" },
  { id: "colleges", label: "School" },
  { id: "companies", label: "Kindergarden" },
  { id: "courses", label: "Courses" },
  { id: "reviews", label: "Reviews" },
] as const

type TabId = (typeof tabs)[number]["id"]
type ListingTabId = "schools" | "colleges" | "jobs" | "companies" | "courses"

// Helper function to get collection name from tab ID
const getCollectionName = (tabId: ListingTabId): string => {
  const collectionMap: Record<ListingTabId, string> = {
    schools: "feed",
    colleges: "school",
    jobs: "colleges",
    companies: "kindergarden",
    courses: "courses",
  }
  return collectionMap[tabId] || "feed"
}

const initialReviews: ReviewItem[] = [
  {
    id: "review-1",
    author: "Aman J.",
    rating: 4,
    message: "Helpful community with quick responses and polite admins.",
    source: "Search Community",
    status: "Visible",
    createdAt: "2024-02-12 18:12",
  },
  {
    id: "review-2",
    author: "Priya S.",
    rating: 3,
    message: "Great listings but would love more filters for locations.",
    source: "Mobile App",
    status: "Hidden",
    createdAt: "2024-02-09 12:44",
  },
]

const createId = (prefix: string) => `${prefix}-${Date.now()}`

const formatTimestamp = (value: unknown) => {
  if (!value) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number") return new Date(value).toLocaleString()
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleString()
  }
  return "—"
}

const parseOptionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const mapListingData = (doc: any): ListingItem => {
  const data = doc.data()
  return {
    id: doc.id,
    name: data.name || "",
    location: data.location || "",
    state: data.state || "",
    city: data.city || "",
    status: (data.status || "Draft") as ListingStatus,
    description: data.description || "",
    whatsNew: typeof data.whatsNew === "string" ? data.whatsNew : "",
    others: typeof data.others === "string" ? data.others : "",
    collegeIds: Array.isArray(data.collegeIds)
      ? data.collegeIds.filter((value: unknown): value is string => typeof value === "string" && value.trim() !== "")
      : [],
    courseIds: Array.isArray(data.courseIds)
      ? data.courseIds.filter((value: unknown): value is string => typeof value === "string" && value.trim() !== "")
      : [],
    mission: typeof data.mission === "string" ? data.mission : "",
    vision: typeof data.vision === "string" ? data.vision : "",
    facultyCount: parseOptionalNumber(data.facultyCount),
    courseName: typeof data.courseName === "string" ? data.courseName : "",
    courseField: typeof data.courseField === "string" ? data.courseField : "",
    courseFacultyMembers: parseOptionalNumber(data.courseFacultyMembers),
    courseStudentsEnrolled: parseOptionalNumber(data.courseStudentsEnrolled),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toLocaleString() : new Date().toLocaleString(),
    createdAt: data.createdAt,
    rating: parseOptionalNumber(data.rating),
    jobsCount: parseOptionalNumber(data.jobsCount ?? data.jobs),
    reviewsCount: parseOptionalNumber(data.reviewsCount ?? data.reviews),
    salariesCount: parseOptionalNumber(data.salariesCount ?? data.salaries),
    locationsCount: parseOptionalNumber(data.locationsCount ?? data.locations),
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : "",
    website: typeof data.website === "string" ? data.website : "",
    employeeCount: data.employeeCount != null ? String(data.employeeCount) : "",
    type: typeof data.type === "string" ? data.type : "",
    revenue: typeof data.revenue === "string" ? data.revenue : "",
    founded: data.founded != null ? String(data.founded) : "",
    industry: typeof data.industry === "string" ? data.industry : "",
    photos: Array.isArray(data.photos) ? data.photos.filter((url): url is string => typeof url === "string" && url.trim() !== "") : [],
    locationLink: typeof data.locationLink === "string" ? data.locationLink : "",
    ceoName: typeof data.ceoName === "string" ? data.ceoName : "",
    ceoPhotoUrl: typeof data.ceoPhotoUrl === "string" ? data.ceoPhotoUrl : "",
  }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users")
  const [users, setUsers] = useState<UserRecord[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [userQuery, setUserQuery] = useState("")
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserLoading, setCurrentUserLoading] = useState(true)
  const [roleUpdateId, setRoleUpdateId] = useState<string | null>(null)
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null)

  const [schools, setSchools] = useState<ListingItem[]>([])
  const [colleges, setColleges] = useState<ListingItem[]>([])
  const [jobs, setJobs] = useState<ListingItem[]>([])
  const [companies, setCompanies] = useState<ListingItem[]>([])
  const [courses, setCourses] = useState<ListingItem[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)
  const [collegesLoading, setCollegesLoading] = useState(true)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const isAdmin = currentUserRole === "admin"
  const isSubadmin = currentUserRole === "subadmin"
  const canManageListings = isAdmin || isSubadmin
  const canManageReviews = isAdmin
  const visibleTabs = useMemo(() => {
    if (isAdmin) return tabs
    if (isSubadmin) return tabs.filter((tab) => tab.id !== "reviews")
    return []
  }, [isAdmin, isSubadmin])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUserRole(null)
        setCurrentUserId(null)
        setCurrentUserLoading(false)
        return
      }

      setCurrentUserId(user.uid)
      setCurrentUserLoading(true)
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data() as { role?: UserRole }
          setCurrentUserRole(data.role ?? "user")
        } else {
          setCurrentUserRole("user")
        }
      } catch (error) {
        console.error("Loading current user role failed:", error)
        setCurrentUserRole("user")
      } finally {
        setCurrentUserLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (currentUserLoading) return
    if (visibleTabs.length === 0) return
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id)
    }
  }, [activeTab, currentUserLoading, visibleTabs])

  // Load reviews from Firestore
  useEffect(() => {
    if (currentUserLoading) return
    if (!canManageReviews) {
      setReviews([])
      setReviewsLoading(false)
      return
    }
    setReviewsLoading(true)
    const reviewsRef = collection(db, "reviews")
    let reviewsQuery
    try {
      reviewsQuery = query(reviewsRef, orderBy("createdAt", "desc"))
    } catch (error) {
      reviewsQuery = query(reviewsRef)
    }

    const unsubscribe = onSnapshot(
      reviewsQuery,
      async (snapshot) => {
        // Get all listing IDs from reviews
        const listingIds = new Set<string>()
        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.listingId) {
            listingIds.add(data.listingId)
          }
        })

        // Fetch listing names from all collections
        const listingNames: Record<string, string> = {}
        const collections = ["feed", "school", "colleges", "kindergarden", "courses"]
        
        for (const collectionName of collections) {
          for (const listingId of listingIds) {
            if (!listingNames[listingId]) {
              try {
                const listingDocRef = doc(db, collectionName, listingId)
                const listingDoc = await getDoc(listingDocRef)
                if (listingDoc.exists()) {
                  listingNames[listingId] = listingDoc.data()?.name || listingId
                }
              } catch (error) {
                // Collection might not have this document, continue
              }
            }
          }
        }

        const nextReviews = snapshot.docs.map((doc) => {
          const data = doc.data()
          const listingId = data.listingId || ""
          const listingName = listingNames[listingId] || listingId || "Unknown Listing"
          
          return {
            id: doc.id,
            author: data.authorName || data.author || "Anonymous",
            rating: typeof data.rating === "number" ? data.rating : 0,
            message: data.message || "",
            source: listingId ? listingName : "User Review",
            status: (data.status || "Visible") as ReviewStatus,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : formatTimestamp(data.createdAt),
          }
        })
        setReviews(nextReviews)
        setReviewsLoading(false)
      },
      (error) => {
        console.error("Loading reviews failed:", error)
        if (error.code === "failed-precondition") {
          const fallbackQuery = query(reviewsRef)
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            async (snapshot) => {
              // Get all listing IDs from reviews
              const listingIds = new Set<string>()
              snapshot.docs.forEach((doc) => {
                const data = doc.data()
                if (data.listingId) {
                  listingIds.add(data.listingId)
                }
              })

              // Fetch listing names from all collections
              const listingNames: Record<string, string> = {}
              const collections = ["feed", "school", "colleges", "kindergarden", "courses"]
              
              for (const collectionName of collections) {
                for (const listingId of listingIds) {
                  if (!listingNames[listingId]) {
                    try {
                      const listingDocRef = doc(db, collectionName, listingId)
                      const listingDoc = await getDoc(listingDocRef)
                      if (listingDoc.exists()) {
                        listingNames[listingId] = listingDoc.data()?.name || listingId
                      }
                    } catch (error) {
                      // Collection might not have this document, continue
                    }
                  }
                }
              }

              const nextReviews = snapshot.docs.map((doc) => {
                const data = doc.data()
                const listingId = data.listingId || ""
                const listingName = listingNames[listingId] || listingId || "Unknown Listing"
                
                return {
                  id: doc.id,
                  author: data.authorName || data.author || "Anonymous",
                  rating: typeof data.rating === "number" ? data.rating : 0,
                  message: data.message || "",
                  source: listingId ? listingName : "User Review",
                  status: (data.status || "Visible") as ReviewStatus,
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : formatTimestamp(data.createdAt),
                }
              })
              setReviews(nextReviews)
              setReviewsLoading(false)
            },
            (fallbackError) => {
              console.error("Loading reviews failed (fallback):", fallbackError)
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
  }, [canManageReviews, currentUserLoading])

  // Load users
  useEffect(() => {
    if (currentUserLoading) return
    if (!isAdmin && !isSubadmin) {
      setUsers([])
      setUsersLoading(false)
      return
    }
    setUsersLoading(true)
    const usersRef = collection(db, "users")
    const usersQuery = query(usersRef, orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const nextUsers = snapshot.docs.map((doc) => {
          const data = doc.data() as Partial<UserRecord>
          return {
            id: doc.id,
            name: data.name || "Unknown user",
            phone: data.phone || "",
            email: data.email || "",
            provider: data.provider || "",
            createdAt: data.createdAt,
            role: (data.role as UserRole) || "user",
          }
        })
        setUsers(nextUsers)
        setUsersLoading(false)
        setUsersError(null)
      },
      (error) => {
        console.error("Loading users failed:", error)
        setUsers([])
        setUsersLoading(false)
        setUsersError(error?.message ?? "Unable to load users.")
      }
    )

    return () => unsubscribe()
  }, [currentUserLoading, isAdmin, isSubadmin])

  // Load schools
  useEffect(() => {
    if (currentUserLoading) return
    if (!canManageListings) {
      setSchools([])
      setSchoolsLoading(false)
      return
    }
    setSchoolsLoading(true)
    const schoolsRef = collection(db, "feed")
    // Try with orderBy first, fallback to simple query if index is missing
    let schoolsQuery
    try {
      schoolsQuery = query(schoolsRef, orderBy("updatedAt", "desc"))
    } catch (error) {
      schoolsQuery = query(schoolsRef)
    }

    const unsubscribe = onSnapshot(
      schoolsQuery,
      (snapshot) => {
        const nextSchools = snapshot.docs.map(mapListingData)
          .sort((a, b) => {
            // Client-side sort by updatedAt (newest first)
            const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
            const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
            return bTime - aTime
          })
        setSchools(nextSchools)
        setSchoolsLoading(false)
      },
      (error) => {
        console.error("Loading feed failed:", error)
        // If orderBy fails, try without it
        if (error.code === "failed-precondition") {
          const fallbackQuery = query(schoolsRef)
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            (snapshot) => {
              const nextSchools = snapshot.docs.map(mapListingData)
                .sort((a, b) => {
                  const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
                  const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
                  return bTime - aTime
                })
              setSchools(nextSchools)
              setSchoolsLoading(false)
            },
            (fallbackError) => {
              console.error("Loading feed failed (fallback):", fallbackError)
              setSchools([])
              setSchoolsLoading(false)
            }
          )
          return () => fallbackUnsubscribe()
        } else {
          setSchools([])
          setSchoolsLoading(false)
        }
      }
    )

    return () => unsubscribe()
  }, [canManageListings, currentUserLoading])

  // Load colleges
  useEffect(() => {
    if (currentUserLoading) return
    if (!canManageListings) {
      setColleges([])
      setCollegesLoading(false)
      return
    }
    setCollegesLoading(true)
    const collegesRef = collection(db, "school")
    let collegesQuery
    try {
      collegesQuery = query(collegesRef, orderBy("updatedAt", "desc"))
    } catch (error) {
      collegesQuery = query(collegesRef)
    }

    const unsubscribe = onSnapshot(
      collegesQuery,
      (snapshot) => {
        const nextColleges = snapshot.docs.map(mapListingData).sort((a, b) => {
          const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
          const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
          return bTime - aTime
        })
        setColleges(nextColleges)
        setCollegesLoading(false)
      },
      (error) => {
        console.error("Loading school failed:", error)
        if (error.code === "failed-precondition") {
          const fallbackQuery = query(collegesRef)
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            (snapshot) => {
              const nextColleges = snapshot.docs.map(mapListingData).sort((a, b) => {
                const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
                const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
                return bTime - aTime
              })
              setColleges(nextColleges)
              setCollegesLoading(false)
            },
            (fallbackError) => {
              console.error("Loading school failed (fallback):", fallbackError)
              setColleges([])
              setCollegesLoading(false)
            }
          )
          return () => fallbackUnsubscribe()
        } else {
          setColleges([])
          setCollegesLoading(false)
        }
      }
    )

    return () => unsubscribe()
  }, [canManageListings, currentUserLoading])

  // Load jobs
  useEffect(() => {
    if (currentUserLoading) return
    if (!canManageListings) {
      setJobs([])
      setJobsLoading(false)
      return
    }
    setJobsLoading(true)
    const jobsRef = collection(db, "colleges")
    let jobsQuery
    try {
      jobsQuery = query(jobsRef, orderBy("updatedAt", "desc"))
    } catch (error) {
      jobsQuery = query(jobsRef)
    }

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        const nextJobs = snapshot.docs.map(mapListingData).sort((a, b) => {
          const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
          const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
          return bTime - aTime
        })
        setJobs(nextJobs)
        setJobsLoading(false)
      },
      (error) => {
        console.error("Loading colleges failed:", error)
        if (error.code === "failed-precondition") {
          const fallbackQuery = query(jobsRef)
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            (snapshot) => {
              const nextJobs = snapshot.docs.map(mapListingData).sort((a, b) => {
                const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
                const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
                return bTime - aTime
              })
              setJobs(nextJobs)
              setJobsLoading(false)
            },
            (fallbackError) => {
              console.error("Loading colleges failed (fallback):", fallbackError)
              setJobs([])
              setJobsLoading(false)
            }
          )
          return () => fallbackUnsubscribe()
        } else {
          setJobs([])
          setJobsLoading(false)
        }
      }
    )

    return () => unsubscribe()
  }, [canManageListings, currentUserLoading])

  // Load companies
  useEffect(() => {
    if (currentUserLoading) return
    if (!canManageListings) {
      setCompanies([])
      setCompaniesLoading(false)
      return
    }
    setCompaniesLoading(true)
    const companiesRef = collection(db, "kindergarden")
    let companiesQuery
    try {
      companiesQuery = query(companiesRef, orderBy("updatedAt", "desc"))
    } catch (error) {
      companiesQuery = query(companiesRef)
    }

    const unsubscribe = onSnapshot(
      companiesQuery,
      (snapshot) => {
        const nextCompanies = snapshot.docs.map(mapListingData).sort((a, b) => {
          const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
          const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
          return bTime - aTime
        })
        setCompanies(nextCompanies)
        setCompaniesLoading(false)
      },
      (error) => {
        console.error("Loading kindergarden failed:", error)
        if (error.code === "failed-precondition") {
          const fallbackQuery = query(companiesRef)
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            (snapshot) => {
              const nextCompanies = snapshot.docs.map(mapListingData).sort((a, b) => {
                const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
                const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
                return bTime - aTime
              })
              setCompanies(nextCompanies)
              setCompaniesLoading(false)
            },
            (fallbackError) => {
              console.error("Loading kindergarden failed (fallback):", fallbackError)
              setCompanies([])
              setCompaniesLoading(false)
            }
          )
          return () => fallbackUnsubscribe()
        } else {
          setCompanies([])
          setCompaniesLoading(false)
        }
      }
    )

    return () => unsubscribe()
  }, [canManageListings, currentUserLoading])

  // Load courses
  useEffect(() => {
    if (currentUserLoading) return
    if (!canManageListings) {
      setCourses([])
      setCoursesLoading(false)
      return
    }
    setCoursesLoading(true)
    const coursesRef = collection(db, "courses")
    let coursesQuery
    try {
      coursesQuery = query(coursesRef, orderBy("updatedAt", "desc"))
    } catch (error) {
      coursesQuery = query(coursesRef)
    }

    const unsubscribe = onSnapshot(
      coursesQuery,
      (snapshot) => {
        const nextCourses = snapshot.docs.map(mapListingData).sort((a, b) => {
          const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
          const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
          return bTime - aTime
        })
        setCourses(nextCourses)
        setCoursesLoading(false)
      },
      (error) => {
        console.error("Loading courses failed:", error)
        if (error.code === "failed-precondition") {
          const fallbackQuery = query(coursesRef)
          const fallbackUnsubscribe = onSnapshot(
            fallbackQuery,
            (snapshot) => {
              const nextCourses = snapshot.docs.map(mapListingData).sort((a, b) => {
                const aTime = typeof a.updatedAt === "string" ? new Date(a.updatedAt).getTime() : 0
                const bTime = typeof b.updatedAt === "string" ? new Date(b.updatedAt).getTime() : 0
                return bTime - aTime
              })
              setCourses(nextCourses)
              setCoursesLoading(false)
            },
            (fallbackError) => {
              console.error("Loading courses failed (fallback):", fallbackError)
              setCourses([])
              setCoursesLoading(false)
            }
          )
          return () => fallbackUnsubscribe()
        } else {
          setCourses([])
          setCoursesLoading(false)
        }
      }
    )

    return () => unsubscribe()
  }, [canManageListings, currentUserLoading])

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query)
      )
    })
  }, [userQuery, users])

  const handleRoleChange = async (userId: string, nextRole: UserRole) => {
    if (!isAdmin) return
    if (!userId) return
    if (userId === currentUserId) {
      setRoleUpdateError("You cannot change your own role.")
      return
    }
    setRoleUpdateError(null)
    setRoleUpdateId(userId)
    try {
      await updateDoc(doc(db, "users", userId), {
        role: nextRole,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Updating user role failed:", error)
      setRoleUpdateError("Failed to update user role. Please try again.")
    } finally {
      setRoleUpdateId(null)
    }
  }

  const listingsTotal = schools.length + colleges.length + jobs.length + companies.length + courses.length
  const publishedListings =
    schools.filter((item) => item.status === "Published").length +
    colleges.filter((item) => item.status === "Published").length +
    jobs.filter((item) => item.status === "Published").length +
    companies.filter((item) => item.status === "Published").length +
    courses.filter((item) => item.status === "Published").length
  const hiddenReviews = reviews.filter((review) => review.status === "Hidden").length

  const listingConfigMap: Record<ListingTabId, { label: string; items: ListingItem[]; setItems: Dispatch<SetStateAction<ListingItem[]>>; collectionName: string; loading: boolean }> = {
    schools: { label: "Feeds", items: schools, setItems: setSchools, collectionName: "feed", loading: schoolsLoading },
    colleges: { label: "School", items: colleges, setItems: setColleges, collectionName: "school", loading: collegesLoading },
    jobs: { label: "Colleges", items: jobs, setItems: setJobs, collectionName: "colleges", loading: jobsLoading },
    companies: { label: "Kindergarden", items: companies, setItems: setCompanies, collectionName: "kindergarden", loading: companiesLoading },
    courses: { label: "Courses", items: courses, setItems: setCourses, collectionName: "courses", loading: coursesLoading },
  }

  const activeListingConfig =
    canManageListings &&
    (activeTab === "schools" || activeTab === "colleges" || activeTab === "jobs" || activeTab === "companies" || activeTab === "courses")
      ? listingConfigMap[activeTab]
      : null

  if (currentUserLoading) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] text-[#E6E8EA]">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold">Checking admin access...</h1>
            <p className="mt-2 text-sm text-white/60">Please wait while we verify your permissions.</p>
          </div>
        </div>
      </div>
    )
  }

  if (visibleTabs.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0D0F] text-[#E6E8EA]">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <h1 className="text-2xl font-semibold">Admin access only</h1>
            <p className="mt-2 text-sm text-white/60">
              This portal is restricted to admins and subadmins. Please sign in with an approved account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#0B0D0F] text-[#E6E8EA]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(12,170,65,0.16),_transparent_55%)]" />
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
              Admin Portal
            </span>
            <h1 className="mt-3 text-3xl font-semibold">Manage WorkHub</h1>
            <p className="mt-1 text-sm text-white/60">
              Review users, publish listings, and keep community feedback organized.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="h-9 bg-white/10 text-white hover:bg-white/20">Export snapshot</Button>
            <Button className="h-9 bg-orange-500 text-white hover:bg-orange-600">New announcement</Button>
          </div>
        </header>

        <section className={`mt-6 grid gap-4 ${canManageReviews ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <SummaryCard title="Users" value={usersLoading ? "Loading..." : `${users.length}`} detail="Signed up" />
          <SummaryCard title="Listings" value={`${publishedListings}/${listingsTotal}`} detail="Published" />
          {canManageReviews && <SummaryCard title="Reviews" value={`${hiddenReviews}`} detail="Hidden" />}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-2">
          <div className="flex flex-wrap gap-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          {(isAdmin || isSubadmin) && activeTab === "users" && (
            <div className="rounded-2xl border border-white/10 bg-[#121518] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Users</h2>
                  <p className="text-sm text-white/60">Latest sign-ins synced from Firestore.</p>
                </div>
                <Input
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="h-10 w-full bg-white/10 text-white placeholder:text-white/40 sm:w-72"
                />
              </div>

              {usersError && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {usersError}
                </div>
              )}
              {roleUpdateError && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {roleUpdateError}
                </div>
              )}

              <div className="mt-4 space-y-3">
                {usersLoading ? (
                  <p className="text-sm text-white/60">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-sm text-white/60">No users match this search yet.</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-white/60">
                          {user.email || "No email"} • {user.phone || "No phone"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                        <span className="rounded-full bg-white/10 px-2 py-1">
                          {user.provider || "manual"}
                        </span>
                        <span>{formatTimestamp(user.createdAt)}</span>
                      </div>
                      {(isAdmin || isSubadmin) && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/40">Role</span>
                          <select
                            value={user.role || "user"}
                            onChange={(event) => handleRoleChange(user.id, event.target.value as UserRole)}
                            disabled={!isAdmin || roleUpdateId === user.id || user.id === currentUserId}
                            className="h-8 rounded-md border border-white/10 bg-white/10 px-2 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                            title={
                              !isAdmin
                                ? "Only admins can change roles."
                                : user.id === currentUserId
                                  ? "You cannot change your own role."
                                  : "Change user role"
                            }
                          >
                            <option value="user">User</option>
                            <option value="subadmin">Subadmin</option>
                            <option value="admin">Admin</option>
                          </select>
                          {roleUpdateId === user.id && <span className="text-white/40">Saving...</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeListingConfig && (
            <ListingsPanel
              key={activeListingConfig.label}
              label={activeListingConfig.label}
              items={activeListingConfig.items}
              setItems={activeListingConfig.setItems}
              collectionName={activeListingConfig.collectionName}
              loading={activeListingConfig.loading}
            />
          )}

          {activeTab === "reviews" && canManageReviews && (
            <ReviewsPanel reviews={reviews} setReviews={setReviews} loading={reviewsLoading} />
          )}
        </section>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-white/50">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/60">{detail}</p>
    </div>
  )
}

function ListingsPanel({
  label,
  items,
  setItems,
  collectionName,
  loading,
}: {
  label: string
  items: ListingItem[]
  setItems: Dispatch<SetStateAction<ListingItem[]>>
  collectionName: string
  loading: boolean
}) {
  const [draft, setDraft] = useState({
    name: "",
    state: "",
    city: "",
    status: "Published" as ListingStatus,
    whatsNew: "",
    description: "",
    others: "",
    collegeIds: [] as string[],
    rating: "",
    jobsCount: "",
    reviewsCount: "",
    salariesCount: "",
    locationsCount: "",
    logoUrl: "",
    website: "",
    locationLink: "",
    employeeCount: "",
    type: "",
    revenue: "",
    founded: "",
    industry: "",
    photos: "",
    ceoName: "",
    ceoPhotoUrl: "",
    mission: "",
    vision: "",
    facultyCount: "",
    courseName: "",
    courseField: "",
    courseFacultyMembers: "",
    courseStudentsEnrolled: "",
  })
  const [activeFormSection, setActiveFormSection] = useState<"whatsnew" | "reviews" | "about" | "photos" | "others">("whatsnew")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({})
  const isCollegeLikeForm = ["colleges", "school", "kindergarden"].includes(collectionName)
  const isCoursesForm = collectionName === "courses"
  const [collegeOptions, setCollegeOptions] = useState<Array<{ id: string; name: string; city: string; state: string; status: ListingStatus }>>([])
  const [collegeOptionsLoading, setCollegeOptionsLoading] = useState(false)
  const [collegeSearch, setCollegeSearch] = useState("")
  const [seedingCourses, setSeedingCourses] = useState(false)
  const [seedInfo, setSeedInfo] = useState<string | null>(null)

  const handleSeedIndiaCourses = async () => {
    if (!isCoursesForm) return
    setSeedingCourses(true)
    setSeedInfo(null)
    setFormError(null)
    try {
      const normalize = (value: string) => value.trim().toLowerCase()
      const existingKeys = new Set(
        items.map((item) => `${normalize(item.courseName || item.name || "")}|${normalize(item.courseField || "")}`)
      )
      const toCreate = INDIA_COURSES.filter((course) => {
        const key = `${normalize(course.courseName)}|${normalize(course.courseField)}`
        return !existingKeys.has(key)
      })

      if (toCreate.length === 0) {
        setSeedInfo("All India courses are already present.")
        return
      }

      const batch = writeBatch(db)
      toCreate.forEach((course) => {
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
      setSeedInfo(`Added ${toCreate.length} courses.`)
    } catch (error) {
      console.error("Seeding India courses failed:", error)
      setFormError("Failed to seed India courses. Please try again.")
    } finally {
      setSeedingCourses(false)
    }
  }

  useEffect(() => {
    if (!isCoursesForm) return
    setCollegeOptionsLoading(true)
    const collegesRef = collection(db, "colleges")
    const unsubscribe = onSnapshot(
      query(collegesRef),
      (snapshot) => {
        const nextColleges = snapshot.docs
          .map((doc) => {
            const data = doc.data() as Record<string, unknown>
            return {
              id: doc.id,
              name: typeof data.name === "string" ? data.name : "",
              city: typeof data.city === "string" ? data.city : "",
              state: typeof data.state === "string" ? data.state : "",
              status: ((typeof data.status === "string" ? data.status : "Draft") as ListingStatus) ?? "Draft",
            }
          })
          .sort((a, b) => a.name.localeCompare(b.name))
        setCollegeOptions(nextColleges)
        setCollegeOptionsLoading(false)
      },
      (error) => {
        console.error("Loading colleges list failed:", error)
        setCollegeOptions([])
        setCollegeOptionsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [isCoursesForm])

  const filteredItems = useMemo(() => {
    const query = filterQuery.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.city?.toLowerCase().includes(query) ||
        item.state?.toLowerCase().includes(query)
      )
    })
  }, [filterQuery, items])

  const filteredCollegeOptions = useMemo(() => {
    if (!isCoursesForm) return []
    const query = collegeSearch.trim().toLowerCase()
    if (!query) return collegeOptions
    return collegeOptions.filter((college) => {
      return (
        college.name.toLowerCase().includes(query) ||
        college.city.toLowerCase().includes(query) ||
        college.state.toLowerCase().includes(query)
      )
    })
  }, [collegeOptions, collegeSearch, isCoursesForm])

  const resetDraft = () => {
    setDraft({
      name: "",
      state: "",
      city: "",
      status: "Published",
      whatsNew: "",
      description: "",
      others: "",
      collegeIds: [] as string[],
      rating: "",
      jobsCount: "",
      reviewsCount: "",
      salariesCount: "",
      locationsCount: "",
      logoUrl: "",
      website: "",
      locationLink: "",
      employeeCount: "",
      type: "",
      revenue: "",
      founded: "",
      industry: "",
      photos: "",
      ceoName: "",
      ceoPhotoUrl: "",
      mission: "",
      vision: "",
      facultyCount: "",
      courseName: "",
      courseField: "",
      courseFacultyMembers: "",
      courseStudentsEnrolled: "",
    })
    setEditingId(null)
    setFormError(null)
    setPhotoFiles([])
    setUploadProgress({})
    setActiveFormSection("whatsnew")
  }

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File, index: number): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary credentials not configured. Please check your environment variables.")
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)
    formData.append("folder", "listings") // Optional: organize uploads in a folder

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.secure_url // Returns the CDN URL
    } catch (error: any) {
      console.error(`Error uploading ${file.name}:`, error)
      throw error
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      setFormError("Please select image files only.")
      return
    }

    // Limit to 10 photos total
    const existingUrls = draft.photos
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url !== "" && (url.startsWith("http://") || url.startsWith("https://")))
    const remainingSlots = 10 - (existingUrls.length + photoFiles.length)

    if (imageFiles.length > remainingSlots) {
      setFormError(`You can only upload ${remainingSlots} more photo(s). Maximum 10 photos allowed.`)
      return
    }

    // Check file sizes (max 10MB per file)
    const oversizedFiles = imageFiles.filter((file) => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setFormError(`Some files are too large. Maximum file size is 10MB.`)
      return
    }

    setPhotoFiles((prev) => [...prev, ...imageFiles.slice(0, remainingSlots)])
    setFormError(null)
  }

  const removePhotoFile = (index: number) => {
    setPhotoFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Clear progress for removed file
      setUploadProgress((prevProgress) => {
        const newProgress = { ...prevProgress }
        delete newProgress[index]
        return newProgress
      })
      return newFiles
    })
  }

  const handleSave = async () => {
    const trimmedName = draft.name.trim()
    if (!trimmedName) {
      setFormError("Name is required.")
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (!collectionName) {
        throw new Error("Collection name is missing")
      }
      
      const nextCollegeIds = isCoursesForm ? draft.collegeIds.filter((value) => typeof value === "string" && value.trim() !== "") : []
      const previousCollegeIds =
        isCoursesForm && editingId ? (items.find((item) => item.id === editingId)?.collegeIds ?? []) : []

      const cityValue = draft.city.trim()
      const stateValue = draft.state.trim()
      // Derive location from city and state for backward compatibility
      const derivedLocation = [cityValue, stateValue].filter(Boolean).join(", ")
      
      const listingData: Record<string, unknown> = {
        name: trimmedName,
        location: derivedLocation, // Keep for backward compatibility, derived from city+state
        status: draft.status,
        description: draft.description.trim() || "",
        updatedAt: serverTimestamp(),
      }

      // Add What's New field
      const whatsNew = draft.whatsNew.trim()
      if (whatsNew) listingData.whatsNew = whatsNew

      // Add Others field
      const others = draft.others.trim()
      if (others) listingData.others = others

      const courseName = draft.courseName.trim()
      if (courseName) listingData.courseName = courseName

      const courseField = draft.courseField.trim()
      if (courseField) listingData.courseField = courseField

      const courseFacultyMembers = parseOptionalNumber(draft.courseFacultyMembers)
      if (courseFacultyMembers !== null) listingData.courseFacultyMembers = courseFacultyMembers

      const courseStudentsEnrolled = parseOptionalNumber(draft.courseStudentsEnrolled)
      if (courseStudentsEnrolled !== null) listingData.courseStudentsEnrolled = courseStudentsEnrolled

      if (isCoursesForm) {
        listingData.collegeIds = nextCollegeIds
      }

      // Add Mission field
      const mission = draft.mission.trim()
      if (mission) listingData.mission = mission

      // Add Vision field
      const vision = draft.vision.trim()
      if (vision) listingData.vision = vision

      // Add Faculty Count field
      const facultyCount = parseOptionalNumber(draft.facultyCount)
      if (facultyCount !== null) listingData.facultyCount = facultyCount

      // Only add optional fields if they have values
      if (stateValue) listingData.state = stateValue
      if (cityValue) listingData.city = cityValue
      
      const rating = parseOptionalNumber(draft.rating)
      if (rating !== null) listingData.rating = rating
      
      const jobsCount = parseOptionalNumber(draft.jobsCount)
      if (jobsCount !== null) listingData.jobsCount = jobsCount
      
      const reviewsCount = parseOptionalNumber(draft.reviewsCount)
      if (reviewsCount !== null) listingData.reviewsCount = reviewsCount
      
      const salariesCount = parseOptionalNumber(draft.salariesCount)
      if (salariesCount !== null) listingData.salariesCount = salariesCount
      
      const locationsCount = parseOptionalNumber(draft.locationsCount)
      if (locationsCount !== null) listingData.locationsCount = locationsCount
      
      const logoUrl = draft.logoUrl.trim()
      if (logoUrl) listingData.logoUrl = logoUrl
      
      const website = draft.website.trim()
      if (website) listingData.website = website
      
      const locationLink = draft.locationLink.trim()
      if (locationLink) listingData.locationLink = locationLink
      
      const employeeCount = draft.employeeCount.trim()
      if (employeeCount) listingData.employeeCount = employeeCount
      
      const type = draft.type.trim()
      if (type) listingData.type = type
      
      const revenue = draft.revenue.trim()
      if (revenue) listingData.revenue = revenue
      
      const founded = draft.founded.trim()
      if (founded) listingData.founded = founded
      
      const industry = draft.industry.trim()
      if (industry) listingData.industry = industry
      
      const ceoName = draft.ceoName.trim()
      if (ceoName) listingData.ceoName = ceoName
      
      const ceoPhotoUrl = draft.ceoPhotoUrl.trim()
      if (ceoPhotoUrl) listingData.ceoPhotoUrl = ceoPhotoUrl
      
      // Collect photo URLs
      let photoUrls: string[] = []

      // Parse photos from textarea (one URL per line)
      const photosText = draft.photos.trim()
      if (photosText) {
        const photosArray = photosText
          .split("\n")
          .map((url) => url.trim())
          .filter((url) => url !== "" && (url.startsWith("http://") || url.startsWith("https://")))
        photoUrls = [...photoUrls, ...photosArray]
      }

      // Upload new photo files to Cloudinary
      if (photoFiles.length > 0) {
        setUploadingPhotos(true)
        try {
          const uploadPromises = photoFiles.map(async (file, index) => {
            try {
              const url = await uploadToCloudinary(file, index)
              setUploadProgress((prev) => ({ ...prev, [index]: 100 }))
              return url
            } catch (error) {
              console.error(`Failed to upload ${file.name}:`, error)
              throw error
            }
          })

          const uploadedUrls = await Promise.all(uploadPromises)
          photoUrls = [...photoUrls, ...uploadedUrls]
          console.log("All photos uploaded successfully to Cloudinary")
        } catch (error: any) {
          console.error("Error uploading photos to Cloudinary:", error)
          const errorMessage = error?.message || "Unknown error occurred"
          
          // Provide helpful error messages
          if (errorMessage.includes("Cloudinary credentials")) {
            setFormError("Cloudinary is not configured. Please check CLOUDINARY_SETUP.md for setup instructions.")
          } else if (errorMessage.includes("Upload preset")) {
            setFormError("Cloudinary upload preset not found. Please check your environment variables.")
          } else {
            setFormError(`Failed to upload photos: ${errorMessage}. Please try again.`)
          }
          setUploadingPhotos(false)
          setSaving(false)
          return
        } finally {
          setUploadingPhotos(false)
          setUploadProgress({})
        }
      }

      // Add photos to listing data
      if (photoUrls.length > 0) {
        listingData.photos = photoUrls
      }

      console.log("Saving to collection:", collectionName)
      console.log("Listing data:", listingData)

      let savedId = editingId
      if (editingId) {
        // Update existing listing
        const listingRef = doc(db, collectionName, editingId)
        await updateDoc(listingRef, listingData)
      } else {
        // Create new listing
        const docRef = await addDoc(collection(db, collectionName), {
          ...listingData,
          createdAt: serverTimestamp(),
        })
        savedId = docRef.id
    }

      if (isCoursesForm && savedId) {
        const idsToAdd = nextCollegeIds.filter((id) => !previousCollegeIds.includes(id))
        const idsToRemove = previousCollegeIds.filter((id) => !nextCollegeIds.includes(id))
        if (idsToAdd.length > 0 || idsToRemove.length > 0) {
          const batch = writeBatch(db)
          idsToAdd.forEach((collegeId) => {
            batch.update(doc(db, "colleges", collegeId), { courseIds: arrayUnion(savedId!) })
          })
          idsToRemove.forEach((collegeId) => {
            batch.update(doc(db, "colleges", collegeId), { courseIds: arrayRemove(savedId!) })
          })
          await batch.commit()
        }
      }

    resetDraft()
    } catch (error: any) {
      console.error("Error saving listing:", error)
      const errorMessage = error?.message || "Unknown error occurred"
      setFormError(`Failed to save listing: ${errorMessage}. Please check the console for details.`)
    } finally {
      setSaving(false)
      setUploadingPhotos(false)
    }
  }

  const handleEdit = (item: ListingItem) => {
    setDraft({
      name: item.name,
      state: item.state || "",
      city: item.city || "",
      status: item.status,
      whatsNew: item.whatsNew || "",
      description: item.description,
      others: item.others || "",
      collegeIds: Array.isArray(item.collegeIds) ? item.collegeIds : [],
      rating: item.rating != null ? String(item.rating) : "",
      jobsCount: item.jobsCount != null ? String(item.jobsCount) : "",
      reviewsCount: item.reviewsCount != null ? String(item.reviewsCount) : "",
      salariesCount: item.salariesCount != null ? String(item.salariesCount) : "",
      locationsCount: item.locationsCount != null ? String(item.locationsCount) : "",
      logoUrl: item.logoUrl || "",
      website: item.website || "",
      locationLink: item.locationLink || "",
      employeeCount: item.employeeCount || "",
      type: item.type || "",
      revenue: item.revenue || "",
      founded: item.founded || "",
      industry: item.industry || "",
      photos: "",
      ceoName: item.ceoName || "",
      ceoPhotoUrl: item.ceoPhotoUrl || "",
      mission: item.mission || "",
      vision: item.vision || "",
      facultyCount: item.facultyCount != null ? String(item.facultyCount) : "",
      courseName: item.courseName || "",
      courseField: item.courseField || "",
      courseFacultyMembers: item.courseFacultyMembers != null ? String(item.courseFacultyMembers) : "",
      courseStudentsEnrolled: item.courseStudentsEnrolled != null ? String(item.courseStudentsEnrolled) : "",
    })
    setEditingId(item.id)
    setFormError(null)
    setPhotoFiles([])
    setUploadProgress({})
    // Convert photos array to newline-separated string for textarea
    if (item.photos && item.photos.length > 0) {
      setDraft((prev) => ({
        ...prev,
        photos: item.photos!.join("\n")
      }))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) {
      return
    }

    try {
      if (isCoursesForm) {
        const associatedCollegeIds = items.find((item) => item.id === id)?.collegeIds ?? []
        if (associatedCollegeIds.length > 0) {
          const batch = writeBatch(db)
          associatedCollegeIds.forEach((collegeId) => {
            batch.update(doc(db, "colleges", collegeId), { courseIds: arrayRemove(id) })
          })
          await batch.commit()
        }
      }
      await deleteDoc(doc(db, collectionName, id))
    if (editingId === id) {
      resetDraft()
      }
    } catch (error) {
      console.error("Error deleting listing:", error)
      setFormError("Failed to delete listing. Please try again.")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-white/10 bg-[#121518] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{label} listings</h2>
            <p className="text-sm text-white/60">Add, edit, or retire a listing.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()} listings`}
              className="h-10 w-full bg-white/10 text-white placeholder:text-white/40 sm:w-64"
            />
            {isCoursesForm && (
              <Button
                size="sm"
                className="h-10 bg-orange-500 text-white hover:bg-orange-600"
                onClick={handleSeedIndiaCourses}
                disabled={seedingCourses || saving}
              >
                {seedingCourses ? "Seeding..." : "Seed India courses"}
              </Button>
            )}
          </div>
        </div>
        {seedInfo && <p className="mt-3 text-xs text-white/60">{seedInfo}</p>}

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-white/60">Loading listings...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-white/60">No listings match this search.</p>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-white/60">
                    {[item.city, item.state].filter(Boolean).join(", ") || "No location"} • {item.updatedAt}
                  </p>
                  <p className="mt-2 text-xs text-white/60">{item.description || "No description"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-2 py-1">{item.status}</span>
                  <Button
                    size="sm"
                    className="h-8 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121518] p-6">
        <h3 className="text-lg font-semibold">{editingId ? `Edit ${label}` : `Add ${label}`}</h3>
        <p className="text-sm text-white/60">Fill in the details and save.</p>
        <p className="text-xs text-white/40">Firestore collection: {collectionName}</p>

        {/* Basic Info */}
        <div className="mt-4 space-y-3">
          <Input
            value={draft.name}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            placeholder={`${label} name`}
            className="h-10 bg-white/10 text-white placeholder:text-white/40"
          />
          {isCollegeLikeForm && (
            <Input
              value={draft.logoUrl}
              onChange={(event) => setDraft((prev) => ({ ...prev, logoUrl: event.target.value }))}
              placeholder="Logo URL"
              className="h-10 bg-white/10 text-white placeholder:text-white/40"
            />
          )}
        </div>

        {/* Form Sections Tabs */}
        <div className="mt-6 border-b border-white/10">
          <div className="flex gap-4">
            {(["whatsnew", "reviews", "about", "photos", "others"] as const).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveFormSection(section)}
                className={`pb-3 px-1 text-sm font-semibold transition-colors ${
                  activeFormSection === section
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                {section === "whatsnew"
                  ? "What's New"
                  : section === "others"
                    ? "Courses"
                    : section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Form Sections Content */}
        <div className="mt-4 space-y-4">
          {/* What's New Section */}
          {activeFormSection === "whatsnew" && (
            <div>
              <label className="block text-xs text-white/60 mb-2">What's New</label>
              <Textarea
                value={draft.whatsNew}
                onChange={(event) => setDraft((prev) => ({ ...prev, whatsNew: event.target.value }))}
                placeholder="Enter latest news and updates..."
                className="min-h-[150px] bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
          )}

          {/* Reviews Section */}
          {activeFormSection === "reviews" && (
            <div className="space-y-3">
              <p className="text-sm text-white/60">Reviews are managed separately in the Reviews tab.</p>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">To manage reviews, go to the "Reviews" tab in the main navigation.</p>
              </div>
            </div>
          )}

          {/* About Section */}
          {activeFormSection === "about" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/60 mb-2">Website</label>
                <Input
                  value={draft.website}
                  onChange={(event) => setDraft((prev) => ({ ...prev, website: event.target.value }))}
                  placeholder="https://example.com"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              {!isCollegeLikeForm && (
                <div>
                  <label className="block text-xs text-white/60 mb-2">Logo URL</label>
                  <Input
                    value={draft.logoUrl}
                    onChange={(event) => setDraft((prev) => ({ ...prev, logoUrl: event.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="h-10 bg-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-white/60 mb-2">Founded In</label>
                <Input
                  type="text"
                  value={draft.founded}
                  onChange={(event) => setDraft((prev) => ({ ...prev, founded: event.target.value }))}
                  placeholder="Enter founding year (e.g., 1995)"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2">Total Number of Faculty</label>
                <Input
                  type="number"
                  value={draft.facultyCount}
                  onChange={(event) => setDraft((prev) => ({ ...prev, facultyCount: event.target.value }))}
                  placeholder="Enter total number of faculty"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={draft.city}
                  onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
                  placeholder="City"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
                <Input
                  value={draft.state}
                  onChange={(event) => setDraft((prev) => ({ ...prev, state: event.target.value }))}
                  placeholder="State"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2">Location URL (Google Maps / Apple Maps)</label>
                <Input
                  value={draft.locationLink}
                  onChange={(event) => setDraft((prev) => ({ ...prev, locationLink: event.target.value }))}
                  placeholder="https://maps.google.com/... or https://maps.apple.com/..."
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
                {draft.locationLink && (
                  <div className="mt-2">
                    <a
                      href={draft.locationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-orange-500 hover:text-orange-400"
                    >
                      Preview Location Link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2">Mission</label>
                <Textarea
                  value={draft.mission}
                  onChange={(event) => setDraft((prev) => ({ ...prev, mission: event.target.value }))}
                  placeholder="Enter mission statement..."
                  className="min-h-[120px] bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2">Vision</label>
                <Textarea
                  value={draft.vision}
                  onChange={(event) => setDraft((prev) => ({ ...prev, vision: event.target.value }))}
                  placeholder="Enter vision statement..."
                  className="min-h-[120px] bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={draft.type}
                  onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}
                  placeholder="Type (e.g., Public)"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
                <Input
                  value={draft.revenue}
                  onChange={(event) => setDraft((prev) => ({ ...prev, revenue: event.target.value }))}
                  placeholder="Revenue"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number"
                  min="0"
                  value={draft.locationsCount}
                  onChange={(event) => setDraft((prev) => ({ ...prev, locationsCount: event.target.value }))}
                  placeholder="Locations count"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
                <Input
                  value={draft.industry}
                  onChange={(event) => setDraft((prev) => ({ ...prev, industry: event.target.value }))}
                  placeholder="Industry"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-2">About</label>
                <Textarea
                  value={draft.description}
                  onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Enter description and details..."
                  className="min-h-[150px] bg-white/10 text-white placeholder:text-white/40"
                />
              </div>

              {/* CEO Information */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <label className="block text-xs text-white/60 mb-2">CEO Information</label>
                <Input
                  value={draft.ceoName}
                  onChange={(event) => setDraft((prev) => ({ ...prev, ceoName: event.target.value }))}
                  placeholder="CEO Name"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
                <Input
                  value={draft.ceoPhotoUrl}
                  onChange={(event) => setDraft((prev) => ({ ...prev, ceoPhotoUrl: event.target.value }))}
                  placeholder="CEO Photo URL"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40"
                />
                {draft.ceoPhotoUrl && (
                  <div className="mt-2">
                    <img
                      src={draft.ceoPhotoUrl}
                      alt="CEO Preview"
                      className="h-16 w-16 rounded-full object-cover border border-white/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos Section */}
          {activeFormSection === "photos" && (
            <div>
              <label className="block text-xs text-white/60 mb-2">Photos</label>
              <p className="text-xs text-white/40 mb-3">
                Upload photos directly or enter image URLs. Maximum 10 photos total.
              </p>
              
              {/* File Upload */}
              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-white/60 mb-2" />
                    <p className="text-sm text-white/80 font-medium">
                      {uploadingPhotos ? "Uploading..." : "Click to upload photos"}
                    </p>
                    <p className="text-xs text-white/50 mt-1">PNG, JPG, GIF up to 10MB each</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhotos || saving}
                  />
                </label>
              </div>

              {/* Photo Files Preview */}
              {photoFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-white/60 mb-2">
                    {photoFiles.length} file(s) ready to upload
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => removePhotoFile(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={uploadingPhotos || saving}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-[10px] text-white/80 bg-black/60 rounded px-1 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-white/60 bg-black/60 rounded px-1 mt-0.5">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* URL Input (Alternative/Additional) */}
              <details className="mb-4">
                <summary className="text-xs text-white/60 cursor-pointer hover:text-white/80 mb-2">
                  Or enter photo URLs manually (one per line)
                </summary>
                <Textarea
                  value={draft.photos}
                  onChange={(event) => setDraft((prev) => ({ ...prev, photos: event.target.value }))}
                  placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg&#10;https://example.com/photo3.jpg"
                  className="mt-2 min-h-[100px] bg-white/10 text-white placeholder:text-white/40"
                  rows={4}
                  disabled={uploadingPhotos || saving}
                />
              </details>
              
              {/* Combined Photo Preview */}
              {(() => {
                const photoUrls = draft.photos
                  .split("\n")
                  .map((url) => url.trim())
                  .filter((url) => url !== "" && (url.startsWith("http://") || url.startsWith("https://")))
                
                const totalPhotos = photoUrls.length + photoFiles.length
                
                if (totalPhotos > 0) {
                  return (
                    <div className="mt-4">
                      <p className="text-xs text-white/60 mb-2">
                        Total: {totalPhotos} photo(s) {photoFiles.length > 0 && `(${photoFiles.length} will be uploaded)`}
                      </p>
                      {photoUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {photoUrls.map((url, index) => (
                            <div key={`url-${index}`} className="relative group">
                              <img
                                src={url}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-white/10"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ccc' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EInvalid URL%3C/text%3E%3C/svg%3E"
                                }}
                              />
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                return null
              })()}
              
              {/* Cloudinary Setup Info */}
              {(!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) && (
                <div className="mt-4 p-3 rounded-lg border border-orange-500/30 bg-orange-500/10">
                  <p className="text-xs text-orange-300 mb-2 font-semibold">⚠️ Cloudinary Not Configured</p>
                  <p className="text-xs text-orange-200/80 mb-2">
                    To enable direct photo uploads, please set up Cloudinary:
                  </p>
                  <ol className="text-xs text-orange-200/70 space-y-1 list-decimal list-inside ml-2">
                    <li>Create a free account at <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-orange-300 hover:text-orange-200 underline">cloudinary.com</a></li>
                    <li>Create an unsigned upload preset</li>
                    <li>Add environment variables (see CLOUDINARY_SETUP.md)</li>
                  </ol>
                  <p className="text-xs text-orange-200/70 mt-2">
                    Until then, you can still use the URL input method above.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Courses Section */}
          {activeFormSection === "others" && (
            <div className="space-y-3 w-full">
              <label className="block text-xs text-white/60 mb-2">Courses</label>
              {isCoursesForm && (
                <div className="space-y-3">
                  <Input
                    value={draft.courseName}
                    onChange={(event) => setDraft((prev) => ({ ...prev, courseName: event.target.value }))}
                    placeholder="Course name"
                    className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                  />
                  <Input
                    value={draft.courseField}
                    onChange={(event) => setDraft((prev) => ({ ...prev, courseField: event.target.value }))}
                    placeholder="Course field"
                    className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                  />
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
                    <Input
                      type="number"
                      min="0"
                      value={draft.courseFacultyMembers}
                      onChange={(event) => setDraft((prev) => ({ ...prev, courseFacultyMembers: event.target.value }))}
                      placeholder="Faculty members"
                      className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={draft.courseStudentsEnrolled}
                      onChange={(event) => setDraft((prev) => ({ ...prev, courseStudentsEnrolled: event.target.value }))}
                      placeholder="Students currently enrolled"
                      className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                    />
                  </div>
                </div>
              )}

              {isCoursesForm && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-white/70">Colleges offering this course</p>
                    <p className="text-xs text-white/50">{draft.collegeIds.length} selected</p>
                  </div>
                  <Input
                    value={collegeSearch}
                    onChange={(event) => setCollegeSearch(event.target.value)}
                    placeholder="Search colleges"
                    className="h-9 bg-white/10 text-white placeholder:text-white/40 w-full"
                    disabled={saving}
                  />
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {collegeOptionsLoading ? (
                      <p className="text-sm text-white/60">Loading colleges...</p>
                    ) : filteredCollegeOptions.length === 0 ? (
                      <p className="text-sm text-white/60">No colleges found.</p>
                    ) : (
                      filteredCollegeOptions.map((college) => {
                        const checked = draft.collegeIds.includes(college.id)
                        const subheading = [college.city, college.state].filter(Boolean).join(", ")
                        return (
                          <label
                            key={college.id}
                            className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 cursor-pointer hover:bg-white/10"
                          >
                            <input
                              type="checkbox"
                              className="mt-1 accent-orange-500"
                              checked={checked}
                              onChange={(event) => {
                                const isChecked = event.target.checked
                                setDraft((prev) => {
                                  const nextIds = isChecked
                                    ? Array.from(new Set([...prev.collegeIds, college.id]))
                                    : prev.collegeIds.filter((id) => id !== college.id)
                                  return { ...prev, collegeIds: nextIds }
                                })
                              }}
                              disabled={saving}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white truncate">{college.name || "Untitled college"}</p>
                              {subheading && <p className="text-xs text-white/60 truncate">{subheading}</p>}
                            </div>
                            <span className="text-[10px] rounded-full bg-white/10 px-2 py-1 text-white/70">
                              {college.status}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              <Textarea
                value={draft.others}
                onChange={(event) => setDraft((prev) => ({ ...prev, others: event.target.value }))}
                placeholder="Enter additional information..."
                className="min-h-[100px] bg-white/10 text-white placeholder:text-white/40 w-full"
              />
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={draft.rating}
                  onChange={(event) => setDraft((prev) => ({ ...prev, rating: event.target.value }))}
                  placeholder="Rating (0-5)"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
                <Input
                  type="number"
                  min="0"
                  value={draft.jobsCount}
                  onChange={(event) => setDraft((prev) => ({ ...prev, jobsCount: event.target.value }))}
                  placeholder="Jobs count"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
                <Input
                  type="number"
                  min="0"
                  value={draft.reviewsCount}
                  onChange={(event) => setDraft((prev) => ({ ...prev, reviewsCount: event.target.value }))}
                  placeholder="Reviews count"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
                <Input
                  type="number"
                  min="0"
                  value={draft.salariesCount}
                  onChange={(event) => setDraft((prev) => ({ ...prev, salariesCount: event.target.value }))}
                  placeholder="Salaries count"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
              </div>
              <div className="grid gap-3 grid-cols-1 w-full">
                <Input
                  type="number"
                  min="0"
                  value={draft.locationsCount}
                  onChange={(event) => setDraft((prev) => ({ ...prev, locationsCount: event.target.value }))}
                  placeholder="Locations count"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
                <Input
                  value={draft.type}
                  onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}
                  placeholder="Type (e.g., Public)"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
                <Input
                  value={draft.revenue}
                  onChange={(event) => setDraft((prev) => ({ ...prev, revenue: event.target.value }))}
                  placeholder="Revenue"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
                <Input
                  value={draft.founded}
                  onChange={(event) => setDraft((prev) => ({ ...prev, founded: event.target.value }))}
                  placeholder="Founded year"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
                <Input
                  value={draft.industry}
                  onChange={(event) => setDraft((prev) => ({ ...prev, industry: event.target.value }))}
                  placeholder="Industry"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
              </div>
            </div>
          )}
        </div>

        {formError && <p className="text-xs text-red-300 mt-4">{formError}</p>}

        <div className="mt-6 flex gap-2">
            <Button 
              className="flex-1 bg-orange-500 text-white hover:bg-orange-600" 
              onClick={handleSave}
              disabled={saving || uploadingPhotos}
            >
              {uploadingPhotos ? "Uploading photos..." : saving ? "Saving..." : editingId ? "Update listing" : "Add listing"}
            </Button>
            {editingId && (
              <Button className="flex-1 bg-white/10 text-white hover:bg-white/20" onClick={resetDraft} disabled={saving}>
                Cancel
              </Button>
            )}
        </div>
      </div>
    </div>
  )
}

function ReviewsPanel({
  reviews,
  setReviews,
  loading,
}: {
  reviews: ReviewItem[]
  setReviews: Dispatch<SetStateAction<ReviewItem[]>>
  loading: boolean
}) {
  const [draft, setDraft] = useState({
    author: "",
    rating: 5,
    message: "",
    source: "",
    status: "Visible" as ReviewStatus,
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const resetDraft = () => {
    setDraft({ author: "", rating: 5, message: "", source: "", status: "Visible" })
    setEditingId(null)
  }

  const handleSave = () => {
    const trimmedAuthor = draft.author.trim() || "Anonymous"
    const createdAt = new Date().toLocaleString()

    if (editingId) {
      setReviews((prev) =>
        prev.map((review) =>
          review.id === editingId
            ? { ...review, ...draft, author: trimmedAuthor, createdAt }
            : review
        )
      )
    } else {
      const newReview: ReviewItem = {
        id: createId("review"),
        author: trimmedAuthor,
        rating: draft.rating,
        message: draft.message.trim(),
        source: draft.source.trim() || "Manual",
        status: draft.status,
        createdAt,
      }
      setReviews((prev) => [newReview, ...prev])
    }
    resetDraft()
  }

  const handleEdit = (review: ReviewItem) => {
    setDraft({
      author: review.author,
      rating: review.rating,
      message: review.message,
      source: review.source,
      status: review.status,
    })
    setEditingId(review.id)
  }

  const handleToggle = (id: string) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === id
          ? { ...review, status: review.status === "Visible" ? "Hidden" : "Visible" }
          : review
      )
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-white/10 bg-[#121518] p-6">
        <div>
          <h2 className="text-lg font-semibold">Reviews</h2>
          <p className="text-sm text-white/60">Moderate feedback and keep it on-brand.</p>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-white/60">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-white/60">No reviews yet.</p>
          ) : (
            reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold">
                  {review.author} • {review.rating}/5
                </p>
                <p className="text-xs text-white/60">
                  {review.source} • {review.createdAt}
                </p>
                <p className="mt-2 text-xs text-white/60">{review.message || "No message"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-2 py-1">{review.status}</span>
                <Button
                  size="sm"
                  className="h-8 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => handleEdit(review)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => handleToggle(review.id)}
                >
                  Toggle visibility
                </Button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121518] p-6">
        <h3 className="text-lg font-semibold">{editingId ? "Edit review" : "Add review"}</h3>
        <p className="text-sm text-white/60">Capture customer feedback or test entries.</p>

        <div className="mt-4 space-y-3">
          <Input
            value={draft.author}
            onChange={(event) => setDraft((prev) => ({ ...prev, author: event.target.value }))}
            placeholder="Reviewer name"
            className="h-10 bg-white/10 text-white placeholder:text-white/40"
          />
          <Input
            value={draft.source}
            onChange={(event) => setDraft((prev) => ({ ...prev, source: event.target.value }))}
            placeholder="Source (app, website, community)"
            className="h-10 bg-white/10 text-white placeholder:text-white/40"
          />
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">Rating</span>
            <select
              value={draft.rating}
              onChange={(event) => setDraft((prev) => ({ ...prev, rating: Number(event.target.value) }))}
              className="h-10 flex-1 rounded-md border border-white/10 bg-white/10 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            value={draft.message}
            onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))}
            placeholder="Review message"
            className="min-h-[110px] bg-white/10 text-white placeholder:text-white/40"
          />
          <select
            value={draft.status}
            onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as ReviewStatus }))}
            className="h-10 w-full rounded-md border border-white/10 bg-white/10 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <option value="Visible">Visible</option>
            <option value="Hidden">Hidden</option>
          </select>

          <div className="flex gap-2">
            <Button className="flex-1 bg-orange-500 text-white hover:bg-orange-600" onClick={handleSave}>
              {editingId ? "Update review" : "Add review"}
            </Button>
            {editingId && (
              <Button className="flex-1 bg-white/10 text-white hover:bg-white/20" onClick={resetDraft}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
