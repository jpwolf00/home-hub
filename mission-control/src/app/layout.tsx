import './globals.css';

export const metadata = {
  title: 'Mission Control',
  description: 'Read-only Mission Control MVP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
