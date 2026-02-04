import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/components/auth-provider";
import { BabyProvider } from "@/context/baby-context";
import { ToasterWrapper } from "@/components/ui/toaster-wrapper";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BabyNest Monitor",
  description: "Next Generation Baby Monitoring",
};

/**
 * Viewport configuration for safe area insets support
 * 
 * viewport-fit=cover is required for env(safe-area-inset-*) CSS values to work
 * on devices with notches (iPhone X+) and home indicators.
 * 
 * @requirements 20.5 - Safe area insets for mobile devices
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// Script to apply theme before React hydration to prevent flash
const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('displaySettings');
      if (saved) {
        var settings = JSON.parse(saved);
        var theme = settings.theme;
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          }
        }
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${outfit.variable} ${plusJakartaSans.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <BabyProvider>
            <AppShell>{children}</AppShell>
          </BabyProvider>
          <ToasterWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
