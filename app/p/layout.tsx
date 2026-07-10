import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Proposta",
  description: "Proposta comercial",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={cn("antialiased", inter.variable, "font-sans")}>
      <body className="min-h-screen bg-white text-black">
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
