import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "NexusOps",
  description: "A focused operations workspace for connected teams.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4f6f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
