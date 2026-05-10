"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerSchema, RegisterInput, registerUser } from "@/src/actions/auth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldLabel, FieldError, FieldContent } from "@/components/ui/field";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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
      role: "participant",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    const result = await registerUser(data);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      router.push("/dashboard");
    }
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
                  <Input id="name" placeholder="John Doe" disabled={isSubmitting} {...field} />
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    {...field}
                  />
                </FieldContent>
                <FieldError errors={[{ message: errors.password?.message }]} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Field>
                <FieldLabel>Role</FieldLabel>
                <FieldContent>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="participant" id="participant" />
                      <FieldLabel htmlFor="participant" className="font-normal">
                        Participant
                      </FieldLabel>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="organizer" id="organizer" />
                      <FieldLabel htmlFor="organizer" className="font-normal">
                        Event Organizer
                      </FieldLabel>
                    </div>
                  </RadioGroup>
                </FieldContent>
                <FieldError errors={[{ message: errors.role?.message }]} />
              </Field>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
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
