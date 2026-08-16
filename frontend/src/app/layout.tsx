import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'EventHub DBU — AI-Powered Campus Event Management',
  description: 'The ultimate platform for university events at Debre Birhan University. Discover, register, scan tickets, and generate certificates seamlessly.',
  keywords: ['DBU', 'Debre Birhan University', 'Event Management', 'Campus Events', 'Tickets', 'QR Attendance'],
  authors: [{ name: 'EventHub DBU Team' }],
  openGraph: {
    title: 'EventHub DBU — Campus Event Management Platform',
    description: 'Discover and join exciting campus events at Debre Birhan University.',
    type: 'website',
    locale: 'en_US',
    siteName: 'EventHub DBU',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
