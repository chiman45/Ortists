import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Ortist — Designer Community",
  description: "A social platform for designers to share work and get hired",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
