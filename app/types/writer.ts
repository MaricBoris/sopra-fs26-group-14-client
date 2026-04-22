import {User} from "@/types/user"
export interface Writer extends User{
    turn: boolean;
    genre: string | null;
    genreDescription?: string | null;
    text: string | null;
    quote?: string;
    quoteAssignedRound?: number;
}