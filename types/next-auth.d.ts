import NextAuth, { DefaultSession, User as DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      /** The user's id. */
      id: string;
      /** The user's role. */
      role: string;
    } & DefaultSession["user"];
  }

  /**
   * Extend the built-in user types
   */
  interface User extends DefaultUser {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    id: string;
    role: string;
  }
}
