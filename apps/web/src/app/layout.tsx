import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "にほんご — Belajar Bahasa Jepang",
  description: "Belajar bahasa Jepang dari nol hingga lulus JLPT/JFT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
