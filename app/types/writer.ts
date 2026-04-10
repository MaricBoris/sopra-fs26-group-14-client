import {User} from "@/types/user"
export interface Writer extends User{
    turn: Boolean;
    genre: string | null;
    text: string | null;
}