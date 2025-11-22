import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const EVENT_TYPES = [
  { id: 'MS', label: 'Одиночний (чоловіки)' },
  { id: 'WS', label: 'Одиночний (жінки)' },
  { id: 'MD', label: 'Парний (чоловіки)' },
  { id: 'WD', label: 'Парний (жінки)' },
  { id: 'XD', label: 'Змішаний парний' },
];

export default function CreateTournamentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    points_to_win: 21,
    max_sets: 3,
  });
  
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.roles.includes('organizer')) {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId) 
        : [...prev, eventId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch('/api/tournaments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          events: selectedEvents
        }),
      });

      if (!res.ok) throw new Error('Failed to create');
      router.push('/admin/dashboard');

    } catch (error) {
      alert('Помилка при створенні турніру');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 pb-20">
      <div className="max-w-3xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Створення нового турніру
          </h1>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Назва</Label>
                  <Input 
                    id="name" 
                    name="name"
                    placeholder="напр. Університетська Ліга 2025"
                    required 
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Опис</Label>
                  <textarea 
                    id="description" 
                    name="description" 
                    placeholder="Додайте короткий опис події, регламент або іншу інформацію"
                    className="flex min-h-20 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Місце проведення</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    placeholder="м. Львів, Спорткомплекс ЛНУ (вул. Черемшини, 31)" 
                    required 
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Дата початку</Label>
                    <Input 
                      type="date" 
                      id="start_date" 
                      name="start_date"
                      lang="uk"
                      required 
                      value={formData.start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Дата завершення</Label>
                    <Input 
                      type="date" 
                      id="end_date" 
                      name="end_date"
                      lang="uk"
                      required 
                      value={formData.end_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Кількість очок в одному сеті</Label>
                  <Input 
                    type="number" 
                    name="points_to_win" 
                    value={formData.points_to_win}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Кількість сетів у матчі</Label>
                  <Input 
                    type="number" 
                    name="max_sets" 
                    value={formData.max_sets}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Розряд</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EVENT_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50 transition-colors">
                      <Checkbox 
                        id={type.id} 
                        checked={selectedEvents.includes(type.id)}
                        onCheckedChange={() => toggleEvent(type.id)}
                      />
                      <Label htmlFor={type.id} className="cursor-pointer font-normal w-full select-none">
                        {type.label}
                      </Label>
                    </div>
                    
                  ))}
                  {selectedEvents.length === 0 && (
                  <p className="text-sm text-red-500 ml-2">Оберіть мінімум один розряд</p>
                )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-gray-100 mt-6">
                <Button 
                  type="button" 
                  size="sm"
                  onClick={() => router.back()}
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={loading || selectedEvents.length === 0}
                >
                  {loading ? 'Створення...' : 'Створити турнір'}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}