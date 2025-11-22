import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не дозволено' });
  }

  const {
    userId,
    name,
    location,
    start_date,
    end_date,
    points_to_win,
    max_sets,
    events
  } = req.body;

  if (!userId || !name || !start_date || !end_date || !events || events.length === 0) {
    return res.status(400).json({ message: 'Обов\'язкові поля не заповнено' });
  }

  try {
    const [result]: any = await db.execute(
      `INSERT INTO tournaments 
      (name, location, start_date, end_date, points_to_win, max_sets, win_by_two, max_points, status, created_by_user_id, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, NOW())`,
      [
        name, 
        location, 
        start_date, 
        end_date, 
        points_to_win || 21, 
        max_sets || 3, 
        1,
        30,
        userId
      ]
    );

    const tournamentId = result.insertId;

    for (const category of events) {
      await db.execute(
        `INSERT INTO tournament_events (tournament_id, category, name) VALUES (?, ?, ?)`,
        [tournamentId, category, getCategoryName(category)]
      );
    }

    res.status(201).json({ message: 'Турнір створено', tournamentId });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
}

function getCategoryName(code: string) {
  const map: Record<string, string> = {
    MS: 'Men\'s Singles',
    WS: 'Women\'s Singles',
    MD: 'Men\'s Doubles',
    WD: 'Women\'s Doubles',
    XD: 'Mixed Doubles'
  };
  return map[code] || code;
}