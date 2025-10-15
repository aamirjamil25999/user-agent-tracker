import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'User & Agent Activity Tracker',
  description: 'Prototype with Tailwind CSS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        <footer className="mt-12 py-6">
          <div className="max-w-4xl mx-auto px-4 text-sm text-gray-500">
            © {new Date().getFullYear()} Agent Activity Tracker. Built by Aamir.
          </div>
        </footer>
      </body>
    </html>
  );
}