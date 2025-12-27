"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const categories = [
  {
    id: "flexible",
    title: "Flexible Jobs",
    links: [
      "Data entry work from home jobs",
      "Customer service work from home jobs",
      "Copywriter work from home jobs",
      "Project manager work from home jobs",
      "Accountant work from home jobs",
      "Graphic designer work from home jobs",
      "Software developer work from home jobs",
      "Healthcare work from home jobs",
    ],
  },
  {
    id: "popular",
    title: "Popular Jobs",
    links: [
      "Truck Driver",
      "Registered Nurse",
      "Licensed Practical Nurse",
      "Nurse Practitioner",
      "Physical Therapist",
      "Customer Service Representative",
      "Software Engineer",
      "Project Manager",
    ],
  },
  {
    id: "city",
    title: "Browse Jobs by City",
    links: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Antonio", "San Diego", "Dallas"],
  },
  {
    id: "company",
    title: "Browse Jobs by Company",
    links: ["Amazon", "Google", "Microsoft", "Apple", "Meta", "Walmart", "Target", "JPMorgan Chase"],
  },
]

export default function PopularSearches() {
  const [activeCategory, setActiveCategory] = useState("flexible")

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">Start your search</h2>
        <p className="text-muted-foreground text-center mb-8">
          Need some inspiration? See what millions of people are looking for on Glassdoor today.
        </p>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-[#0B5B32] text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted border border-border"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories
            .find((c) => c.id === activeCategory)
            ?.links.map((link, index) => (
              <Link
                key={index}
                href="#"
                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-[#0CAA41] hover:shadow-sm transition-all group"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-[#0B5B32]">{link}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#0CAA41]" />
              </Link>
            ))}
        </div>
      </div>
    </section>
  )
}
