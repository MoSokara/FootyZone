export type League = {
  id: number;
  name: string;
  country: string;
};

export type Team = {
  id: number;
  name: string;
  logo: string;
  leagueId: number;
  league: string;
  country: string;
  rank: number | null;
  points: number | null;
  form: string | null;
  goalsDiff: number | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  strength: number;
};

export type FootballApiResponse = {
  results: number;
  response: Team[];
};

export const LEAGUES: League[] = [
  { id: 39, name: "Premier League", country: "England" },
  { id: 140, name: "La Liga", country: "Spain" },
  { id: 78, name: "Bundesliga", country: "Germany" },
  { id: 135, name: "Serie A", country: "Italy" },
  { id: 61, name: "Ligue 1", country: "France" },
];
