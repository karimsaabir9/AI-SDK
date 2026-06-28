import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Multi-Tool Studio — Database Chat, Movies & Dad Jokes',
  description:
    'An AI-powered application featuring natural language database queries, TMDB movie search with MongoDB caching, and dad jokes with ratings. Built with Next.js, AI SDK, and MongoDB.',
  keywords: ['AI', 'MongoDB', 'Next.js', 'AI SDK', 'TMDB', 'Movies', 'Chatbot'],
  authors: [{ name: 'AI Studio' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
