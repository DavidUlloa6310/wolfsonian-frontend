import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FIU Wolfsonian: Data Visualization",
  description:
    "The Wolfsonian Collection Data Visualization platform offers an interactive exploration of Florida International University's unique museum collection. Developed by FIU computer science students, this tool transforms complex collections data into accessible visualizations across genres, classifications, publication dates, geographic origins, materials, languages, and subjects. Discover the persuasive power of art and design through dynamic charts revealing collection patterns from the late 19th century to 2020, with special focus on the transformative period from 1885 to 1945. Each visualization is accompanied by featured items from the collection, providing deeper insight into The Wolfsonian–FIU's mission of illustrating how design shapes human experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.className}>
      <body>{children}</body>
    </html>
  );
}
