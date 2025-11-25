import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'ID користувача обов’язкове' });
  }
if (req.method === 'GET') {
    try {
      const userPromise = db.execute(
        'SELECT id, first_name, last_name, email, age, sex, skill_level, playing_hand, created_at FROM users WHERE id = ?',
        [id]
      );

      const tourneyListPromise = db.execute(`
        SELECT DISTINCT t.id, t.name, t.start_date, t.location, t.status
        FROM tournaments t
        JOIN tournament_events te ON t.id = te.tournament_id
        JOIN tournament_participants tp ON te.id = tp.tournament_event_id
        WHERE tp.user_id = ?
        ORDER BY t.start_date DESC
      `, [id]);

      const statsPromise = db.execute(`
        SELECT 
          COUNT(DISTINCT m.id) as matches_played,
          SUM(CASE 
            WHEN t_winner.player1_id = ? OR t_winner.player2_id = ? THEN 1 
            ELSE 0 
          END) as matches_won
        FROM matches m
        JOIN match_participants mp ON m.id = mp.match_id
        JOIN teams t_part ON mp.team_id = t_part.id
        LEFT JOIN teams t_winner ON m.winner_team_id = t_winner.id
        WHERE (t_part.player1_id = ? OR t_part.player2_id = ?)
        AND m.status = 'completed'
      `, [id, id, id, id]);

      const [[userRows], [tourneyRows], [statsRows]]: any = await Promise.all([
        userPromise, 
        tourneyListPromise, 
        statsPromise
      ]);

      if (userRows.length === 0) {
        return res.status(404).json({ message: 'Користувача не знайдено' });
      }

      const user = userRows[0];
      const tournamentsCount = tourneyRows.length; 
      const matchesPlayed = parseInt(statsRows[0].matches_played) || 0;
      const matchesWon = parseInt(statsRows[0].matches_won) || 0;

      res.status(200).json({
        ...user,
        my_tournaments: tourneyRows, 
        stats: {
          tournaments_played: tournamentsCount,
          matches_played: matchesPlayed,
          matches_won: matchesWon,
          matches_lost: matchesPlayed - matchesWon,
          win_rate: matchesPlayed > 0 ? ((matchesWon / matchesPlayed) * 100).toFixed(1) : 0
        }
      });

    } catch (error: any) {
      console.error("API Error:", error);
      res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
  }
  
  else if (req.method === 'PUT') {
    try {
      const { first_name, last_name, age, sex, skill_level, playing_hand } = req.body;

      if (!first_name || !last_name || !age || !sex || !skill_level || !playing_hand) {
        return res.status(400).json({ message: 'Всі поля обов’язкові' });
      }

      await db.execute(
        `UPDATE users 
         SET first_name=?, last_name=?, age=?, sex=?, skill_level=?, playing_hand=? 
         WHERE id=?`,
        [first_name, last_name, age, sex, skill_level, playing_hand, id]
      );

      res.status(200).json({ message: 'Профіль оновлено успішно' });

    } catch (error: any) {
      console.error("Update Error:", error);
      res.status(500).json({ message: 'Помилка сервера', error: error.message });
    }
  } 
  
  else {
    res.status(405).json({ message: 'Метод не дозволено' });
  }
}