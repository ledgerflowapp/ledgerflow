import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import ThemeWrapper from "@/components/providers/ThemeWrapper";
import ErrorBoundary from "@/components/providers/ErrorBoundary";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LedgerFlow",
    template: "%s | LedgerFlow",
  },
  description: "Dual Persona Financial & Group Ledger App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${geistMono.variable}`}>
      <body
        className="antialiased"
      >
        <QueryProvider>
          <ErrorBoundary>
            <ThemeWrapper>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </ThemeWrapper>
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
