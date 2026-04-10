import {Writer} from "@/types/writer";
import {Judge} from "@/types/judge";
import {Story} from "@/types/story";
export interface Game {
  id: number;
  timer: number;
  writers: Writer[];
  judges: Judge[];
  story: Story ;
}
