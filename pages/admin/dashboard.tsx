import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardData {
  stats: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  };
  tournaments: Array<{
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    location: string;
  }>;
}

export default function OrganizerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!user.roles.includes('organizer')) {
        router.push('/'); 
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData(user.id);
    }
  }, [user]);

  const fetchDashboardData = async (userId: number) => {
    try {
      const res = await fetch(`/api/organizer/dashboard?userId=${userId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800 animate-pulse',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    const labels: Record<string, string> = {
      upcoming: 'Планується',
      ongoing: 'Триває',
      completed: 'Завершено',
      cancelled: 'Скасовано',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-xl text-gray-500">Завантаження панелі...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Панель керування</h1>
            <p className="text-l text-gray-500 mt-1">Прогрес створених турнірів</p>
          </div>
          
          <Link href="/admin/tournaments/create">
            <Button className="shadow-md" size="sm">
              + Створити Турнір
            </Button>
          </Link>
        </div>
        <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Статус</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="h-full min-h-[157.91px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Всього турнірів</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data?.stats.total || 0}</div>
            </CardContent>
          </Card>

          <Card className="h-full min-h-[157.91px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">В процесі</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data?.stats.ongoing || 0}</div>
            </CardContent>
          </Card>

          <Card className="h-full min-h-[157.91px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Заплановано</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data?.stats.upcoming || 0}</div>
            </CardContent>
          </Card>

          <Card className="h-full min-h-[157.91px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Завершено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data?.stats.completed || 0}</div>
            </CardContent>
          </Card>
        </div>
        </div>
        <div>
        <h3 className="text-l font-bold text-gray-800 mb-4">Створені турніри</h3>
        <Card>
          <CardContent>
            {(!data?.tournaments || data.tournaments.length === 0) ? (
              <div className="text-center py-10 text-gray-500">
                <p>У вас ще немає створених турнірів.</p>
                <Link href="/admin/tournaments/create" className="text-blue-600 hover:underline mt-2 inline-block">
                  Створіть свій перший турнір
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="pb-3 font-medium">Назва турніру</th>
                      <th className="pb-3 font-medium">Статус</th>
                      <th className="pb-3 font-medium">Дата початку</th>
                      <th className="pb-3 font-medium">Локація</th>
                      <th className="pb-3 font-medium text-right">...</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.tournaments.map((t) => (
                      <tr key={t.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 font-medium text-gray-900">{t.name}</td>
                        <td className="py-4">{getStatusBadge(t.status)}</td>
                        <td className="py-4 text-gray-600">
                          {new Date(t.start_date).toLocaleDateString('uk-UA')}
                        </td>
                        <td className="py-4 text-gray-600">{t.location || '—'}</td>
                        <td className="py-4 text-right">
                          <Link href={`/admin/tournaments/${t.id}`}>
                            <Button variant="ghost" size="sm">
                              Деталі
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

      </div>
    </div>
  );
}