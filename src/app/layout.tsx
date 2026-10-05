import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "CubeSchool: learn CFOP", template: "%s · CubeSchool" },
  description: "Learn to speedsolve the Rubik's cube with the CFOP method, with animated 3D algorithms.",
};

// viewportFit "cover" lets the phone bottom bar sit above the home indicator via safe-area insets.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0c10",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:pb-24 sm:pt-8">{children}</main>
        {/* Extra bottom padding on phones so the fixed tab bar never covers the footer */}
        <footer className="border-t border-white/[0.06] px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 text-center text-xs text-zinc-600 md:pb-6">

          Colours: yellow top, green front, orange right, white bottom (standard scheme).
        </footer>
      </body>
    </html>
  );
}
