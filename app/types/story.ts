import {User} from "@/types/user"
export interface Story {
  winner: User | null;
  loser: User | null;
  storyText: string ;
  wingenre: string | null;
  losegenre: string | null;
  judge: User | null;
}