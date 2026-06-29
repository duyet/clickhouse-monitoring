import { createFileRoute, redirect } from '@tanstack/react-router'

// Sign-in is modal-based (Clerk `<SignInButton mode="modal">`), so there is no
// dedicated sign-in page. A direct visit to /sign-in (a bookmark, a deep link,
// or Clerk's default redirect-to-sign-in fallback) used to 404. Redirect to the
// app shell instead: anonymous visitors get the welcome/demo with the sign-in
// button, signed-in users get the dashboard.
export const Route = createFileRoute('/sign-in')({
  beforeLoad: () => {
    throw redirect({
      to: '/overview',
      search: {
        host: 0,
      },
    })
  },
})
