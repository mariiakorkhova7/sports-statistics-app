import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/AuthContext';
import Footer from '@/components/Footer';

interface Tournament {
  id: number;
  name: string;
  start_date: string;
  location: string;
  status: 'upcoming' | 'ongoing';
  description: string;
}

export default function Home() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments/public/list');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
      }
    } catch (error) {
      console.error("Не вдалося завантажити турніри");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>ShuttleStats - Головна</title>
        <meta name="description" content="Platform for badminton tournaments" />
      </Head>

      <section className="bg-white border-b py-35 px-4 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          Керуй своєю грою
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Бери участь у турнірах та відстежуй статистику матчів.<br></br> ShuttleStats дозволяє організаторам легко керувати змаганнями з бадмінтону, а гравцям дізнаватися свій прогрес
        </p>
        {!user && (
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button>Зареєструватися</Button>
            </Link>
            <Link href="/login">
              <Button>Увійти</Button>
            </Link>
          </div>
        )}
        {user && (
          <Link href="/profile">
             <Button>Перейти до особистого профілю</Button>
          </Link>
        )}
      </section>

      <main className="max-w-3xl mx-auto py-8 px-4 min-h-screen">
        <h2 id="tournaments" className="text-3xl font-bold text-gray-900 mb-8" style={{ scrollMarginTop: '80px' }}>Актуальні турніри</h2>
        
        {loading ? (
          <div className="text-center text-gray-500">Завантаження подій...</div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed">
            <p className="text-gray-500 text-lg">На жаль, зараз немає актуальних турнірів.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <Card key={t.id} className="hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                <CardHeader className="flex flex-col items-center">
                  <div className="mb-3">
                    <span className={`text-sm px-3 py-1 ${
                      t.status === 'upcoming' ? 'bg-gray-100' : 'bg-gray-100'
                    }`}>
                      {t.status === 'upcoming' ? 'Реєстрацію відкрито' : 'В процесі'}
                    </span>
                  </div>
                  <CardTitle className="text-xl line-clamp-2">{t.name}</CardTitle>
                </CardHeader>
        
                <CardContent className="grow flex flex-col items-center">
                  <div className="space-y-2 text-sm text-gray-500 mb-6 w-full">
                    <div className="flex items-center justify-center gap-2">
                      <span>{new Date(t.start_date).toLocaleDateString('uk-UA')}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="line-clamp-1">{t.location}</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <Link href={`/tournaments/${t.id}/register`}>
                      <Button>
                        Детальніше
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
