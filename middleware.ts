// middleware.ts (in root directory)
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Your demo limit logic here
  }
)

export const config = { matcher: ["/api/transactions"] }