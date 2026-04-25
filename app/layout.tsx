import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Ask Coach | Youth Sports Communication Assistant", description: "Multi-tenant GroupMe AI assistant for youth baseball teams." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
