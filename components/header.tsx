"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Bell, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import SignInModal from "./sign-in-modal"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signInModalOpen, setSignInModalOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <svg viewBox="0 0 120 28" className="h-7 w-auto" fill="none">
                <path
                  d="M11.5 0C5.15 0 0 5.15 0 11.5C0 17.85 5.15 23 11.5 23C17.85 23 23 17.85 23 11.5C23 5.15 17.85 0 11.5 0ZM11.5 18.5C7.64 18.5 4.5 15.36 4.5 11.5C4.5 7.64 7.64 4.5 11.5 4.5C15.36 4.5 18.5 7.64 18.5 11.5C18.5 15.36 15.36 18.5 11.5 18.5Z"
                  fill="#0CAA41"
                />
                <path
                  d="M11.5 8C9.57 8 8 9.57 8 11.5C8 13.43 9.57 15 11.5 15C13.43 15 15 13.43 15 11.5C15 9.57 13.43 8 11.5 8Z"
                  fill="#0CAA41"
                />
                <text x="26" y="18" fill="#0B5B32" fontWeight="700" fontSize="16" fontFamily="inherit">
                  WorkHub
                </text>
              </svg>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavItem label="Community" />
              <NavItem label="Jobs" />
              <NavItem label="Companies" />
              <NavItem label="Salaries" />
              <NavItem label="For Employers" />
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground">
                <Bell className="h-5 w-5" />
              </Button>
              <Link href="#" className="hidden md:block text-sm font-semibold text-[#0B5B32] hover:underline">
                For Employers
              </Link>
              <Button
                variant="outline"
                className="hidden sm:flex border-[#0CAA41] text-[#0B5B32] hover:bg-[#0CAA41]/10 font-semibold bg-transparent"
                onClick={() => setSignInModalOpen(true)}
              >
                Sign In
              </Button>
              <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border py-4">
              <nav className="flex flex-col gap-2">
                <MobileNavItem label="Community" />
                <MobileNavItem label="Jobs" />
                <MobileNavItem label="Companies" />
                <MobileNavItem label="Salaries" />
                <MobileNavItem label="For Employers" />
                <Button
                  className="mt-4 bg-[#0CAA41] hover:bg-[#0B5B32] text-primary-foreground font-semibold"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setSignInModalOpen(true)
                  }}
                >
                  Sign In
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <SignInModal isOpen={signInModalOpen} onClose={() => setSignInModalOpen(false)} />
    </>
  )
}

function NavItem({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-foreground hover:text-[#0B5B32] transition-colors">
      {label}
      <ChevronDown className="h-4 w-4" />
    </button>
  )
}

function MobileNavItem({ label }: { label: string }) {
  return (
    <button className="flex items-center justify-between w-full px-4 py-3 text-base font-semibold text-foreground hover:bg-muted rounded-lg transition-colors">
      {label}
      <ChevronDown className="h-5 w-5" />
    </button>
  )
}
