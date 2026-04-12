import {Writer} from "@/types/writer";
import {Judge} from "@/types/judge";
import {Story} from "@/types/story";
export interface Game {
  gameId: number;
  timer: number;
  turnStartedAt: number;
  writers: Writer[];
  judges: Judge[];
  story: Story ;
}
