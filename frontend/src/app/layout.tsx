import type { Metadata } from 'next';
import '@/styles/design-system.css';

export const metadata: Metadata = {
  title: 'ARISE - Solo Leveling Habit Tracker',
  description: 'Level up your habits. Become a Hunter.',
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
