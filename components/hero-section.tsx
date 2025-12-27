import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-[#E8F5E9] to-background py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0B5B32] mb-6 text-balance">
          Your work people are here
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          Get ahead with WorkHub. We're serving up trusted insights and anonymous conversation, so you'll have the goods
          you need to succeed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-[#0CAA41] hover:bg-[#0B5B32] text-primary-foreground font-semibold px-8 py-6 text-base"
          >
            Join your work community
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-[#0CAA41] text-[#0B5B32] hover:bg-[#0CAA41]/10 font-semibold px-8 py-6 text-base bg-transparent"
          >
            Find and apply to jobs
          </Button>
        </div>
      </div>
    </section>
  )
}
