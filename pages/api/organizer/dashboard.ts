import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не дозволено' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'ID користувача є обов\'язковим' });
  }

  try {
    const statsPromise = db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcoming,
        SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM tournaments 
      WHERE created_by_user_id = ?
    `, [userId]);

    const tournamentsPromise = db.execute(`
      SELECT id, name, start_date, end_date, status, location 
      FROM tournaments 
      WHERE created_by_user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [userId]);

    const [[statsRows], [tournamentRows]]: any = await Promise.all([statsPromise, tournamentsPromise]);

    const stats = statsRows[0];

    res.status(200).json({
      stats: {
        total: stats.total || 0,
        upcoming: parseInt(stats.upcoming) || 0,
        ongoing: parseInt(stats.ongoing) || 0,
        completed: parseInt(stats.completed) || 0,
      },
      tournaments: tournamentRows
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
}