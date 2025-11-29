import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не дозволено' });
  }

  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ message: 'ID користувача і ID події є обов\'язковими' });
  }

  try {
    const [eventExists]: any = await db.execute('SELECT id FROM tournament_events WHERE id = ?', [eventId]);
    
    if (eventExists.length === 0) {
      return res.status(404).json({ message: 'Турнір не знайдено' });
    }

    const [existing]: any = await db.execute(
      'SELECT * FROM tournament_participants WHERE user_id = ? AND tournament_event_id = ?',
      [userId, eventId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Вже зареєстровано на цю подію' });
    }

    await db.execute(
      'INSERT INTO tournament_participants (user_id, tournament_event_id, registration_date) VALUES (?, ?, NOW())',
      [userId, eventId]
    );

    res.status(201).json({ message: 'Успішно зареєстровано' });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
}