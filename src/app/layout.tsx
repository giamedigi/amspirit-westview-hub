import type { Metadata, Viewport } from "next";
import "./globals.css";
import { InstallGuide } from "@/components/install-guide";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: {
    default: "AM Spirit West View Chapter Hub",
    template: "%s | AM Spirit West View",
  },
  description:
    "Practical chapter information, events, members, announcements, and Lunch Connections.",
  applicationName: "AM Spirit West View",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "West View",
    statusBarStyle: "default",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#b4232f",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
        <InstallGuide />
      </body>
    </html>
  );
}
