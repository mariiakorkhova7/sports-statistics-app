import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Match } from '@/lib/types';

interface BracketViewProps {
  tournamentId: string;
  eventId: number;
}

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

const BracketView = ({ tournamentId, eventId }: BracketViewProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  useEffect(() => {
    if (tournamentId) {
      fetchBracket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const handleGenerate = async (isReset = false) => {
    if (!confirm(isReset ? "Це видалить поточну сітку! Продовжити?" : "Створити сітку?")) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/tournaments/bracket/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, reset: isReset }),
      });
      
      if (res.ok) {
        await fetchBracket();
      } else {
        alert("Помилка генерації");
      }
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

export default BracketView;