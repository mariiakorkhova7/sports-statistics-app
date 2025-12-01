import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Footer from '@/components/Footer';
import { Tournament, Participant, Match } from '@/lib/types';

const groupMatchesByRound = (matches: Match[]) => {
  const rounds: Match[][] = [];
  if (matches.length === 0) return [];

  let totalSlots = matches.length + 1;
  let currentRoundSize = totalSlots / 2;
  let index = 0;

  while (index < matches.length) {
    const roundMatches = matches.slice(index, index + currentRoundSize);
    rounds.push(roundMatches);
    index += currentRoundSize;
    currentRoundSize /= 2;
  }
  return rounds;
};

const getRoundName = (roundIdx: number, totalRounds: number) => {
  const roundsFromFinal = totalRounds - 1 - roundIdx;

  if (roundsFromFinal === 0) return 'Фінал';
  if (roundsFromFinal === 1) return 'Півфінал';
  if (roundsFromFinal === 2) return '1/4 фіналу';
  if (roundsFromFinal === 3) return '1/8 фіналу';

  return `Раунд ${roundIdx + 1}`;
};

const BracketView = ({ tournamentId, eventId }: { tournamentId: string, eventId: number }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (tournamentId) fetchBracket();
  }, [tournamentId]);

  const fetchBracket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/${tournamentId}/bracket`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.sort((a: Match, b: Match) => a.match_id - b.match_id));
      }
    } catch (error) {
      console.error("Не вдалося завантажити сітку");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (isReset = false) => {
    if (!confirm(isReset ? "Це видалить поточну сітку! Продовжити?" : "Створити сітку?")) return;
    setGenerating(true);
    try {
      await fetch('/api/tournaments/bracket/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, reset: isReset }),
      });
      fetchBracket();
    } catch(e) {
      alert("Помилка генерації");
    } finally {
      setGenerating(false);
    }
  };

  const handleScoreUpdate = async (match: Match, p1Score: string, p2Score: string) => {
    const s1 = parseInt(p1Score);
    const s2 = parseInt(p2Score);
    
    if (isNaN(s1) || isNaN(s2)) {
      alert("Будь ласка, введіть коректний рахунок (числа)");
      return;
    }

    let winnerId = null;
    if (s1 > s2) winnerId = match.p1_team_id;
    else if (s2 > s1) winnerId = match.p2_team_id;

    if (!winnerId) {
      alert("Помилка: неможливо визначити ID переможця");
      return;
    }
    
    try {
      const res = await fetch('/api/matches/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.match_id,
          sets: [{ set_number: 1, p1_score: s1, p2_score: s2 }],
          winnerTeamId: winnerId,
        })
      });
      
      if (res.ok) {
        fetchBracket();
      } else {
        alert("Помилка збереження");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderPlayerName = (name: string | null, partner: string | null | undefined) => {
    if (!name) return '/';
    if (partner) return `${name} / ${partner}`;
    return name;
  };

  if (loading) {
    return (
      <div className="text-center py-12 border rounded-xl bg-gray-50">
        <p className="text-gray-500 animate-pulse">Завантаження турнірної сітки...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl bg-gray-50">
        <p className="text-gray-500 mb-4">Сітку ще не згенеровано.</p>
        <Button onClick={() => handleGenerate(false)} disabled={generating}>
          {generating ? 'Створення...' : 'Згенерувати Сітку'}
        </Button>
      </div>
    );
  }

  const rounds = groupMatchesByRound(matches);
  const round1Matches = rounds[0]?.length || 0;
  const containerHeight = Math.max(600, round1Matches * 200); 

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-4">
        <Button
          size="sm"
          onClick={() => handleGenerate(true)}
          disabled={generating}
        >
          {generating ? 'Обробка...' : 'Згенерувати сітку знову'}
        </Button>
      </div>
      
      <div className="overflow-x-auto pb-4 pt-12">
        <div className="flex gap-16 min-w-max px-4 justify-center" style={{ height: `${containerHeight}px` }}>
          {rounds.map((roundMatches, roundIdx) => (
            <div 
              key={roundIdx}
              className="flex flex-col justify-around w-64 relative"
            >
              <div className="absolute -top-10 left-0 w-full text-center font-bold text-gray-900 text-lg border-b pb-2 mb-4">
                {getRoundName(roundIdx, rounds.length)}
              </div>
              
              {roundMatches.map((m) => (
                <Card 
                  key={m.match_id} 
                  className={`relative border p-3 shadow-sm 
                    ${m.winner_team_id ? 'border-2 border-gray-500' : 'border border-gray-100'} 
                    ${m.status === 'cancelled' ? 'invisible pointer-events-none' : ''}
                  `}
                >
                  <CardContent className="p-2 text-sm space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <span 
                        className={`truncate w-32 ${m.winner_team_id && m.winner_team_id === m.p1_team_id ? 'font-bold' : 'text-gray-900'}`} 
                        title={renderPlayerName(m.p1_name, m.p1_partner_name)}
                      >
                        {renderPlayerName(m.p1_name, m.p1_partner_name)}
                      </span>
                      <Input 
                        className="w-10 h-7 text-center p-0" 
                        placeholder="_" 
                        key={`p1-${m.match_id}-${m.sets?.[0]?.p1_score}`}
                        defaultValue={m.sets?.[0]?.p1_score}
                        id={`s-${m.match_id}-p1`} 
                      />
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <span 
                        className={`truncate w-32 ${m.winner_team_id && m.winner_team_id === m.p2_team_id ? 'font-bold text-green-950' : 'text-gray-900'}`} 
                        title={renderPlayerName(m.p2_name, m.p2_partner_name)}
                      >
                        {renderPlayerName(m.p2_name, m.p2_partner_name)}
                      </span>
                      <Input 
                        className="w-10 h-7 text-center p-0" 
                        placeholder="_" 
                        key={`p2-${m.match_id}-${m.sets?.[0]?.p2_score}`}
                        defaultValue={m.sets?.[0]?.p2_score}
                        id={`s-${m.match_id}-p2`} 
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button 
                        size="sm" 
                        className="h-7 text-xs px-4" 
                        onClick={() => {
                          const p1 = (document.getElementById(`s-${m.match_id}-p1`) as HTMLInputElement).value;
                          const p2 = (document.getElementById(`s-${m.match_id}-p2`) as HTMLInputElement).value;
                          handleScoreUpdate(m, p1, p2);
                        }}
                      >
                        Зберегти
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
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
      <div className="max-w-5xl mx-auto space-y-6">
        
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
