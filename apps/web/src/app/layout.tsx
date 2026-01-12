import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Axis & Allies Global 1940',
  description: 'Web-based Axis & Allies Global 1940 game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
