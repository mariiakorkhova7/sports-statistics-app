import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Footer from '@/components/Footer';
import BracketView from '@/components/ui/tournament/BracketView';
import { Tournament, Participant } from '@/lib/types';

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
      console.error("Помилка завантаження учасників");
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

  const handleCloseTournament = async () => {
    if (!confirm('Ви впевнені, що хочете завершити турнір? Всі результати буде зафіксовано.')) return;
    
    try {
      await fetch(`/api/tournaments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      fetchTournament(id as string); 
    } catch (err) {
      alert('Помилка');
    }
  };

  const getParticipantLabel = (count: number) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'учасників';
  if (lastDigit === 1) return 'учасник';
  if (lastDigit >= 2 && lastDigit <= 4) return 'учасники';
  return 'учасників';
  };

  if (authLoading || loading) return <div className="p-10 text-center">Завантаження...</div>;
  if (!tournament) return <div className="p-10 text-center">Турнір не знайдено</div>;

  const firstEventId = tournament.events[0]?.id || 0;

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
                  Розпочати турнір
                </Button>
              )}

              {tournament.status === 'ongoing' && (
                <Button 
                  size="sm" 
                  onClick={handleCloseTournament}
                >
                  Завершити турнір
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start h-auto bg-transparent border">
              <TabsTrigger value="overview" className="text-gray-500 data-[state=active]:text-white data-[state=active]:bg-gray-900">
                Огляд
              </TabsTrigger>
              <TabsTrigger value="participants" className="text-gray-500 data-[state=active]:text-white data-[state=active]:bg-gray-900">
                Учасники
              </TabsTrigger>
              <TabsTrigger value="bracket" className="text-gray-500 data-[state=active]:text-white data-[state=active]:bg-gray-900">
                Турнірна сітка та матчі
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle>Деталі</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Опис</h4>
                      <p className="mt-1 text-gray-900 whitespace-pre-wrap">{tournament.description || 'Відсутній'}</p>
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
                  <CardHeader><CardTitle>Розряд</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tournament.events.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div><p className="font-medium text-gray-900">{event.name}</p></div>
                          <span className="text-sm">{event.participant_count} {getParticipantLabel(event.participant_count)}</span>
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
                              <td className="py-3 font-medium text-gray-900">{p.first_name} {p.last_name}</td>
                              <td className="py-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{p.event_name}</span></td>
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
                    <p className="mb-4">Турнір ще не розпочато.</p>
                  </CardContent>
                </Card>
              ) : (
                <BracketView tournamentId={id as string} eventId={firstEventId} />
              )}
            </TabsContent>
          </Tabs>

        </div>
      </div>
      <Footer />
    </div>
  );
}
