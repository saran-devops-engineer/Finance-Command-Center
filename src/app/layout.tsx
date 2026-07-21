import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppBootstrap } from "@/components/app-bootstrap";
import { INSTALLED_APP_NAME, SITE_TITLE } from "@/lib/branding";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_TITLE}`
  },
  description: "A private, local-first financial decision support system.",
  applicationName: SITE_TITLE,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: INSTALLED_APP_NAME
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: "/apple-touch-icon.svg"
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f2eee5"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className={cn(inter.variable, playfair.variable)}>
        <AppBootstrap>{children}</AppBootstrap>
      </body>
    </html>
  );
}
