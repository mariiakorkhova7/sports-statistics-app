import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Вхід успішний');
        
        login(data.user);

        const userRoles = data.user.roles; 

        setTimeout(() => {
          if (userRoles.includes('organizer')) {
            router.push('/admin/dashboard'); 
          } else if (userRoles.includes('player')) {
            router.push('/profile');
          } else {
            router.push('/');
          }
        }, 1000);

      } else {
        setError(`Помилка: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setError('Помилка з’єднання з сервером');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-gray-900">
        
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Вхід
        </h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email" className="text-gray-900">Ел. пошта:</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password" className="text-gray-900">Пароль:</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full mt-2">
            Увійти
          </Button>
        </form>

        {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}

        <p className="text-sm text-center text-gray-600 mt-6">
          Немає акаунту?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}