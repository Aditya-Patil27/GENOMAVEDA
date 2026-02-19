import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PharmaGuardProvider } from "@/context/PharmaGuardContext";
import PlasmaBackground from "@/components/PlasmaBackground";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#00E5CC",
};

export const metadata: Metadata = {
  title: "GenomaVeda — Pharmacogenomic Risk Prediction",
  description:
    "AI-powered pharmacogenomics analysis: preventing adverse drug reactions through precision medicine. Upload VCF files and get CPIC-aligned risk predictions.",
  keywords: [
    "pharmacogenomics",
    "drug safety",
    "VCF analysis",
    "CPIC",
    "precision medicine",
    "adverse drug reactions",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GenomaVeda",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Libre+Baskerville:wght@400;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {/* React Bits Plasma background */}
        <PlasmaBackground color="#ffffff" speed={0.6} opacity={0.8} />

        <PharmaGuardProvider>
          <div className="relative z-10">{children}</div>
        </PharmaGuardProvider>
      </body>
    </html>
  );
}
