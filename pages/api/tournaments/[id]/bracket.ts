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
        m.id as match_id,
        m.match_level,
        m.status,
        m.winner_team_id,
        
        -- Get Match Sets
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('set_number', ms.set_number, 'p1_score', ms.p1_score, 'p2_score', ms.p2_score)) 
         FROM match_sets ms WHERE ms.match_id = m.id) as sets,

        -- Team 1 Info
        t1.id as p1_team_id,
        u1.last_name as p1_name,
        u1_partner.last_name as p1_partner_name,
        
        -- Team 2 Info
        t2.id as p2_team_id,
        u2.last_name as p2_name,
        u2_partner.last_name as p2_partner_name

      FROM matches m
      JOIN tournament_events te ON m.tournament_event_id = te.id
      
      -- Join Team 1
      LEFT JOIN match_participants mp1 ON m.id = mp1.match_id AND mp1.participant_slot = 'p1'
      LEFT JOIN teams t1 ON mp1.team_id = t1.id
      LEFT JOIN users u1 ON t1.player1_id = u1.id
      LEFT JOIN users u1_partner ON t1.player2_id = u1_partner.id 

      -- Join Team 2
      LEFT JOIN match_participants mp2 ON m.id = mp2.match_id AND mp2.participant_slot = 'p2'
      LEFT JOIN teams t2 ON mp2.team_id = t2.id
      LEFT JOIN users u2 ON t2.player1_id = u2.id
      LEFT JOIN users u2_partner ON t2.player2_id = u2_partner.id

      WHERE te.tournament_id = ?
      ORDER BY m.id ASC
    `, [id]);

    res.status(200).json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}