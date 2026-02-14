import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Import Outfit
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" }); // Configure Outfit

export const metadata: Metadata = {
  title: "AI Book Generator",
  description: "Create personalized books with AI",
};

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, outfit.variable, "antialiased")}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
