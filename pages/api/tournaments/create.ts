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
    description,
    location,
    start_date,
    end_date,
    events
  } = req.body;

  if (!userId || !name || !start_date || !end_date || !events || events.length === 0) {
    return res.status(400).json({ message: 'Обов\'язкові поля не заповнено' });
  }

  try {
    const [result]: any = await db.execute(
      `INSERT INTO tournaments 
      (name, description, location, start_date, end_date, status, created_by_user_id, created_at) 
      VALUES (?, ?, ?, ?, ?, 'upcoming', ?, NOW())`,
      [
        name,
        description || null,
        location, 
        start_date, 
        end_date,
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
    MS: 'Одиночний (чоловіки)',
    WS: 'Одиночний (жінки)',
    MD: 'Парний (чоловіки)',
    WD: 'Парний (жінки)',
    XD: 'Змішаний парний'
  };
  return map[code] || code;
}