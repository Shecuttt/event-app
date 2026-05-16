"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { registerSchema, type RegisterInput } from "@/src/lib/validations/auth";

export async function registerUser(data: RegisterInput) {
  try {
    const validatedData = registerSchema.parse(data);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return { error: "Email already exists" };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    await db.insert(users).values({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      isOrganizer: false,
    });

    try {
      await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });
      return { success: true };
    } catch (error) {
      if (error instanceof AuthError) {
        return { error: "Failed to automatically sign in after registration." };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to register user. Please try again." };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

