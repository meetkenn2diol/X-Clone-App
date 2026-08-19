/(backend)
1. > npm init -y 
to initialize the package.json
2. > npm install express mongoose dotenv cors @clerk/express @arcjet/node @arcjet/inspect
express — the core web framework for building your API routes, middleware, and server.
mongoose — an ODM (object-document mapper) that lets you define schemas and interact with MongoDB using JS objects instead of raw queries.
dotenv — loads environment variables from a .env file into process.env, keeping secrets (API keys, DB URIs) out of your code.
cors — Express middleware that controls which origins are allowed to make cross-origin requests to your API (needed for your frontend on a different port/domain to talk to the backend).
@clerk/express — Clerk's official Express SDK for handling authentication (session verification, user data, middleware) server-side.
@arcjet/node — the core Arcjet SDK for Node.js, providing bot protection, rate limiting, shield WAF (SQL injection/XSS defense), email validation, and sensitive-info detection to protect your API endpoints from abuse.
@arcjet/inspect — a companion utility package that makes it easier to interact with and interpret Arcjet's decision metadata (e.g. checking if a bot was spoofed), used alongside @arcjet/node rather than standalone.



/(Mobile)
1. install expo run > npx create-expo@latest
2. then reset the expo app

/backend
1. create the src/server.js file
This file contains
// IMPORTS
// CONSTANTS
// MIDDLEWARE
// ROUTES
// ERROR HANDLING MIDDLEWARE
// START SERVER
//EXPORT FOR VERCEL
2. > npm install nodemon -D  
install nodemon -D for automatic watching a server file during development
3. modify the package.json >   "type": "module",