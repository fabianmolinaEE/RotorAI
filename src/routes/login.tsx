import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

interface LoginForm {
  email: string;
  password: string;
}

function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setAuthError(null);
    const { getSupabaseBrowserClient } = await import("@/lib/supabase.browser");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      if (
        error.message.toLowerCase().includes("invalid") ||
        error.message.toLowerCase().includes("credentials")
      ) {
        setAuthError("Incorrect email or password.");
      } else {
        setAuthError("Something went wrong. Please try again.");
      }
      return;
    }
    // AuthContext will pick up the session via onAuthStateChange.
    // Navigate to work-orders; auth guard handles role-specific landing.
    await router.navigate({ to: "/work-orders" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        {/* Logo mark */}
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary shadow-sm shadow-primary/20">
          <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground/90" />
        </div>

        <h1 className="mt-4 text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and password to access your workspace.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: true })}
            />
          </div>

          {authError && <p className="text-sm text-destructive">{authError}</p>}

          <Button
            type="submit"
            className="mt-2 h-10 w-full"
            disabled={isSubmitting}
          >
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-foreground underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
