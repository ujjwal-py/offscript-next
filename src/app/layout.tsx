import type { Metadata } from "next";
import { Share_Tech } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/components/user-provider";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { getAuthUser } from "@/lib/auth";

const shareTech = Share_Tech({
  variable: "--font-tech",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Offscript",
    template: "%s | Offscript",
  },
  description:
    "Offscript is a fullstack blogging and social publishing platform. Create drafts, submit posts for moderation, and share published stories.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getAuthUser();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${shareTech.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider>
          <UserProvider user={user}>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster position="bottom-right" />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
