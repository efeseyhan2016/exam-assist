import type { Metadata } from "next";

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
