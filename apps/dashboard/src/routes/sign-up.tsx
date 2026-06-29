import { createFileRoute, redirect } from '@tanstack/react-router'

// Sign-up is modal-based (Clerk `<SignUpButton mode="modal">`), so there is no
// dedicated sign-up page. A direct visit to /sign-up (or Clerk's default
// redirect-to-sign-up fallback) used to 404. Redirect to the app shell instead:
// anonymous visitors get the welcome/demo with the sign-up button.
export const Route = createFileRoute('/sign-up')({
  beforeLoad: () => {
    throw redirect({
      to: '/overview',
      search: {
        host: 0,
      },
    })
  },
})
