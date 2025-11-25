import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t py-5 mt-auto">
      <div className="max-w-3xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link href="#" className="hover:text-gray-900">Про нас</Link>
        </div>
        <p>&copy; ShuttleStats 2025</p>
      </div>
    </footer>
  );
}