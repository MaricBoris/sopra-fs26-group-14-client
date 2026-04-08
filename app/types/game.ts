import {Writer} from "@/types/writer";
import {Judge} from "@/types/judge";
import {Story} from "@/types/story";
export interface Game {
  id: number;
  timer: number | null
  writers: Writer | null;
  judges: Judge | null;
  story: Story | null;
}
