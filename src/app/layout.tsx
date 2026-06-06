import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProfileSync from "@/components/layout/ProfileSync";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Ortist — Designer Community",
  description: "A social platform for designers to share work and get hired",
  icons: {
    icon: "/login-image/ortists logo.jpeg",
    shortcut: "/login-image/ortists logo.jpeg",
    apple: "/login-image/ortists logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className={`${inter.className} min-h-full`}>
          <ThemeProvider>
            <ProfileSync />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
