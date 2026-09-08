import './globals.css';
import type { Metadata } from 'next';
import { GlobalAITrigger } from '@/components/ai';
import { AppLayout } from '@/components/ui';
import { ProfileProvider } from '@/hooks/useProfile';

export const metadata: Metadata = {
  title: 'VittMitra (वित्तमित्र) — AI-Driven Scheme Matching Platform',
  description: 'Intelligent government scheme matching, financial structuring, and application assistance for marginalized entrepreneurs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', margin: 0, padding: 0 }}>
        <ProfileProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <GlobalAITrigger />
        </ProfileProvider>
      </body>
    </html>
  );
}



