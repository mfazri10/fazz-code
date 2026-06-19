"use client";

import { ArrowLeft, Calendar, Clock, Code2, Mail, User } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Kamu belum login</p>
        <Link href="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  const user = session.user;
  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : user.name
      ? user.name.slice(0, 2).toUpperCase()
      : "U";

  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Fazz Code
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Profile Card */}
        <Card className="border-border/60">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">
              {user.name || "User"}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </CardDescription>
            <div className="mt-3 flex justify-center">
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" />
                {user.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-border/60 p-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Bergabung</p>
                  <p className="text-sm font-medium">{createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/60 p-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Session</p>
                  <p className="text-sm font-medium">Aktif</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/workspace">
            <Button variant="outline" className="h-auto w-full justify-start p-4">
              <Code2 className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Proyek Saya</p>
                <p className="text-xs text-muted-foreground">
                  Kelola proyek yang sudah dibuat
                </p>
              </div>
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="h-auto w-full justify-start p-4">
              <ArrowLeft className="mr-3 h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Kembali</p>
                <p className="text-xs text-muted-foreground">
                  Kembali ke landing page
                </p>
              </div>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
