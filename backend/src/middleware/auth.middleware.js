/**
 * Protects a route by ensuring the request is authenticated.
 *
 * Relies on Clerk's `clerkMiddleware` having already run earlier in the
 * middleware chain (registered in server.js), which attaches the `auth()`
 * function to the request object. If the request is not authenticated,
 * responds with a 401 error; otherwise passes control to the next handler.
 *
 * @route Middleware — applied to protected routes
 * @access Private
 * @param {import('express').Request} req - Express request object; expects `req.auth()` to be available via Clerk's middleware.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next function, called when authentication succeeds.
 * @returns {void|import('express').Response} Calls `next()` on success, or returns a 401 JSON error response if unauthenticated.
 */
export const protectRoute = async (req, res, next) => {
  if (!req.auth().isAuthenticated) {
    return res.status(401).json({ message: "Unauthorized - you must be logged in" });
  }
  next();
};