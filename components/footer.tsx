import Link from "next/link"
import { Facebook, Twitter, Youtube, Instagram } from "lucide-react"

const footerSections = [
  {
    title: "WorkHub",
    links: ["About / Press", "Awards", "Blog", "Research", "Contact Us", "Guides"],
  },
  {
    title: "Employers",
    links: ["Get a Free Employer Account", "Employer Center"],
  },
  {
    title: "Information",
    links: ["Help", "Guidelines", "Terms of Use", "Privacy & Ad Choices", "Security"],
  },
  {
    title: "Work With Us",
    links: ["Advertisers", "Careers"],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#0B5B32] text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* App Download & Social */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-primary-foreground/20">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-sm font-semibold">Download the App</span>
            <div className="flex gap-3">
              <Link
                href="#"
                className="px-4 py-2 bg-primary-foreground/10 rounded-lg text-xs font-medium hover:bg-primary-foreground/20 transition-colors"
              >
                App Store
              </Link>
              <Link
                href="#"
                className="px-4 py-2 bg-primary-foreground/10 rounded-lg text-xs font-medium hover:bg-primary-foreground/20 transition-colors"
              >
                Google Play
              </Link>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Browse Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-6 border-t border-primary-foreground/20 text-sm">
          <span className="text-primary-foreground/60">Browse by:</span>
          <Link href="#" className="hover:underline">
            Companies
          </Link>
          <span className="text-primary-foreground/40">•</span>
          <Link href="#" className="hover:underline">
            Jobs
          </Link>
          <span className="text-primary-foreground/40">•</span>
          <Link href="#" className="hover:underline">
            Locations
          </Link>
          <span className="text-primary-foreground/40">•</span>
          <Link href="#" className="hover:underline">
            Communities
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-primary-foreground/20">
          <p className="text-xs text-primary-foreground/60">
            Copyright © 2008-2025. WorkHub LLC. "WorkHub," "Worklife Pro," "Bowls," and logo are proprietary trademarks
            of WorkHub LLC.
          </p>
        </div>
      </div>
    </footer>
  )
}
