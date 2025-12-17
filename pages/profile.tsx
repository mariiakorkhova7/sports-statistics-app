import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from '@/components/Footer';
import { UserProfile } from '@/lib/types';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: 0,
    sex: 'male',
    skill_level: 'beginner',
    playing_hand: 'right'
  });

  const getAgeLabel = (age: number) => {
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'років';
    }

    if (lastDigit === 1) {
      return 'рік';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'роки';
    }

    return 'років';
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id]);

  const fetchProfile = async (userId: number) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data);
      
      setFormData({
        first_name: data.first_name,
        last_name: data.last_name,
        age: data.age,
        sex: data.sex,
        skill_level: data.skill_level,
        playing_hand: data.playing_hand
      });
    } catch (err) {
      console.error(err);
      setError('Не вдалося завантажити дані профілю');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Update failed');
      await fetchProfile(profile.id);
      setIsEditing(false);
    } catch (err) {
      alert('Помилка при збереженні даних');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-xl text-gray-500">Завантаження...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col gap-8">
      <div className="flex-1 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {profile.first_name} {profile.last_name}
            </h1>
            <p className="text-l text-gray-500 mt-1">
              Мій профіль
            </p>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Скасувати
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Збереження...' : 'Зберегти зміни'}
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm">
                  <Link href="/#tournaments">
                    Знайти турніри
                  </Link>
                </Button>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                Редагувати профіль
              </Button>
              </>
            )}
          </div>
        </div>

        {error && <div className="p-4 text-red-600 bg-red-50 rounded-md">{error}</div>}

        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Статистика</h3>
           {profile.stats.matches_played === 0 && profile.stats.tournaments_played === 0 ? (
            <Card className="bg-gray-50 border">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-gray-500 mb-4">Ви ще не зіграли жодного матчу.</p>
                <Button asChild>
                  <Link href="/#tournaments">
                    Зареєструватися на турнір
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Турніри</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-gray-900">{profile.stats.tournaments_played}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Матчі</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-gray-900">{profile.stats.matches_played}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Перемоги</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{profile.stats.matches_won}</div>
                <p className="text-xs text-gray-500">{profile.stats.matches_lost} Поразок</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Відсоток перемог</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-gray-900">{profile.stats.win_rate}%</div></CardContent>
            </Card>
          </div>
          )}
        </div>

        {profile.my_tournaments && profile.my_tournaments.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Мої турніри</h3>
            <div className="space-y-3">
              {profile.my_tournaments.map((t) => (
                <Card key={t.id} className="hover:shadow-sm transition-shadow p-3">
                  <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-gray-900">{t.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          t.status === 'upcoming' ? 'bg-gray-100 text-gray-900' :
                          t.status === 'ongoing' ? 'bg-gray-100 text-gray-900' :
                          'bg-gray-100 text-gray-900'
                        }`}>
                          {t.status === 'upcoming' ? 'Заплановано' :
                           t.status === 'ongoing' ? 'В процесі' :
                           t.status === 'completed' ? 'Завершено' : 'Скасовано'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex gap-3">
                        <span>{new Date(t.start_date).toLocaleDateString('uk-UA')}</span>
                        <span>|</span>
                        <span>{t.location}</span>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/tournaments/${t.id}/register`}>
                        Детальніше
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xl font-bold text-gray-900 mb-4">Особиста інформація</h4>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Ім'я</p>
                  {isEditing ? (
                    <Input name="first_name" value={formData.first_name} onChange={handleInputChange} />
                  ) : (
                    <p className="text-lg font-medium text-gray-900">{profile.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Прізвище</p>
                  {isEditing ? (
                    <Input name="last_name" value={formData.last_name} onChange={handleInputChange} />
                  ) : (
                    <p className="text-lg font-medium text-gray-900">{profile.last_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Вік</p>
                  {isEditing ? (
                    <Input type="number" name="age" value={formData.age} onChange={handleInputChange} />
                  ) : (
                    <p className="text-lg font-medium text-gray-900">
                      {profile.age} {getAgeLabel(profile.age)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Стать</p>
                  {isEditing ? (
                    <select name="sex" value={formData.sex} onChange={handleInputChange} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="male">Чоловіча</option>
                      <option value="female">Жіноча</option>
                    </select>
                  ) : (
                    <p className="text-lg font-medium text-gray-900">{profile.sex === 'male' ? 'Чоловіча' : 'Жіноча'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Рівень навичок</p>
                  {isEditing ? (
                    <select name="skill_level" value={formData.skill_level} onChange={handleInputChange} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <option value="beginner">Початківець</option>
                        <option value="intermediate">Середній</option>
                        <option value="advanced">Вище середнього</option>
                        <option value="professional">Професіонал</option>
                      </select>
                  ) : (
                    <p className="text-lg font-medium text-gray-900">
                      {profile.skill_level === 'beginner' ? 'Початківець' : 
                      profile.skill_level === 'intermediate' ? 'Середній' :
                      profile.skill_level === 'advanced' ? 'Вище середнього' : 'Професіонал'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Домінантна рука</p>
                  {isEditing ? (
                    <select name="playing_hand" value={formData.playing_hand} onChange={handleInputChange} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        <option value="right">Права</option>
                        <option value="left">Ліва</option>
                      </select>
                  ) : (
                    <p className="text-lg font-medium text-gray-900">{profile.playing_hand === 'right' ? 'Права' : 'Ліва'}</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg font-medium text-gray-900">{profile.email}</p>
                  {isEditing && <p className="text-xs text-gray-400">Ел. пошту не можна змінити</p>}
                </div>

                <div className="md:col-span-2 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-500 mb-1">Дата реєстрації</p>
                  <p className="text-lg text-gray-900">
                    {profile.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('uk-UA', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })
                      : 'Невідомо'
                    }
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

      </div>
      </div>

      <Footer />
    </div>
  );
}