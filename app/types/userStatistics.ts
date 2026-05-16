export interface UserStatistics {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  currentWinStreak: number;
  highestWinStreak: number;
  winsAsWriter: number;
  winsAsJudge: number;
  totalVotesCast: number;
  winsByGenre: Record<string, number>;
  suddenDeathEntries: number;
  suddenDeathWins: number;
  unanimousWins: number;
  totalWordsWritten: number;
}