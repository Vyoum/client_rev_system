import { Suspense } from "react"
import SearchCommunityPage from "../components/search-community-page"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <SearchCommunityPage />
    </Suspense>
  )
}
