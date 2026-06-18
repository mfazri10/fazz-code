"use client";

import { Code2, Mail, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] || "User",
        });

        if (error) {
          setMessage(error.message || "Sign up failed");
        } else {
          setMessage("Account created! Redirecting...");
          window.location.href = "/";
        }
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });

        if (error) {
          setMessage(error.message || "Sign in failed");
        } else {
          setMessage("Signed in! Redirecting...");
          window.location.href = "/";
        }
      }
    } catch {
      setMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch {
      setMessage("GitHub login failed");
      setLoading(false);
    }
  };

  const isError =
    message.includes("error") ||
    message.includes("failed") ||
    message.includes("Error");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background p-10 lg:flex">
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Fazz Code</span>
        </div>
        <div className="relative space-y-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            Bangun aplikasi web dengan bantuan multi-agent AI
          </h2>
          <p className="max-w-sm text-muted-foreground">
            Planner, Generator, Reviewer, dan Fixer bekerja bersama menulis dan
            memperbaiki kode untukmu.
          </p>
        </div>
        <p className="relative text-xs text-muted-foreground">© Fazz Code</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mb-6 space-y-1 text-center">
            <h1 className="text-2xl font-bold">
              {isSignUp ? "Buat akun" : "Selamat datang kembali"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? "Buat akun untuk mulai membangun"
                : "Masuk untuk melanjutkan membangun"}
            </p>
          </div>

          <div className="space-y-4">
            {/* GitHub Login */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGithubLogin}
              disabled={loading}
            >
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Lanjut dengan GitHub
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Atau lanjut dengan email
                </span>
              </div>
            </div>

            {/* Email/Password Login */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Mail className="mr-2 h-4 w-4" />
                {loading
                  ? "Memuat..."
                  : isSignUp
                  ? "Buat akun"
                  : "Masuk"}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp
                  ? "Sudah punya akun? Masuk"
                  : "Belum punya akun? Daftar"}
              </Button>
            </div>

            {message && (
              <p
                className={`text-center text-sm ${
                  isError ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
