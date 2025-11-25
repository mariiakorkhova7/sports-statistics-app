import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID турніра є обов\'язковим' });
  }

  if (req.method === 'GET') {
    try {
      const [rows]: any = await db.execute(
        'SELECT * FROM tournaments WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Турнір не знайдено' });
      }
      const tournament = rows[0];

      const [events]: any = await db.execute(
        'SELECT * FROM tournament_events WHERE tournament_id = ?',
        [id]
      );

      res.status(200).json({ ...tournament, events });

    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Метод не дозволено' });
  }
}