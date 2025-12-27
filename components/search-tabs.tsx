"use client"

import { useState } from "react"
import { Search, Users, Briefcase, Building2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const tabs = [
  { id: "community", label: "Community", icon: Users },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "salaries", label: "Salaries", icon: DollarSign },
]

export default function SearchTabs() {
  const [activeTab, setActiveTab] = useState("jobs")

  return (
    <section className="py-8 md:py-12 border-b border-border">
      <div className="max-w-4xl mx-auto px-4">
        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#0CAA41] text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Form */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="text" placeholder={getPlaceholder(activeTab)} className="pl-10 h-12 text-base border-border" />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="text" placeholder="Location" className="pl-10 h-12 text-base border-border" />
          </div>
          <Button size="lg" className="h-12 px-8 bg-[#0CAA41] hover:bg-[#0B5B32] text-primary-foreground font-semibold">
            Search
          </Button>
        </div>
      </div>
    </section>
  )
}

function getPlaceholder(tab: string) {
  switch (tab) {
    case "community":
      return "Search topics, posts..."
    case "jobs":
      return "Job title, keywords, or company"
    case "companies":
      return "Company name"
    case "salaries":
      return "Job title"
    default:
      return "Search..."
  }
}
