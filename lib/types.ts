export interface Tournament {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  events: Array<{
    id: number;
    category: string;
    name: string;
    participant_count: number;
  }>;
}

export interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  skill_level: string;
  event_name: string;
  sex: string;
}

export interface Match {
  match_id: number;
  match_level: string;
  status: string;
  p1_name: string | null;
  p1_partner_name?: string | null;
  p2_name: string | null;
  p2_partner_name?: string | null;
  p1_team_id: number | null;
  p2_team_id: number | null;
  sets: any;
  winner_team_id: number | null;
}

export interface DashboardData {
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

export interface TournamentSummary {
  id: number;
  name: string;
  start_date: string;
  location: string;
  status: 'upcoming' | 'ongoing';
  description: string;
}

export interface TournamentSmallSummary {
  id: number;
  name: string;
  start_date: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  age: number;
  sex: 'male' | 'female';
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  playing_hand: 'left' | 'right';
  created_at: string | null;
  my_tournaments?: TournamentSmallSummary[];
  stats: {
    tournaments_played: number;
    matches_played: number;
    matches_won: number;
    matches_lost: number;
    win_rate: string | number;
  };
}