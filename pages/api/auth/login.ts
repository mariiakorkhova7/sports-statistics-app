import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';
import bcrypt from 'bcrypt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не дозволено' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Ел. пошта і пароль обов\'язкові' });
    }

    const [users]: any = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Невірні дані' });
    }

    const user = users[0];

    const passwordsMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordsMatch) {
      return res.status(401).json({ message: 'Невірні дані' });
    }

    const [roles]: any = await db.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [user.id]
    );
    
    const userRoles = roles.map((r: any) => r.role);

    res.status(200).json({
      message: 'Логін успішний',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: userRoles,
      },
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
}