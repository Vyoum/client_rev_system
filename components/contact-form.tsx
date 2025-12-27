"use client"

import type React from "react"

import { useState } from "react"
import { Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: "", email: "", subject: "", message: "" })
    }, 3000)
  }

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Contact Us</h2>
          <p className="text-muted-foreground">Have a question or feedback? We'd love to hear from you.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#0CAA41]/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-[#0CAA41]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Message Sent!</h3>
              <p className="text-muted-foreground">Thank you for reaching out. We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-11 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-11 border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-semibold text-foreground">
                  Subject
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="How can we help you?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="h-11 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-semibold text-foreground">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className="resize-none border-border"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 bg-[#0CAA41] hover:bg-[#0B5B32] text-primary-foreground font-semibold"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
