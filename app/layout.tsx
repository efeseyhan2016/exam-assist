import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "EXAM ASSIST",
  description: "Sınav haftanda neye odaklanman gerektiğini gösteren kişisel çalışma alanın.",
  openGraph: {
    title: "EXAM ASSIST",
    description: "Sınav haftanda neye odaklanman gerektiğini gösteren kişisel çalışma alanın.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body>{children}</body>
    </html>
  );
}
