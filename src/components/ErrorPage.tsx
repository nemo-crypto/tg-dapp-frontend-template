import { useEffect } from "react"

export function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset?: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="text-white">
      <h2>An unhandled error occurred!</h2>
      <blockquote>
        <code>{error.message}</code>
      </blockquote>
      {reset && <button onClick={() => reset()}>Try again</button>}
    </div>
  )
}
