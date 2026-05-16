import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/src/db";
import * as schema from "@/src/db/schema";
import { eq } from "drizzle-orm";
import type { DefaultSession } from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
    authenticatorsTable: schema.authenticators,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, credentials.email as string))
          .limit(1);

        if (!user.length) {
          return null;
        }

        const userRecord = user[0];

        if (!userRecord.passwordHash) {
          // User exists but no password - likely OAuth-only user
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          userRecord.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          isOrganizer: userRecord.isOrganizer,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isOrganizer = user.isOrganizer;
      }

      if (token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(schema.users.email, token.email),
          columns: { id: true, isOrganizer: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isOrganizer = dbUser.isOrganizer;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.isOrganizer = token.isOrganizer as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isOrganizer: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isOrganizer: boolean;
  }
}
