import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import bcrypt from 'bcrypt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
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
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (email.length > 255) {
      return res.status(400).json({ message: 'Email must be less than 255 characters.' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    const [existingUser]: any = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
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

    res.status(201).json({ message: 'User registered successfully!', userId: newUserId });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}