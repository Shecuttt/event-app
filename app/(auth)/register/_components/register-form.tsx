"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/src/actions/auth";
import { registerSchema, type RegisterInput } from "@/src/lib/validations/auth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldContent } from "@/components/ui/field";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    const result = await registerUser(data);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      router.push("/");
      router.refresh();
    }
  };

  const loginWithGoogle = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your details below to create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}
          
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldContent>
                  <Input id="name" placeholder="John Doe" disabled={isSubmitting || isGoogleLoading} {...field} />
                </FieldContent>
                <FieldError errors={[{ message: errors.name?.message }]} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    disabled={isSubmitting || isGoogleLoading}
                    {...field}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.email?.message }]} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    disabled={isSubmitting || isGoogleLoading}
                    {...field}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.password?.message }]} />
              </Field>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleLoading}>
            {isSubmitting ? "Creating account..." : "Register"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={loginWithGoogle}
            disabled={isSubmitting || isGoogleLoading}
          >
            {isGoogleLoading ? "Connecting..." : "Google"}
          </Button>

          <div className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Log in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
