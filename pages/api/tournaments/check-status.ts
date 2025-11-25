import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, tournamentId } = req.query;

  if (!userId || !tournamentId) {
    return res.status(400).json({ message: 'Відсутні параметри' });
  }

  try {
    const [rows]: any = await db.execute(
      `SELECT tp.tournament_event_id 
       FROM tournament_participants tp
       JOIN tournament_events te ON tp.tournament_event_id = te.id
       WHERE tp.user_id = ? AND te.tournament_id = ?`,
      [userId, tournamentId]
    );

    const joinedIds = rows.map((row: any) => row.tournament_event_id);

    res.status(200).json(joinedIds);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}