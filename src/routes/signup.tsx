import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

interface SignupForm {
  email: string;
  password: string;
}

function SignupPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignupForm>();

  const onSubmit = async (data: SignupForm) => {
    setAuthError(null);
    const { getSupabaseBrowserClient } = await import("@/lib/supabase.browser");
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          status: "pending",
          role: null,
        },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setAuthError("An account with this email already exists.");
      } else {
        setAuthError("Something went wrong. Please try again.");
      }
      return;
    }
    await router.navigate({ to: "/pending" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        {/* Logo mark */}
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary shadow-sm shadow-primary/20">
          <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground/90" />
        </div>

        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Create account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Request access to Hialeah Auto Works.
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
              autoComplete="new-password"
              {...register("password", { required: true })}
            />
          </div>

          {authError && <p className="text-sm text-destructive">{authError}</p>}

          <Button
            type="submit"
            className="mt-2 h-10 w-full"
            disabled={isSubmitting}
          >
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
