import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from 'geist/font/sans';
import 'katex/dist/katex.min.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Metadata, Viewport } from "next";
import { Syne } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from './providers';
import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Script from 'next/script';

export const experimental_ppr = true;

export const metadata: Metadata = {
  metadataBase: new URL("https://scira.ai"),
  title: "AIDA - UM6P",
  description: "AIDA - UM6P is a minimalistic AI-powered search engine that helps you find information on the internet.",
  openGraph: {
    url: "https://scira.ai",
    siteName: "AIDA - UM6P",
  },
  keywords: [
    "aida.um6p",
    "aida um6p",
    "AIDA - UM6P",
    "aida - um6p",
    "AIDA.UM6P",
    "aida github",
    "ai search engine",
    "AIDA",
    "aida",
    "aida.app",
    "aida ai",
    "aida ai app",
    "aida",
    "MiniPerplx",
    "AIDA - UM6P",
    "open source ai search engine",
    "minimalistic ai search engine",
    "ai search engine",
    "AIDA (Formerly MiniPerplx)",
    "AI Search Engine",
    "mplx.run",
    "mplx ai",
    "zaid mukaddam",
    "aida.how",
    "search engine",
    "AI",
    "perplexity",
    "um6p"
  ]
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' }
  ],
}

const syne = Syne({ 
  subsets: ['latin'], 
  variable: '--font-syne',
  preload: true,
  display: 'swap',
});

// Define static user based on your schema
const staticUser = {
  id: "87571490-ca7f-4082-ac53-36e48e000247",
  email: "Khalid.baba@um6.ma", // You can change this email
  password: null // Optional field in your schema
} as const;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${syne.variable} font-sans antialiased`}>
        <Script
          src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
          strategy="beforeInteractive"
        />
        <NuqsAdapter>
          <Providers>
            <SidebarProvider defaultOpen={!isCollapsed}>
              <AppSidebar user={staticUser} />
              <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
            <Toaster position="top-center" richColors theme="system" />
          </Providers>
        </NuqsAdapter>
        <Analytics />
      </body>
    </html>
  );
}