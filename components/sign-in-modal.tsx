"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth"
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, googleProvider, db } from "@/lib/firebase"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SubmittedData {
  name: string
  phone: string
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<SubmittedData | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const saveUserRecord = async (data: {
    name: string
    phone: string
    email?: string | null
    uid?: string
    provider: "google" | "manual"
  }) => {
    const record: {
      name: string
      phone: string
      email?: string
      provider: "google" | "manual"
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
        setSubmittedData({ name: userData.name, phone: userData.phone })
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
      setSubmittedData({ name: userData.name, phone: userData.phone })
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

  const handleClose = () => {
    setName("")
    setPhone("")
    setSubmitted(false)
    setSubmittedData(null)
    setIsGoogleLoading(false)
    setIsSaving(false)
    setSubmitError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-[#333]">
        {/* Header */}
        <div className="bg-[#0CAA41] px-6 py-8 text-center">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold text-white mb-1">WorkHub</h2>
          <p className="text-white/80 text-sm">{submitted ? "Welcome! You're all set" : "Sign in or sign up"}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted && submittedData ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0CAA41]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#0CAA41]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-4">Details Received!</h3>

              <div className="bg-[#2a2a2a] rounded-lg p-4 text-left space-y-2 mb-6">
                <div>
                  <span className="text-sm text-gray-400">Name:</span>
                  <p className="font-medium text-white">{submittedData.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Phone:</span>
                  <p className="font-medium text-white">{submittedData.phone || "Not provided"}</p>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-4">Check the browser console to see the logged details.</p>

              <Button onClick={handleClose} className="w-full bg-[#0CAA41] hover:bg-[#0B5B32] text-white font-semibold">
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full h-12 bg-white text-[#1a1a1a] hover:bg-gray-100 font-semibold disabled:cursor-not-allowed disabled:opacity-80"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48" aria-hidden="true">
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
                {isGoogleLoading ? "Opening Google..." : "Continue with Google"}
              </Button>

              {submitError && <p className="text-xs text-red-400 text-center">{submitError}</p>}

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="h-px flex-1 bg-[#333]" />
                <span>or</span>
                <div className="h-px flex-1 bg-[#333]" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-white font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 bg-[#2a2a2a] border-[#333] text-white placeholder-gray-500 focus:border-[#0CAA41] focus:ring-[#0CAA41]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-12 bg-[#2a2a2a] border-[#333] text-white placeholder-gray-500 focus:border-[#0CAA41] focus:ring-[#0CAA41]"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-12 bg-[#0CAA41] hover:bg-[#0B5B32] text-white font-semibold text-base"
              >
                {isSaving ? "Saving..." : "Continue"}
              </Button>

              <p className="text-xs text-center text-gray-400">
                By continuing, you agree to WorkHub's{" "}
                <a href="#" className="text-[#0CAA41] hover:underline">
                  Terms of Use
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#0CAA41] hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
