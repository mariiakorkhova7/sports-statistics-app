import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

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

      const [counts]: any = await db.execute(`
        SELECT tournament_event_id, COUNT(*) as count 
        FROM tournament_participants 
        WHERE tournament_event_id IN (SELECT id FROM tournament_events WHERE tournament_id = ?)
        GROUP BY tournament_event_id
      `, [id]);

      const eventsWithCounts = events.map((event: any) => {
        const countRow = counts.find((c: any) => c.tournament_event_id === event.id);
        return { ...event, participant_count: countRow ? countRow.count : 0 };
      });

      res.status(200).json({ ...tournament, events: eventsWithCounts });

    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
  } 
  
  else if (req.method === 'PUT') {
    try {
      const { status } = req.body;
      
      if (status) {
        await db.execute(
          'UPDATE tournaments SET status = ?, updated_at = NOW() WHERE id = ?',
          [status, id]
        );
        return res.status(200).json({ message: 'Статус оновлено' });
      }
      
      res.status(400).json({ message: 'Немає що оновлювати' });

    } catch (error: any) {
      res.status(500).json({ message: 'Оновлення провалено', error: error.message });
    }
  } 
  
  else {
    res.status(405).json({ message: 'Метод не дозволено' });
  }
}