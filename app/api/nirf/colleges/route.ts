const NIRF_CATEGORIES = [
  "Overall",
  "University",
  "College",
  "Research",
  "Engineering",
  "Management",
  "Pharmacy",
  "Medical",
  "Dental",
  "Law",
  "Architecture",
  "Agriculture",
  "Innovation",
  "OPENUNIVERSITY",
  "SKILLUNIVERSITY",
  "STATEPUBLICUNIVERSITY",
]

const decodeHtml = (value: string) => {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

const stripTags = (value: string) => value.replace(/<[^>]*>/g, " ")

const normalizeName = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim()

const extractWebsite = (rawHtml: string) => {
  const urlMatch =
    rawHtml.match(/https?:\/\/[^\s"'<]+/i) ||
    rawHtml.match(/\bwww\.[^\s"'<]+/i)
  if (!urlMatch) return ""
  const url = urlMatch[0]
  return url.startsWith("http") ? url : `https://${url}`
}

const extractNames = (html: string) => {
  const tableMatch = html.match(/<table[^>]*id=["']?tblAllInstitutes["']?[^>]*>([\s\S]*?)<\/table>/i)
  const tableHtml = tableMatch ? tableMatch[1] : html
  const rows = Array.from(
    tableHtml.matchAll(/<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<\/tr>/gi)
  )

  return rows
    .map((match) => {
      const raw = match[1] || ""
      const website = extractWebsite(raw)
      const name = decodeHtml(stripTags(raw)).replace(/\s+/g, " ").trim()
      return { name, website }
    })
    .filter((entry) => entry.name)
}

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get("year") || "2024"

  const results = new Map<string, { name: string; website?: string }>()
  const errors: Array<{ category: string; error: string }> = []

  for (const category of NIRF_CATEGORIES) {
    const url = `https://www.nirfindia.org/Rankings/${year}/${category}RankingALL.html`
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      })
      if (!response.ok) {
        errors.push({ category, error: `HTTP ${response.status}` })
        continue
      }
      const html = await response.text()
      const entries = extractNames(html)
      entries.forEach((entry) => {
        const key = normalizeName(entry.name)
        if (!key) return
        const existing = results.get(key)
        if (!existing) {
          results.set(key, { name: entry.name, website: entry.website || "" })
          return
        }
        if (!existing.website && entry.website) {
          results.set(key, { ...existing, website: entry.website })
        }
      })
    } catch (error) {
      errors.push({ category, error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return Response.json({
    year,
    total: results.size,
    items: Array.from(results.values()),
    errors,
  })
}
