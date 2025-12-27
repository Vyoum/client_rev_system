"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, googleProvider, db } from "@/lib/firebase"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SubmittedData {
  name: string
  phone: string
  email?: string
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<SubmittedData | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreateSaving, setIsCreateSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)

  const saveUserRecord = async (data: {
    name: string
    phone: string
    email?: string | null
    uid?: string
    provider: "google" | "manual" | "email"
  }) => {
    const record: {
      name: string
      phone: string
      email?: string
      provider: "google" | "manual" | "email"
      uid?: string
      createdAt: ReturnType<typeof serverTimestamp>
      updatedAt: ReturnType<typeof serverTimestamp>
    } = {
      name: data.name,
      phone: data.phone,
      provider: data.provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    if (data.email) {
      record.email = data.email
    }

    if (data.uid) {
      record.uid = data.uid
    }

    if (data.uid) {
      await setDoc(doc(db, "users", data.uid), record, { merge: true })
    } else {
      await addDoc(collection(db, "users"), record)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (!isMounted || !result?.user) return
        const user = result.user
        const userData = {
          name: user.displayName || "Google User",
          phone: user.phoneNumber || "",
          email: user.email,
          uid: user.uid,
          provider: "google" as const,
        }
        await saveUserRecord(userData)
        if (!isMounted) return
        setSubmittedData({ name: userData.name, phone: userData.phone, email: userData.email || undefined })
        setSubmitted(true)
      } catch (error) {
        if (!isMounted) return
        console.error("Google redirect sign in failed:", error)
        setSubmitError("Google sign-in failed. Please try again.")
      }
    }

    handleRedirect()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const handleGoogleSignIn = async () => {
    setSubmitError(null)
    setIsGoogleLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      const userData = {
        name: user.displayName || "Google User",
        phone: user.phoneNumber || "",
        email: user.email,
        uid: user.uid,
        provider: "google" as const,
      }
      await saveUserRecord(userData)
      setSubmittedData({ name: userData.name, phone: userData.phone, email: userData.email || undefined })
      setSubmitted(true)
    } catch (error: any) {
      if (error?.code === "auth/popup-blocked" || error?.code === "auth/popup-closed-by-user") {
        try {
          await signInWithRedirect(auth, googleProvider)
          return
        } catch (redirectError) {
          console.error("Google redirect sign in failed:", redirectError)
        }
      } else {
        console.error("Google sign in failed:", error)
      }
      setSubmitError("Google sign-in failed. Please try again.")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSaving(true)

    const userData = { name: name.trim(), phone: phone.trim() }

    // Log details to console so you can see them
    console.log("=== User Sign In / Sign Up Details ===")
    console.log("Name:", name)
    console.log("Phone:", phone)
    console.log("Timestamp:", new Date().toISOString())
    console.log("============================")

    try {
      await saveUserRecord({ ...userData, provider: "manual" })
      setSubmittedData(userData)
      setSubmitted(true)
    } catch (error) {
      console.error("Saving user data failed:", error)
      setSubmitError("Could not save your details. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setSubmitError("Please enter your full name.")
      return
    }
    if (!trimmedEmail) {
      setSubmitError("Please enter a valid email address.")
      return
    }
    if (password.length < 6) {
      setSubmitError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.")
      return
    }

    setIsCreateSaving(true)

    try {
      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
      await updateProfile(credential.user, { displayName: trimmedName })
      await saveUserRecord({
        name: trimmedName,
        phone: "",
        email: trimmedEmail,
        uid: credential.user.uid,
        provider: "email",
      })
      setSubmittedData({ name: trimmedName, phone: "", email: trimmedEmail })
      setSubmitted(true)
      setIsCreateMode(false)
    } catch (error) {
      console.error("Create account failed:", error)
      setSubmitError("Could not create account. Please try again.")
    } finally {
      setIsCreateSaving(false)
    }
  }

  const handleClose = () => {
    setName("")
    setPhone("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setSubmitted(false)
    setSubmittedData(null)
    setIsGoogleLoading(false)
    setIsSaving(false)
    setIsCreateSaving(false)
    setSubmitError(null)
    setIsCreateMode(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300" 
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[rgba(11,13,15,0.95)] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#E6E8EA] transition-all hover:bg-white/20 hover:scale-110"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="relative px-8 pt-10 pb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0CAA41] to-[#0B8A35] shadow-lg shadow-[#0CAA41]/20">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#E6E8EA] mb-2">Welcome to WorkHub</h2>
          <p className="text-sm text-[#9AA0A6]">
            {submitted ? "You're all set! 🎉" : isCreateMode ? "Create your account" : "Sign in to continue or create an account"}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 pb-8">
          {submitted && submittedData ? (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0CAA41]/20 to-[#0CAA41]/10 ring-4 ring-[#0CAA41]/10">
                  <svg className="h-10 w-10 text-[#0CAA41]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#E6E8EA] mb-2">Success!</h3>
              <p className="text-sm text-[#9AA0A6] mb-6">Your details have been saved successfully.</p>

              <div className="mb-6 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-5 text-left backdrop-blur-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-[#9AA0A6]">Name</span>
                    <p className="mt-1 text-base font-semibold text-[#E6E8EA]">{submittedData.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-[#9AA0A6]">Phone</span>
                    <p className="mt-1 text-base font-semibold text-[#E6E8EA]">{submittedData.phone || "Not provided"}</p>
                  </div>
                  {submittedData.email && (
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-[#9AA0A6]">Email</span>
                      <p className="mt-1 text-base font-semibold text-[#E6E8EA]">{submittedData.email}</p>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleClose} 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0CAA41] to-[#0B8A35] text-white font-semibold shadow-lg shadow-[#0CAA41]/20 transition-all hover:shadow-[#0CAA41]/30 hover:scale-[1.02]"
              >
                Done
              </Button>
            </div>
          ) : isCreateMode ? (
            <form onSubmit={handleCreateAccount} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="create-name" className="text-sm font-semibold text-[#E6E8EA]">
                  Full Name
                </Label>
                <Input
                  id="create-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 rounded-xl border-white/20 bg-[rgba(255,255,255,0.08)] px-4 text-[#E6E8EA] placeholder-[#9AA0A6] backdrop-blur-sm transition-all focus:border-[#0CAA41] focus:bg-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[#0CAA41]/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="create-email" className="text-sm font-semibold text-[#E6E8EA]">
                  Email Address
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-white/20 bg-[rgba(255,255,255,0.08)] px-4 text-[#E6E8EA] placeholder-[#9AA0A6] backdrop-blur-sm transition-all focus:border-[#0CAA41] focus:bg-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[#0CAA41]/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="create-password" className="text-sm font-semibold text-[#E6E8EA]">
                  Password
                </Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-white/20 bg-[rgba(255,255,255,0.08)] px-4 text-[#E6E8EA] placeholder-[#9AA0A6] backdrop-blur-sm transition-all focus:border-[#0CAA41] focus:bg-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[#0CAA41]/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="create-confirm" className="text-sm font-semibold text-[#E6E8EA]">
                  Confirm Password
                </Label>
                <Input
                  id="create-confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-white/20 bg-[rgba(255,255,255,0.08)] px-4 text-[#E6E8EA] placeholder-[#9AA0A6] backdrop-blur-sm transition-all focus:border-[#0CAA41] focus:bg-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[#0CAA41]/20"
                />
              </div>

              {submitError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <p className="text-xs font-medium text-red-400 text-center">{submitError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isCreateSaving}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0CAA41] to-[#0B8A35] text-white font-semibold shadow-lg shadow-[#0CAA41]/20 transition-all hover:shadow-[#0CAA41]/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {isCreateSaving ? "Creating..." : "Create account"}
              </Button>

              <p className="text-xs text-center leading-relaxed text-[#9AA0A6]">
                By continuing, you agree to WorkHub's{" "}
                <a href="#" className="font-medium text-[#0CAA41] transition-colors hover:text-[#0B8A35] hover:underline">
                  Terms of Use
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-[#0CAA41] transition-colors hover:text-[#0B8A35] hover:underline">
                  Privacy Policy
                </a>
                .
              </p>

              <p className="text-xs text-center text-[#9AA0A6]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMode(false)
                    setSubmitError(null)
                  }}
                  className="font-medium text-[#0CAA41] transition-colors hover:text-[#0B8A35] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full h-12 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-[#E6E8EA] font-semibold backdrop-blur-sm transition-all hover:bg-white/15 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <svg className="h-5 w-5 mr-3" viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.73 1.22 9.23 3.22l6.9-6.9C35.84 2.1 30.3 0 24 0 14.6 0 6.51 5.38 2.67 13.22l8.06 6.26C12.7 13.28 17.9 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.1 24.5c0-1.69-.15-3.32-.43-4.9H24v9.28h12.44c-.54 2.9-2.16 5.35-4.6 7.01l7.05 5.48c4.13-3.82 6.21-9.45 6.21-15.87z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.73 28.02c-.56-1.7-.88-3.52-.88-5.4s.32-3.7.88-5.4l-8.06-6.26C.95 13.88 0 18.8 0 22.62c0 3.82.95 8.74 2.67 12.66l8.06-6.26z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.3 0 11.84-2.08 15.79-5.63l-7.05-5.48c-2.04 1.37-4.67 2.18-8.74 2.18-6.1 0-11.3-3.78-13.27-9.38l-8.06 6.26C6.51 42.62 14.6 48 24 48z"
                  />
                </svg>
                {isGoogleLoading ? "Connecting..." : "Continue with Google"}
              </Button>

              {submitError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <p className="text-xs font-medium text-red-400 text-center">{submitError}</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium text-[#9AA0A6]">OR</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-[#E6E8EA]">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 rounded-xl border-white/20 bg-[rgba(255,255,255,0.08)] px-4 text-[#E6E8EA] placeholder-[#9AA0A6] backdrop-blur-sm transition-all focus:border-[#0CAA41] focus:bg-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[#0CAA41]/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-semibold text-[#E6E8EA]">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-12 rounded-xl border-white/20 bg-[rgba(255,255,255,0.08)] px-4 text-[#E6E8EA] placeholder-[#9AA0A6] backdrop-blur-sm transition-all focus:border-[#0CAA41] focus:bg-[rgba(255,255,255,0.12)] focus:ring-2 focus:ring-[#0CAA41]/20"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0CAA41] to-[#0B8A35] text-white font-semibold shadow-lg shadow-[#0CAA41]/20 transition-all hover:shadow-[#0CAA41]/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSaving ? "Saving..." : "Continue"}
              </Button>

              <p className="text-xs text-center leading-relaxed text-[#9AA0A6]">
                By continuing, you agree to WorkHub's{" "}
                <a href="#" className="font-medium text-[#0CAA41] transition-colors hover:text-[#0B8A35] hover:underline">
                  Terms of Use
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-[#0CAA41] transition-colors hover:text-[#0B8A35] hover:underline">
                  Privacy Policy
                </a>
                .
              </p>

              <p className="text-xs text-center text-[#9AA0A6]">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateMode(true)
                    setSubmitError(null)
                  }}
                  className="font-medium text-[#0CAA41] transition-colors hover:text-[#0B8A35] hover:underline"
                >
                  Create one
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
