"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

type AuthFormData = {
  username: string;
  email: string;
  password: string;
};

type Mode = "signin" | "signup";

/**
 * Sign in / sign up form, ported from the original Sign page.
 * Calls POST /v1/signin or POST /v1/signup and then navigates to /profile.
 */
function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [formData, setFormData] = useState<AuthFormData>({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (mode === "signin") {
        await apiFetch("/signin", {
          method: "POST",
          body: { email: formData.email, password: formData.password },
        });
      } else {
        await apiFetch("/signup", {
          method: "POST",
          body: {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          },
        });
      }

      setFormData({
        username: "",
        email: "",
        password: "",
      });

      toast.success(`${mode} successfully`);
      router.push("/home");
      router.refresh();
    } catch {
      // The api client already displayed the error toast.
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {mode === "signup" ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "signup" ? "Sign up to get started" : "Sign in to continue"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex w-full flex-col gap-4">
            {mode === "signup" && (
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  placeholder="Enter your username"
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                placeholder="Enter your email"
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                placeholder="Enter your password"
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full">
              {mode === "signup" ? "Sign up" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "Already registered? Sign in" : "Need an account? Sign up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default AuthForm;
