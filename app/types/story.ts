export interface Story {
  id: number;
  winnerUsername: string | null;
  loserUsername: string | null;
  hasWinner: boolean;
  storyContributions: StoryContribution[];
  winGenre: string | null;
  loseGenre: string | null;
  creationDate: string | null;
  objective: string | null;
  title: string | null;
}

export interface StoryContribution {
  id: number | null;
  userId: number;
  text: string;
}