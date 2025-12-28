"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, orderBy, query, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { db, storage, auth } from "@/lib/firebase"
import { X, Upload, Image as ImageIcon } from "lucide-react"

type ListingStatus = "Draft" | "Published"
type ReviewStatus = "Visible" | "Hidden"

type ListingItem = {
  id: string
  name: string
  location: string
  state?: string
  city?: string
  status: ListingStatus
  description: string
  whatsNew?: string
  others?: string
  updatedAt: string
  createdAt?: Timestamp | string
  rating?: number | null
  jobsCount?: number | null
  reviewsCount?: number | null
  salariesCount?: number | null
  locationsCount?: number | null
  logoUrl?: string
  website?: string
  employeeCount?: string
  type?: string
  revenue?: string
  founded?: string
  industry?: string
  photos?: string[]
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
}

const tabs = [
  { id: "users", label: "Users" },
  { id: "schools", label: "Feed" },
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
  }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users")
  const [users, setUsers] = useState<UserRecord[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [userQuery, setUserQuery] = useState("")

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
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)

  // Load users
  useEffect(() => {
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
  }, [])

  // Load schools
  useEffect(() => {
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
  }, [])

  // Load colleges
  useEffect(() => {
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
  }, [])

  // Load jobs
  useEffect(() => {
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
  }, [])

  // Load companies
  useEffect(() => {
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
  }, [])

  // Load courses
  useEffect(() => {
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
  }, [])

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

  const listingsTotal = schools.length + colleges.length + jobs.length + companies.length + courses.length
  const publishedListings =
    schools.filter((item) => item.status === "Published").length +
    colleges.filter((item) => item.status === "Published").length +
    jobs.filter((item) => item.status === "Published").length +
    companies.filter((item) => item.status === "Published").length +
    courses.filter((item) => item.status === "Published").length
  const hiddenReviews = reviews.filter((review) => review.status === "Hidden").length

  const listingConfigMap: Record<ListingTabId, { label: string; items: ListingItem[]; setItems: Dispatch<SetStateAction<ListingItem[]>>; collectionName: string; loading: boolean }> = {
    schools: { label: "Feed", items: schools, setItems: setSchools, collectionName: "feed", loading: schoolsLoading },
    colleges: { label: "School", items: colleges, setItems: setColleges, collectionName: "school", loading: collegesLoading },
    jobs: { label: "Colleges", items: jobs, setItems: setJobs, collectionName: "colleges", loading: jobsLoading },
    companies: { label: "Kindergarden", items: companies, setItems: setCompanies, collectionName: "kindergarden", loading: companiesLoading },
    courses: { label: "Courses", items: courses, setItems: setCourses, collectionName: "courses", loading: coursesLoading },
  }

  const activeListingConfig =
    activeTab === "schools" || activeTab === "colleges" || activeTab === "jobs" || activeTab === "companies" || activeTab === "courses"
      ? listingConfigMap[activeTab]
      : null

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

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard title="Users" value={usersLoading ? "Loading..." : `${users.length}`} detail="Signed up" />
          <SummaryCard title="Listings" value={`${publishedListings}/${listingsTotal}`} detail="Published" />
          <SummaryCard title="Reviews" value={`${hiddenReviews}`} detail="Hidden" />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
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
          {activeTab === "users" && (
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
                      <div className="text-xs text-white/60">
                        <span className="rounded-full bg-white/10 px-2 py-1">{user.provider || "manual"}</span>
                        <span className="ml-2">{formatTimestamp(user.createdAt)}</span>
                      </div>
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

          {activeTab === "reviews" && <ReviewsPanel reviews={reviews} setReviews={setReviews} />}
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
    location: "",
    state: "",
    city: "",
    status: "Published" as ListingStatus,
    whatsNew: "",
    description: "",
    others: "",
    rating: "",
    jobsCount: "",
    reviewsCount: "",
    salariesCount: "",
    locationsCount: "",
    logoUrl: "",
    website: "",
    employeeCount: "",
    type: "",
    revenue: "",
    founded: "",
    industry: "",
    photos: "",
  })
  const [activeFormSection, setActiveFormSection] = useState<"whatsnew" | "reviews" | "about" | "photos" | "others">("whatsnew")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const filteredItems = useMemo(() => {
    const query = filterQuery.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => {
      return item.name.toLowerCase().includes(query) || item.location.toLowerCase().includes(query)
    })
  }, [filterQuery, items])

  const resetDraft = () => {
    setDraft({
      name: "",
      location: "",
      state: "",
      city: "",
      status: "Published",
      whatsNew: "",
      description: "",
      others: "",
      rating: "",
      jobsCount: "",
      reviewsCount: "",
      salariesCount: "",
      locationsCount: "",
      logoUrl: "",
      website: "",
      employeeCount: "",
      type: "",
      revenue: "",
      founded: "",
      industry: "",
      photos: "",
    })
    setEditingId(null)
    setFormError(null)
    setPhotoFiles([])
    setExistingPhotoUrls([])
    setActiveFormSection("whatsnew")
  }

  const parseLocation = (location: string) => {
    // Try to parse "City, State" format
    const parts = location.split(",").map((p) => p.trim())
    if (parts.length >= 2) {
      return { city: parts[0], state: parts.slice(1).join(", ") }
    }
    return { city: "", state: location }
  }

  const uploadPhoto = async (file: File, listingId: string): Promise<string> => {
    try {
      const fileExtension = file.name.split(".").pop() || "jpg"
      const fileName = `${listingId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
      const storageRef = ref(storage, `listings/${collectionName}/${fileName}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error: any) {
      console.error("Error uploading photo:", file.name, error)
      throw new Error(`Failed to upload ${file.name}: ${error?.message || "Unknown error"}`)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    
    if (imageFiles.length === 0) {
      setFormError("Please select image files only.")
      return
    }

    // Limit to 10 photos
    const remainingSlots = 10 - (existingPhotoUrls.length + photoFiles.length)
    if (imageFiles.length > remainingSlots) {
      setFormError(`You can only upload ${remainingSlots} more photo(s). Maximum 10 photos allowed.`)
      return
    }

    setPhotoFiles((prev) => [...prev, ...imageFiles.slice(0, remainingSlots)])
    setFormError(null)
  }

  const removePhotoFile = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingPhoto = (index: number) => {
    setExistingPhotoUrls((prev) => prev.filter((_, i) => i !== index))
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
      
      const locationValue = draft.location.trim()
      const locationData = parseLocation(locationValue)
      const cityValue = draft.city.trim() || locationData.city
      const stateValue = draft.state.trim() || locationData.state
      const resolvedLocation = locationValue || [cityValue, stateValue].filter(Boolean).join(", ")
      
      const listingData: Record<string, unknown> = {
        name: trimmedName,
        location: resolvedLocation || "",
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
      
      // Also parse photos from textarea (for backward compatibility)
      let photoUrls: string[] = [...existingPhotoUrls]
      const photosText = draft.photos.trim()
      if (photosText) {
        const photosArray = photosText
          .split("\n")
          .map((url) => url.trim())
          .filter((url) => url !== "" && (url.startsWith("http://") || url.startsWith("https://")))
        photoUrls = [...photoUrls, ...photosArray]
      }

      // Get or create listing ID first
      let listingId: string
      if (editingId) {
        listingId = editingId
        // Update existing listing first (without photos)
        const listingRef = doc(db, collectionName, listingId)
        await updateDoc(listingRef, listingData)
      } else {
        // Create new listing first to get the ID
        const docRef = await addDoc(collection(db, collectionName), {
          ...listingData,
          createdAt: serverTimestamp(),
        })
        listingId = docRef.id
      }

      // Upload photos after we have the listing ID
      if (photoFiles.length > 0) {
        // Check if user is authenticated
        if (!auth.currentUser) {
          setFormError("You must be signed in to upload photos. Please sign in and try again.")
          setSaving(false)
          return
        }

        setUploadingPhotos(true)
        try {
          console.log(`Uploading ${photoFiles.length} photo(s)...`)
          const uploadPromises = photoFiles.map((file, index) => {
            console.log(`Uploading photo ${index + 1}/${photoFiles.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
            return uploadPhoto(file, listingId)
          })
          const uploadedUrls = await Promise.all(uploadPromises)
          console.log("All photos uploaded successfully:", uploadedUrls)
          photoUrls = [...photoUrls, ...uploadedUrls]
          
          // Update listing with photo URLs
          const listingRef = doc(db, collectionName, listingId)
          await updateDoc(listingRef, { photos: photoUrls })
          console.log("Listing updated with photo URLs")
        } catch (error: any) {
          console.error("Error uploading photos:", error)
          let errorMessage = error?.message || "Unknown error occurred"
          
          // Provide more helpful error messages
          if (error?.code === "storage/unauthorized") {
            errorMessage = "Storage permission denied. Please check Firebase Storage rules."
          } else if (error?.code === "storage/canceled") {
            errorMessage = "Upload was canceled."
          } else if (error?.code === "storage/unknown") {
            errorMessage = "Unknown storage error. Please check your Firebase configuration."
          }
          
          setFormError(`Failed to upload photos: ${errorMessage}. Check console for details.`)
          setUploadingPhotos(false)
          setSaving(false)
          return
        } finally {
          // Always reset upload state
          setUploadingPhotos(false)
        }
      } else if (photoUrls.length > 0) {
        // If we have photo URLs but no new files, just update the photos field
        const listingRef = doc(db, collectionName, listingId)
        await updateDoc(listingRef, { photos: photoUrls })
      }

      console.log("Saving to collection:", collectionName)
      console.log("Listing data:", listingData)

    resetDraft()
    } catch (error: any) {
      console.error("Error saving listing:", error)
      const errorMessage = error?.message || "Unknown error occurred"
      setFormError(`Failed to save listing: ${errorMessage}. Please check the console for details.`)
      setUploadingPhotos(false) // Ensure upload state is reset on error
    } finally {
      setSaving(false)
      setUploadingPhotos(false) // Ensure upload state is always reset
    }
  }

  const handleEdit = (item: ListingItem) => {
    const fallbackLocation = item.location || [item.city, item.state].filter(Boolean).join(", ")
    setDraft({
      name: item.name,
      location: fallbackLocation,
      state: item.state || "",
      city: item.city || "",
      status: item.status,
      whatsNew: item.whatsNew || "",
      description: item.description,
      others: item.others || "",
      rating: item.rating != null ? String(item.rating) : "",
      jobsCount: item.jobsCount != null ? String(item.jobsCount) : "",
      reviewsCount: item.reviewsCount != null ? String(item.reviewsCount) : "",
      salariesCount: item.salariesCount != null ? String(item.salariesCount) : "",
      locationsCount: item.locationsCount != null ? String(item.locationsCount) : "",
      logoUrl: item.logoUrl || "",
      website: item.website || "",
      employeeCount: item.employeeCount || "",
      type: item.type || "",
      revenue: item.revenue || "",
      founded: item.founded || "",
      industry: item.industry || "",
      photos: "",
    })
    setEditingId(item.id)
    setFormError(null)
    setPhotoFiles([])
    setExistingPhotoUrls(item.photos && item.photos.length > 0 ? item.photos : [])
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) {
      return
    }

    try {
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-white/10 bg-[#121518] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{label} listings</h2>
            <p className="text-sm text-white/60">Add, edit, or retire a listing.</p>
          </div>
          <Input
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder={`Search ${label.toLowerCase()} listings`}
            className="h-10 w-full bg-white/10 text-white placeholder:text-white/40 sm:w-64"
          />
        </div>

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
                    {item.location || "No location"} • {item.updatedAt}
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
          <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={draft.location}
            onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Location (City, State)"
            className="h-10 bg-white/10 text-white placeholder:text-white/40"
          />
            <Input
              value={draft.state}
              onChange={(event) => setDraft((prev) => ({ ...prev, state: event.target.value }))}
              placeholder="State"
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
              value={draft.website}
              onChange={(event) => setDraft((prev) => ({ ...prev, website: event.target.value }))}
              placeholder="Website"
              className="h-10 bg-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <Input
            value={draft.logoUrl}
            onChange={(event) => setDraft((prev) => ({ ...prev, logoUrl: event.target.value }))}
            placeholder="Logo URL"
            className="h-10 bg-white/10 text-white placeholder:text-white/40"
          />
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
                {section === "whatsnew" ? "What's New" : section.charAt(0).toUpperCase() + section.slice(1)}
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
            <div>
              <label className="block text-xs text-white/60 mb-2">About</label>
          <Textarea
            value={draft.description}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Enter description and details..."
                className="min-h-[150px] bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
          )}

          {/* Photos Section */}
          {activeFormSection === "photos" && (
            <div>
            <label className="block text-xs text-white/60 mb-2">Photos (Upload or enter URLs)</label>
            
            {/* File Upload */}
            <div className="mb-3">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-white/60 mb-2" />
                  <p className="text-sm text-white/80 font-medium">Click to upload photos</p>
                  <p className="text-xs text-white/50 mt-1">PNG, JPG, GIF up to 10MB (Max 10 photos)</p>
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

            {/* Photo Previews */}
            {(existingPhotoUrls.length > 0 || photoFiles.length > 0) && (
              <div className="mb-3">
                <p className="text-xs text-white/60 mb-2">
                  {existingPhotoUrls.length + photoFiles.length} photo(s) selected
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Existing Photos */}
                  {existingPhotoUrls.map((url, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={uploadingPhotos || saving}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* New Photo Files */}
                  {photoFiles.map((file, index) => (
                    <div key={`file-${index}`} className="relative group">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* URL Input (Fallback) */}
            <details className="mt-3">
              <summary className="text-xs text-white/60 cursor-pointer hover:text-white/80">
                Or enter photo URLs manually (one per line)
              </summary>
              <Textarea
                value={draft.photos}
                onChange={(event) => setDraft((prev) => ({ ...prev, photos: event.target.value }))}
                placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                className="mt-2 min-h-[80px] bg-white/10 text-white placeholder:text-white/40"
                rows={3}
              />
            </details>
            </div>
          )}

          {/* Others Section */}
          {activeFormSection === "others" && (
            <div className="space-y-3 w-full">
              <label className="block text-xs text-white/60 mb-2">Others</label>
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
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
                <Input
                  type="number"
                  min="0"
                  value={draft.locationsCount}
                  onChange={(event) => setDraft((prev) => ({ ...prev, locationsCount: event.target.value }))}
                  placeholder="Locations count"
                  className="h-10 bg-white/10 text-white placeholder:text-white/40 w-full"
                />
                <Input
                  value={draft.employeeCount}
                  onChange={(event) => setDraft((prev) => ({ ...prev, employeeCount: event.target.value }))}
                  placeholder="Employee count"
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
              <Button className="flex-1 bg-white/10 text-white hover:bg-white/20" onClick={resetDraft} disabled={saving || uploadingPhotos}>
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
}: {
  reviews: ReviewItem[]
  setReviews: Dispatch<SetStateAction<ReviewItem[]>>
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
          {reviews.map((review) => (
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
          ))}
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
