import {User} from "@/types/user"
export interface Writer extends User{
    turn: boolean;
    genre: string | null;
    text: string | null;
    quote?: string;
}