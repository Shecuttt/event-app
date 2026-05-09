import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Get the current session in server components
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth();
  return session;
}

/**
 * Require a specific role for access
 * Throws 403 error if user doesn't have required role
 * @param requiredRole The role required to access the resource
 * @param session Optional session parameter (if already fetched)
 */
export async function requireRole(
  requiredRole: "participant" | "organizer",
  session?: Session | null
): Promise<Session> {
  const currentSession = session || (await auth());

  if (!currentSession) {
    throw new Error("Unauthorized - No session found");
  }

  if (currentSession.user.role !== requiredRole) {
    throw new Error(
      `Forbidden - Required role: ${requiredRole}, Current role: ${currentSession.user.role}`
    );
  }

  return currentSession;
}

/**
 * Check if user has organizer role
 * @param session Optional session parameter (if already fetched)
 */
export async function isOrganizer(session?: Session | null): Promise<boolean> {
  const currentSession = session || (await auth());
  return currentSession?.user.role === "organizer";
}

/**
 * Check if user has participant role
 * @param session Optional session parameter (if already fetched)
 */
export async function isParticipant(session?: Session | null): Promise<boolean> {
  const currentSession = session || (await auth());
  return currentSession?.user.role === "participant";
}
