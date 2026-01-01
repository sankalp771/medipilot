import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediPilot | AI Care Navigator",
  description: "Your personalized health assistant.",
};

import { ModeToggle } from "@/components/mode-toggle";

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={cn(inter.className, "antialiased bg-slate-50 dark:bg-slate-950 min-h-screen")}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header className="flex justify-end items-center p-4 gap-4 absolute top-0 right-0 w-full z-10 pointer-events-none sticky-header-auth">
              <div className="pointer-events-auto flex items-center gap-4">
                <ModeToggle />
                <SignedOut>
                  <div className="flex gap-2">
                    <SignInButton mode="modal">
                      <button className="text-sm font-medium hover:underline underline-offset-4 px-3 py-2">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium text-sm px-4 py-2 transition-colors">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </header>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
