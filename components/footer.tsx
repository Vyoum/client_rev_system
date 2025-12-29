import Link from "next/link"
import { Facebook, Twitter, Youtube, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-orange-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-4">WorkHub</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Your trusted platform for finding the best educational institutions, courses, and career opportunities.
              </p>
            </div>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>123 Education Street, Learning City, LC 12345</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@workhub.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <p className="text-sm text-white/80 mb-4">
              Stay connected with us on social media for the latest updates and news.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="#"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 mt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/80 text-center md:text-left">
              © {new Date().getFullYear()} WorkHub LLC. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/80">
              <Link href="#" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span className="text-white/50">•</span>
              <Link href="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <span className="text-white/50">•</span>
              <Link href="#" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
