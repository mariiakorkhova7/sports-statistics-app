import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import bcrypt from 'bcrypt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не дозволено' });
  }

  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      age, 
      sex, 
      skill_level, 
      playing_hand,
      roles 
    } = req.body;

    if (!email || !password || !first_name || !last_name || !age || !sex || !skill_level || !playing_hand || !roles || roles.length === 0) {
      return res.status(400).json({ message: 'Всі поля є обов\'язковими' });
    }
    
    if (email.length > 255) {
      return res.status(400).json({ message: 'Ел. пошта має бути коротшою за 255 символів.' });
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Неправильний формат ел. пошти.' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ message: 'Пароль має бути не менше 8 символів.' });
    }
    
    if (password.length > 72) {
      return res.status(400).json({ message: 'Пароль має бути не більше 72 символів.' });
    }

    if (first_name.trim().length === 0) {
      return res.status(400).json({ message: 'Ім\'я не може бути порожнім.' });
    }
    if (last_name.trim().length === 0) {
        return res.status(400).json({ message: 'Прізвище не може бути порожнім.' });
    }
    
    if (first_name.length > 255) {
      return res.status(400).json({ message: 'Ім\'я занадто довге (максимум - 255 символів).' });
    }
    if (last_name.length > 255) {
      return res.status(400).json({ message: 'Прізвище занадто довге (максимум - 255 символів).' });
    }

    const [existingUser]: any = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Ця ел. пошта вже використовується' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result]: any = await db.execute(
      `INSERT INTO users (email, password_hash, first_name, last_name, age, sex, skill_level, playing_hand, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, first_name, last_name, age, sex, skill_level, playing_hand, new Date()]
    );
    
    const newUserId = result.insertId;

    for (const role of roles) {
      await db.execute(
        'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
        [newUserId, role]
      );
    }

    res.status(201).json({ message: 'Користувача створено', userId: newUserId });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
}