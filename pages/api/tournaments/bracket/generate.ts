import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Метод не дозволено' });

  const { eventId, reset } = req.body;
  if (!eventId) return res.status(400).json({ message: 'ID події є обовязковим' });

  try {

    
    const [existing]: any = await db.execute('SELECT id FROM matches WHERE tournament_event_id = ?', [eventId]);
    if (existing.length > 0) return res.status(400).json({ message: 'Сітку вже створено' });

    const [rows]: any = await db.execute(
      'SELECT user_id FROM tournament_participants WHERE tournament_event_id = ?',
      [eventId]
    );
    const participants = [...rows];

    const [eventData]: any = await db.execute('SELECT category FROM tournament_events WHERE id = ?', [eventId]);
    const category = eventData[0]?.category || '';
    
    const isDoubles = ['MD', 'WD', 'XD', 'DOUBLES', 'MIXED'].includes(category.toUpperCase());

    const minParticipants = isDoubles ? 4 : 2; 
    if (participants.length < minParticipants) {
      return res.status(400).json({ message: `Необхідно мінімум ${minParticipants} учасників` });
    }

    const teamIds: number[] = [];

    if (isDoubles) {
      for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
      }

      for (let i = 0; i < participants.length; i += 2) {
        const p1 = participants[i];
        const p2 = participants[i + 1];

        if (!p2) continue;

        const [res]: any = await db.execute(
          'INSERT INTO teams (tournament_event_id, player1_id, player2_id, created_at) VALUES (?, ?, ?, NOW())',
          [eventId, p1.user_id, p2.user_id]
        );
        teamIds.push(res.insertId);
      }
    } else {
      for (const p of participants) {
        const [res]: any = await db.execute(
          'INSERT INTO teams (tournament_event_id, player1_id, created_at) VALUES (?, ?, NOW())',
          [eventId, p.user_id]
        );
        teamIds.push(res.insertId);
      }
    }

    for (let i = teamIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
    }

    let powerOfTwo = 2;
    while (powerOfTwo < teamIds.length) powerOfTwo *= 2;
    
    const totalSlots = powerOfTwo; 
    const totalMatches = powerOfTwo - 1; 

    const slots = new Array(totalSlots).fill(null);
    let currentTeamIdx = 0;

    for (let i = 0; i < totalSlots; i += 2) {
      if (currentTeamIdx < teamIds.length) {
        slots[i] = teamIds[currentTeamIdx++];
      }
    }

    for (let i = 1; i < totalSlots; i += 2) {
      if (currentTeamIdx < teamIds.length) {
        slots[i] = teamIds[currentTeamIdx++];
      }
    }

    const matchIds: number[] = [];

    for (let i = 0; i < totalMatches; i++) {
      const [m]: any = await db.execute(
        `INSERT INTO matches (tournament_event_id, match_date, match_level, status, created_by_user_id, created_at) 
         VALUES (?, NOW(), 'regular', 'scheduled', 1, NOW())`,
        [eventId]
      );
      matchIds.push(m.insertId);
    }

    const round1Matches = totalSlots / 2;
    const round2StartIndex = round1Matches; 

    for (let i = 0; i < round1Matches; i++) {
      const matchId = matchIds[i];
      const p1 = slots[i * 2];
      const p2 = slots[i * 2 + 1];

      if (p1) await db.execute('INSERT INTO match_participants (match_id, team_id, participant_slot) VALUES (?, ?, "p1")', [matchId, p1]);
      if (p2) await db.execute('INSERT INTO match_participants (match_id, team_id, participant_slot) VALUES (?, ?, "p2")', [matchId, p2]);

      const isBye = (p1 && !p2) || (!p1 && p2);
      
      if (isBye) {
        const winnerId = p1 || p2;
        await db.execute('UPDATE matches SET status = ?, winner_team_id = ? WHERE id = ?', ['completed', winnerId, matchId]);

        const parentIndex = round2StartIndex + Math.floor(i / 2);
        if (matchIds[parentIndex]) {
          const parentMatchId = matchIds[parentIndex];
          const targetSlot = i % 2 === 0 ? 'p1' : 'p2';
          await db.execute(`INSERT INTO match_participants (match_id, team_id, participant_slot) VALUES (?, ?, ?)`, [parentMatchId, winnerId, targetSlot]);
        }
      }
      
      if (!p1 && !p2) {
         await db.execute('UPDATE matches SET status = ? WHERE id = ?', ['cancelled', matchId]);
      }
    }

    res.status(200).json({ message: 'Сітку успішно згенеровано', matchIds });

  } catch (error: any) {
    console.error("Помилка генерування:", error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}