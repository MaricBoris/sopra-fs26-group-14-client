import {User} from "@/types/user"
export interface Story {
  winner: User | null;
  loser: User | null;
  story: String |null;
  wingenre: String | null;
  losegenre: String | null;
  judge: User | null;
}