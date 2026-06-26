import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <h1 className="text-4xl font-bold text-fd-foreground">404</h1>
      <p className="text-fd-muted-foreground text-lg">Page not found</p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm"
      >
        Back to Docs
      </Link>
    </div>
  )
}
