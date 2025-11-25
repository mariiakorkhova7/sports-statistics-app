import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Tournament {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  events: Array<{
    id: number;
    category: string;
    name: string;
  }>;
}

const eventTranslations: { [key: string]: string } = {
  "Men's Singles": "Одиночний (чоловіки)",
  "Women's Singles": "Одиночний (жінки)",
  "Men's Doubles": "Парний (чоловіки)",
  "Women's Doubles": "Парний (жінки)",
  "Mixed Doubles": "Змішаний парний"
};

export default function TournamentRegistrationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchTournament(id as string);
    }
  }, [id]);

  const fetchTournament = async (tId: string) => {
    try {
      const res = await fetch(`/api/tournaments/public/${tId}`);
      if (res.ok) {
        const json = await res.json();
        setTournament(json);
      }
    } catch (error) {
      console.error("Не вдалося отримати дані турніру");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && id) {
      checkRegistrationStatus(user.id, id as string);
    }
  }, [user, id]);

  const checkRegistrationStatus = async (uId: number, tId: string) => {
    try {
      const res = await fetch(`/api/tournaments/check-status?userId=${uId}&tournamentId=${tId}`);
      if (res.ok) {
        const ids = await res.json();
        setJoinedEvents(ids);
      }
    } catch (error) {
      console.error("Не вдалося перевірити статус", error);
    }
  };

  const [joinedEvents, setJoinedEvents] = useState<number[]>([]);

  const handleJoin = async (eventId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!confirm('Ви бажаєте зареєструватися на цю категорію?')) return;

    setRegistering(eventId);
    try {
      const res = await fetch('/api/tournaments/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, eventId }),
      });

      if (res.ok) {
        alert('Ви успішно зареєстровані!');
        setJoinedEvents(prev => [...prev, eventId]);
      } else {
        const data = await res.json();
        alert(`Помилка: ${data.message}`);
      }
    } catch (error) {
      alert('Помилка з’єднання');
    } finally {
      setRegistering(null);
    }
  };

  if (authLoading || loading) return <div className="p-10 text-center">Завантаження...</div>;
  if (!tournament) return <div className="p-10 text-center">Турнір не знайдено</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border text-center space-y-4">
          <span className={`inline-block px-3 py-1 text-sm font-medium mb-2 rounded-md ${
            tournament.status === 'upcoming' 
              ? 'bg-gray-100 text-gray-900' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            {tournament.status === 'upcoming' ? 'Реєстрацію відкрито' : 'Реєстрацію закрито'}
          </span>
          
          <h1 className="text-4xl font-extrabold text-gray-900">{tournament.name}</h1>
          
          <div className="flex justify-center gap-6 text-gray-500 text-sm">
            <span className="flex items-center gap-1">{new Date(tournament.start_date).toLocaleDateString('uk-UA')}</span>
            <span>|</span>
            <span className="flex items-center gap-1">{tournament.location}</span>
          </div>
          
          <p className="text-gray-600 max-w-lg mx-auto pt-4 border-t mt-4">
            {tournament.description || 'Опис відсутній'}
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Розряд</h2>
          <div className="grid gap-4">
            {tournament.events.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      {eventTranslations[event.name] || event.name}
                    </h3>
                  </div>
                  {tournament.status === 'upcoming' ? (
                    <Button onClick={() => handleJoin(event.id)} disabled={registering === event.id || joinedEvents.includes(event.id)}
                    size="sm"
                    className="disabled:bg-gray-100 disabled:text-gray-900 disabled:opacity-100">
                      {joinedEvents.includes(event.id) ? 'Вас зареєстровано' : (registering === event.id ? 'Обробка...' : 'Зареєструватися')}
                      </Button>
                  ) : (
                    <Button disabled variant="secondary" size="sm">Недоступно</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}