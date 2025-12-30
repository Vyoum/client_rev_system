const SOURCE_URL = "https://school.careers360.com/articles/top-schools-in-india"

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

const normalizeUrl = (value: string) => {
  if (!value) return ""
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  if (value.startsWith("/")) return `https://school.careers360.com${value}`
  return `https://${value}`
}

const extractSchools = (html: string) => {
  const tables = Array.from(html.matchAll(/<table[\s\S]*?<\/table>/gi)).map((match) => match[0])
  const entries: Array<{ name: string; website?: string }> = []

  tables.forEach((table) => {
    const rows = Array.from(
      table.matchAll(
        /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi
      )
    )
    rows.forEach((row) => {
      const rawCell = row[1] || ""
      const anchorMatch = rawCell.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i)
      const rawName = anchorMatch ? anchorMatch[2] : rawCell
      const name = decodeHtml(stripTags(rawName)).replace(/\s+/g, " ").trim()
      if (!name) return
      if (name.toLowerCase().includes("school name")) return
      const website = anchorMatch ? normalizeUrl(anchorMatch[1]) : ""
      entries.push({ name, website })
    })
  })

  return entries
}

export const dynamic = "force-dynamic"

export async function GET() {
  const results = new Map<string, { name: string; website?: string }>()
  const errors: Array<{ source: string; error: string }> = []

  try {
    const response = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    })
    if (!response.ok) {
      errors.push({ source: SOURCE_URL, error: `HTTP ${response.status}` })
    } else {
      const html = await response.text()
      const entries = extractSchools(html)
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
    }
  } catch (error) {
    errors.push({ source: SOURCE_URL, error: error instanceof Error ? error.message : "Unknown error" })
  }

  return Response.json({
    source: SOURCE_URL,
    total: results.size,
    items: Array.from(results.values()),
    errors,
  })
}
