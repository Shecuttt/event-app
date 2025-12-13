import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import supabase from "@/utils/supabase";
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeClosed,
} from "lucide-react";
import { CardHeader } from "@/components/ui/card";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GoogleSignInButton from "@/components/auth/GoogleSignIn";

const registerSchema = z
  .object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      setError(
        signUpError.message === "User already registered"
          ? "Email sudah terdaftar"
          : signUpError.message
      );
      setIsLoading(false);
      return;
    }

    // Kalo Supabase email confirmation disabled, langsung redirect
    // Kalo enabled, kasih notif cek email
    setSuccess(true);
    setIsLoading(false);

    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  if (success) {
    return (
      <div className="text-center">
        <Alert className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </Alert>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Registrasi Berhasil!
        </h2>
        <p className="text-gray-600 mb-6">
          Akun kamu udah dibuat. Redirecting ke login...
        </p>
      </div>
    );
  }

  return (
    <>
      <CardHeader className="text-2xl text-center font-bold text-gray-900">
        Register
      </CardHeader>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2"
              />
              <Button
                type="button"
                variant="ghost"
                size={"icon-sm"}
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 -translate-y-1/2"
              >
                {showPassword ? <Eye /> : <EyeClosed />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Konfirmasi Password
            </FieldLabel>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                {...register("confirmPassword")}
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2"
              />
              <Button
                type="button"
                variant="ghost"
                size={"icon-sm"}
                onClick={toggleShowConfirmPassword}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="absolute top-1/2 right-2 -translate-y-1/2"
              >
                {showConfirmPassword ? <Eye /> : <EyeClosed />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </Field>
        </FieldGroup>

        <FieldSeparator className="my-4" />

        <Button type="submit" disabled={isLoading} className="w-full ">
          {isLoading ? "Loading..." : "Register"}
        </Button>
      </form>

      <GoogleSignInButton mode="signup" />

      <p className="text-center text-sm text-gray-600">
        Udah punya akun?{" "}
        <Link to="/login" className="text-blue-600 hover:underline font-medium">
          Login
        </Link>
      </p>
    </>
  );
}
