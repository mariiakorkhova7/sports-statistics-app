import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не довзолено' });
  }

  try {
    const [tournaments]: any = await db.execute(`
      SELECT id, name, start_date, location, status, description 
      FROM tournaments 
      WHERE status IN ('upcoming', 'ongoing') 
      ORDER BY start_date ASC
    `);

    res.status(200).json(tournaments);

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
}