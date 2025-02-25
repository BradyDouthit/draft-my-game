import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "@/styles/theme.css";

export const metadata: Metadata = {
  title: "Draft My Game | Professional Game Design Document Generator",
  description: "DraftMyGame.com helps indie developers create professional game design documents instantly. Generate structured, comprehensive GDDs with market analysis and development strategies.",
  keywords: ["game design document", "GDD generator", "indie game development", "game design tool", "game documentation", "DraftMyGame", "game planning", "game development", "indie games", "game business strategy"],
  metadataBase: new URL('https://draftmygame.com'),
  openGraph: {
    title: 'Draft My Game | Professional Game Design Document Generator',
    description: 'Create professional game design documents instantly with DraftMyGame.com',
    url: 'https://draftmygame.com',
    siteName: 'Draft My Game',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draft My Game | Professional Game Design Document Generator',
    description: 'Create professional game design documents instantly with DraftMyGame.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
