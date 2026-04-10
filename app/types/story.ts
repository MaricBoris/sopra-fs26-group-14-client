import {User} from "@/types/user"
export interface Story {
  winner: User | null;
  loser: User | null;
  text: string ;
  wingenre: string | null;
  losegenre: string | null;
  judge: User | null;
}