import type { Metadata } from "next";
import { Inter, Poppins, Playfair_Display, DM_Mono } from "next/font/google";
import "./globals.css";
// import Navbar from "@/components/navbar";
import { AuthProvider } from "@/utils/Authsegment";
import { LessonsProvider } from "@/utils/userprogress/lessonprogress";
import { TechniquesProvider } from "@/utils/userprogress/techniqueContext";
import { AudioProvider } from "@/components/audio/AudioProvider";
// import UnauthUserNavbar from "@/components/navbar2";
import { createServerSupabase } from "@/lib/supabase/server";
// import Navbar from "@/components/navbar";
// import UnauthUserNavbar from "@/components/navbar2";
import NavbarSwitcher from "@/components/navswitcher";




const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});
export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://YOURDOMAIN.com"),

  title: {
    default: "Learn Piano. Build Your Practice. Play With Confidence.",
    template: "%s | LearnKeys",
  },

  description:
    "Learn piano with structured lessons, sight-reading practice, technique training, songs, and progress tracking. Build consistent practice habits and become a more confident pianist with LearnKeys.",

  applicationName: "LearnKeys",

  keywords: [
    "piano lessons",
    "learn piano",
    "learn piano online",
    "piano learning app",
    "online piano lessons",
    "piano practice",
    "piano sight reading",
    "piano technique",
    "piano exercises",
    "piano songs",
    "piano training",
    "piano practice app",
    "learn piano for beginners",
  ],

  authors: [
    {
      name: "Fynovatech",
    },
  ],

  creator: "Fynovatech",
  publisher: "Fynovatech",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-touch-icon.png",
  },

  manifest: "/manifest.webmanifest",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://YOURDOMAIN.com",
    siteName: "LearnKeys",
    title: "Learn Piano. Build Your Practice. Play With Confidence.",
    description:
      "A structured piano-learning platform for lessons, sight-reading, technique, songs, and consistent practice.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LearnKeys Piano Learning Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Learn Piano. Build Your Practice. Play With Confidence.",
    description:
      "Structured piano lessons, sight-reading, technique, songs, and practice tracking with LearnKeys.",
    images: ["/og-image.jpg"],
  },

  alternates: {
    canonical: "https://YOURDOMAIN.com",
  },

  category: "education",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabase();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmMono.variable} ${poppins.variable} ${playfair.variable}`}>
        {/* AuthProvider now wraps NavbarSwitcher too — previously it only
            wrapped <main>, so anything inside NavbarSwitcher (like
            UserPopup) called useAuth() with no provider above it and
            always got the context's null default. */}
        <AuthProvider>
          {/* {session ? <Navbar /> : <UnauthUserNavbar />} */}
          <NavbarSwitcher />
          <main className="w-full">
            <AudioProvider>
              <LessonsProvider><TechniquesProvider>{children}</TechniquesProvider></LessonsProvider>
            </AudioProvider>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}