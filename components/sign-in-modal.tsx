"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SubmittedData {
  email: string
  phone: string
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<SubmittedData | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const userData = { email, phone }

    // Log details to console so you can see them
    console.log("=== User Sign In Details ===")
    console.log("Email:", email)
    console.log("Phone:", phone)
    console.log("Timestamp:", new Date().toISOString())
    console.log("============================")

    setSubmittedData(userData)
    setSubmitted(true)
  }

  const handleClose = () => {
    setEmail("")
    setPhone("")
    setSubmitted(false)
    setSubmittedData(null)
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
          <p className="text-white/80 text-sm">{submitted ? "Welcome! You're all set" : "Sign in to continue"}</p>
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
                  <span className="text-sm text-gray-400">Email:</span>
                  <p className="font-medium text-white">{submittedData.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Phone:</span>
                  <p className="font-medium text-white">{submittedData.phone}</p>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-4">Check the browser console to see the logged details.</p>

              <Button onClick={handleClose} className="w-full bg-[#0CAA41] hover:bg-[#0B5B32] text-white font-semibold">
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-12 bg-[#2a2a2a] border-[#333] text-white placeholder-gray-500 focus:border-[#0CAA41] focus:ring-[#0CAA41]"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#0CAA41] hover:bg-[#0B5B32] text-white font-semibold text-base"
              >
                Continue
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
