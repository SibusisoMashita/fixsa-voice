import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { DemoBanner } from "@/components/DemoBanner";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "FixSA Voice — Speak. Track. Fix.", template: "%s | FixSA Voice" },
  description: "A voice-first civic service-delivery reporting agent powered by AssemblyAI. Hackathon demo with synthetic data.",
  openGraph: { title: "FixSA Voice", description: "Speak. Track. Fix.", images: ["/cover-image.svg"] },
  icons: { icon: "/fixsa-mark.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0c201b", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-ZA" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main-content">Skip to content</a><DemoBanner /><SiteHeader /><main id="main-content">{children}</main><Footer /></body></html>;
}
