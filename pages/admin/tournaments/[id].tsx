import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Footer from '@/components/Footer';

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
    participant_count: number;
  }>;
}

interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  skill_level: string;
  event_name: string;
  sex: string;
}

const BracketView = () => {
  const matches = [
    { id: '1', round: 1, p1: 'Коваленко І.', p2: 'Бондар О.', s1: [21, 21], s2: [15, 18], winner: 'p1' },
    { id: '2', round: 1, p1: 'Шевченко А.', p2: 'Мельник В.', s1: [19, 20], s2: [21, 22], winner: 'p2' },
    { id: '3', round: 2, p1: 'Коваленко І.', p2: 'Мельник В.', s1: [0, 0], s2: [0, 0], status: 'ongoing' },
  ];

  return (
    <div className="border rounded-xl bg-gray-50 flex flex-col gap-8">
      <div className="p-4 border-b bg-white flex justify-between items-center">
        <h3 className="font-bold">Турнірна сітка (Demo)</h3>
        <span className="text-sm text-gray-500 border px-2 py-1 rounded bg-gray-50">Жіноча одиночна (WS)</span>
      </div>
      <ScrollArea className="w-full whitespace-nowrap p-8">
        <div className="flex gap-12">
          <div className="flex flex-col justify-around gap-8">
            <div className="self-center mb-2 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">1/4 Фіналу</div>
            {matches.filter(m => m.round === 1).map(m => (
              <Card key={m.id} className="w-64 border-l-4 border-l-green-500">
                <CardContent className="p-3 text-sm space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>{m.p1}</span>
                    <span className="text-green-600">{m.s1[0]}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{m.p2}</span>
                    <span>{m.s2[0]}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex flex-col justify-center gap-8">
            <div className="self-center mb-2 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">Півфінал</div>
            {matches.filter(m => m.round === 2).map(m => (
              <Card key={m.id} className="w-64 border-l-4 border-l-blue-500 ring-2 ring-blue-100">
                <CardContent className="p-3 text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">{m.p1}</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold animate-pulse">LIVE</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{m.p2}</span>
                    <span>-</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default function TournamentDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes('organizer')) {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (id) {
      fetchTournament(id as string);
      fetchParticipants(id as string);
    }
  }, [id]);

  const fetchTournament = async (tId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tId}`);
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

   const fetchParticipants = async (tId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tId}/participants`);
      if (res.ok) {
        setParticipants(await res.json());
      }
    } catch (error) {
      console.error("Failed to load participants");
    }
  };

  const handleStartTournament = async () => {
    if (!confirm('Ви впевнені, що хочете розпочати турнір? Реєстрацію буде закрито.')) return;
    
    try {
      await fetch(`/api/tournaments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ongoing' }),
      });
      fetchTournament(id as string); 
    } catch (err) {
      alert('Помилка');
    }
  };

  const getParticipantLabel = (count: number) => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'учасників';
    }
    if (lastDigit === 1) {
      return 'учасник';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'учасники';
    }
    return 'учасників';
  };

  if (authLoading || loading) return <div className="p-10 text-center">Завантаження...</div>;
  if (!tournament) return <div className="p-10 text-center">Турнір не знайдено</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col gap-8">
      <div className="flex-1 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
              <span className={`px-1 py-0.5 rounded-full text-m font-medium ${
                tournament.status === 'ongoing' ? 'text-gray-500' : 
                tournament.status === 'completed' ? 'text-gray-500' : 
                'text-gray-500'
              }`}>
                {tournament.status === 'upcoming' ? 'Заплановано' : 
                 tournament.status === 'ongoing' ? 'В процесі' : 'Завершено'}
              </span>
            </div>
            <p className="text-gray-500 flex items-center gap-2">
              <span>{tournament.location}</span>
              <span>|</span>
              <span>{new Date(tournament.start_date).toLocaleDateString('uk-UA')}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => router.push('/admin/dashboard')}>
              Назад
            </Button>
            {tournament.status === 'upcoming' && (
              <Button size="sm" onClick={handleStartTournament}>
                Розпочати Турнір
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start h-auto bg-transparent border">
            <TabsTrigger 
              value="overview"
              className="text-gray-500 data-[state=active]:text-white data-[state=active]:bg-gray-900"
            >
              Огляд
            </TabsTrigger>
            <TabsTrigger 
              value="participants"
              className="text-gray-500 data-[state=active]:text-white data-[state=active]:bg-gray-900"
            >
              Учасники
            </TabsTrigger>
            <TabsTrigger 
              value="bracket"
              className="text-gray-500 data-[state=active]:text-white data-[state=active]:bg-gray-900"
            >
              Турнірна сітка та матчі
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Деталі</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Опис</h4>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {tournament.description || 'Відсутній'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Від</h4>
                      <p>{new Date(tournament.start_date).toLocaleDateString('uk-UA')}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">До</h4>
                      <p>{new Date(tournament.end_date).toLocaleDateString('uk-UA')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Розряд</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tournament.events.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-900">{event.name}</p>
                        </div>
                        <span className="text-sm">
                          {event.participant_count} {getParticipantLabel(event.participant_count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="mt-6">
            <Card>
              <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Список учасників</CardTitle>
                <span className="text-sm text-gray-500">{participants.length} зареєстровано</span>
              </div>
              </CardHeader>
              <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Ще немає зареєстрованих учасників.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 font-medium border-b">
                          <tr>
                            <th className="pb-3">Ім'я</th>
                            <th className="pb-3">Розряд</th>
                            <th className="pb-3">Рівень навичок</th>
                            <th className="pb-3">Ел. пошта</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {participants.map((p) => (
                            <tr key={`${p.id}-${p.event_name}`} className="hover:bg-gray-50">
                              <td className="py-3 font-medium text-gray-900">
                                {p.first_name} {p.last_name}
                              </td>
                              <td className="py-3">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {p.event_name}
                                </span>
                              </td>
                              <td className="py-3 text-gray-600">{p.skill_level}</td>
                              <td className="py-3 text-gray-500">{p.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="bracket" className="mt-6">
            {tournament.status === 'upcoming' ? (
              <Card>
                <CardContent className="p-10 text-center text-gray-500">
                  <p className="mb-4">Турнір ще не розпочався.</p>
                  <Button onClick={handleStartTournament}>Генерувати сітку та почати</Button>
                </CardContent>
              </Card>
            ) : (
              <BracketView />
            )}
          </TabsContent>
        </Tabs>

      </div>
      </div>
      <Footer />
    </div>
  );
}