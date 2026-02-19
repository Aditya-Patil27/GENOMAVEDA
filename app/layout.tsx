import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PharmaGuard — Pharmacogenomic Risk Prediction",
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
