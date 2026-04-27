import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CoachAssist | Youth Sports Communication Assistant",
  description: "CoachAssist helps busy youth sports coaches keep families informed with clear game details, reminders, and team chat answers.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
