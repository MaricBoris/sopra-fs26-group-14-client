
export interface Story {
  id: number;
  winnerUsername: string | null;
  loserUsername: string | null;
  hasWinner: boolean;
  storyText: string;
  winGenre: string | null;
  loseGenre: string | null;
  creationDate: string | null;
  objective: string | null;
}