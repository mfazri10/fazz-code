import { betterAuth } from "better-auth";
import { Pool } from "pg";

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fazzcode",
});

export const auth = betterAuth({
  database: pool,
  
  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  // Social providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET || "fazz-code-secret-change-in-production",

  // Base URL
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

// Export types
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
