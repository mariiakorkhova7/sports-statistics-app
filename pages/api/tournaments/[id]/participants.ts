import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не дозволено' });
  }

  try {
    const [rows]: any = await db.execute(`
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.skill_level, 
        u.sex,
        te.name as event_name
      FROM tournament_participants tp
      JOIN users u ON tp.user_id = u.id
      JOIN tournament_events te ON tp.tournament_event_id = te.id
      WHERE te.tournament_id = ?
      ORDER BY te.name, u.last_name
    `, [id]);

    res.status(200).json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}