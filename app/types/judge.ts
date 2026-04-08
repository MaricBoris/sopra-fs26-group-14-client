import {User} from "@/types/user"
export interface Judge extends User {
  injections: string | null;
}