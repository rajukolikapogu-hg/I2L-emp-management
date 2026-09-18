import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Emp-management",
  description: "Monthly salary payment tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
