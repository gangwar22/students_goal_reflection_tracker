import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Weekly Goal Tracker & Reflection Platform",
  description: "Set weekly goals, log daily evidence reflections, and receive auditable AI analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}

