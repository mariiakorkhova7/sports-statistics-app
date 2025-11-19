import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <Link 
        href="/" 
        className="text-xl font-extrabold text-gray-900 tracking-tight hover:opacity-80 transition-opacity"
      >
        ShuttleScore
      </Link>

      <div className="flex items-center gap-4">
        
        {loading ? (
          <div className="h-9 w-24 bg-gray-100 animate-pulse rounded" />
        ) : (
          <>
            {user ? (
              <>
                <span className="text-sm font-medium text-gray-600 hidden md:block">
                  {user.first_name} {user.last_name}
                </span>

                {user.roles.includes('player') && (
                  <Link href="/profile">
                    <Button size="sm">Мій профіль</Button>
                  </Link>
                )}

                {user.roles.includes('organizer') && (
                  <Link href="/admin/dashboard">
                    <Button size="sm">Організація</Button>
                  </Link>
                )}
                
                <Button 
                  size="sm" 
                  onClick={logout}
                >
                  Вийти
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm">Увійти</Button>
                </Link>
                
                <Link href="/register">
                  <Button size="sm">Реєстрація</Button>
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
}