import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    age: '18',
  });
  
  const [sex, setSex] = useState('male');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [playingHand, setPlayingHand] = useState('right');
  const [isPlayer, setIsPlayer] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const roles = [];
    if (isPlayer) {
      roles.push('player');
    }
    if (isOrganizer) {
      roles.push('organizer');
    }

    if (roles.length === 0) {
      setError('Ви повинні обрати хоча б одну роль (Гравець/Організатор).');
      return;
    }

    const finalData = {
      ...formData,
      age: parseInt(formData.age),
      sex: sex,
      skill_level: skillLevel,
      playing_hand: playingHand,
      roles: roles,
    };

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(`Користувача створено. Перенаправлення...`);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      setError(`Помилка: ${data.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-gray-900">
        
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Реєстрація
        </h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email" className="text-gray-900">Ел. пошта:</Label>
            <Input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password" className="text-gray-900">Пароль:</Label>
            <Input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required minLength={8}/>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="first_name" className="text-gray-900">Ім'я:</Label>
            <Input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleChange} required maxLength={255}/>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="last_name" className="text-gray-900">Прізвище:</Label>
            <Input type="text" name="last_name" id="last_name" value={formData.last_name} onChange={handleChange} required maxLength={255}/>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="age" className="text-gray-900">Вік:</Label>
            <Input type="number" name="age" id="age" value={formData.age} onChange={handleChange} required min="1" />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label className="text-gray-900">Стать:</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger id="sex">
                <SelectValue placeholder="Оберіть стать" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Чоловіча</SelectItem>
                <SelectItem value="female">Жіноча</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label className="text-gray-900">Рівень гри:</Label>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger id="skill_level">
                <SelectValue placeholder="Оберіть рівень" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Початківець</SelectItem>
                <SelectItem value="intermediate">Середній</SelectItem>
                <SelectItem value="advanced">Вище середнього</SelectItem>
                <SelectItem value="professional">Професіонал</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label className="text-gray-900">Домінантна рука:</Label>
            <Select value={playingHand} onValueChange={setPlayingHand}>
              <SelectTrigger id="playing_hand">
                <SelectValue placeholder="Оберіть руку" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="right">Права</SelectItem>
                <SelectItem value="left">Ліва</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Label className="text-gray-900">Ви:</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPlayer"
                checked={isPlayer}
                onCheckedChange={(checked) => setIsPlayer(checked as boolean)}
              />
              <Label htmlFor="isPlayer" className="text-sm font-medium text-gray-900">Гравець</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isOrganizer"
                checked={isOrganizer}
                onCheckedChange={(checked) => setIsOrganizer(checked as boolean)}
              />
              <Label htmlFor="isOrganizer" className="text-sm font-medium text-gray-900">Організатор турнірів</Label>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2">
            Зареєструватися
          </Button>
        </form>

        {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
        
        <p className="text-sm text-center text-gray-600 mt-6">
          Вже маєте акаунт?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Увійти
          </Link>
        </p>

      </div>
    </div>
  );
}