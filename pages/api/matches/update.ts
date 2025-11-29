import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ message: 'Метод не довзолено' });

  const { matchId, sets, winnerTeamId } = req.body;

  if (!matchId || !sets) {
    return res.status(400).json({ message: 'Відсутній ID матчу/сету' });
  }

  try {
    await db.execute('DELETE FROM match_sets WHERE match_id = ?', [matchId]);
    
    for (const s of sets) {
      const wSlot = s.p1_score > s.p2_score ? 'p1' : 'p2';
      await db.execute(
        'INSERT INTO match_sets (match_id, set_number, p1_score, p2_score, winner_slot) VALUES (?, ?, ?, ?, ?)',
        [matchId, s.set_number, s.p1_score, s.p2_score, wSlot]
      );
    }

    const status = winnerTeamId ? 'completed' : 'ongoing';
    await db.execute(
      'UPDATE matches SET status = ?, winner_team_id = ? WHERE id = ?',
      [status, winnerTeamId, matchId]
    );

    if (winnerTeamId) {
      const [currentMatch]: any = await db.execute('SELECT tournament_event_id FROM matches WHERE id = ?', [matchId]);
      if (currentMatch.length === 0) return res.status(404).json({ message: 'Матч не знайдено' });
      
      const eventId = currentMatch[0].tournament_event_id;

      const [allMatches]: any = await db.execute(
        'SELECT id FROM matches WHERE tournament_event_id = ? ORDER BY id ASC', 
        [eventId]
      );
      
      const myIndex = allMatches.findIndex((m: any) => m.id === matchId);
      const totalMatches = allMatches.length;
      const totalSlots = totalMatches + 1;

      let roundCapacity = totalSlots / 2;
      let roundStartIndex = 0;

      while (myIndex >= roundStartIndex + roundCapacity) {
        roundStartIndex += roundCapacity;
        roundCapacity /= 2;
      }

      if (roundCapacity > 1) {
        const offsetInRound = myIndex - roundStartIndex;
        
        const parentIndex = (roundStartIndex + roundCapacity) + Math.floor(offsetInRound / 2);
        
        if (allMatches[parentIndex]) {
          const parentMatchId = allMatches[parentIndex].id;
          
          const targetSlot = offsetInRound % 2 === 0 ? 'p1' : 'p2';

          console.log(`Advancing Winner (Team ${winnerTeamId}) from Match ${matchId} to Match ${parentMatchId} (Slot ${targetSlot})`);

          await db.execute(
            `INSERT INTO match_participants (match_id, team_id, participant_slot) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE team_id = ?`,
            [parentMatchId, winnerTeamId, targetSlot, winnerTeamId]
          );
        }
      }
    }

    res.status(200).json({ message: 'Рахунок оновлено та переможця посунуто' });

  } catch (error: any) {
    console.error("Помилка оновлення:", error);
    res.status(500).json({ message: 'Помилка сервера при оновленні матчу' });
  }
}