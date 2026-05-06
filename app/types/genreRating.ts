export interface GenreRating {
  winnerUserId: number | null;
  winnerUsername: string | null;
  winnerGenre: string | null;
  winnerVotes: number;
 
  loserUserId: number | null;
  loserUsername: string | null;
  loserGenre: string | null;
  loserVotes: number;
 
  userVotedForId: number | null;
  canVote: boolean;
}
