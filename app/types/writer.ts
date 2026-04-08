import {User} from "@/types/user"
export interface Writer extends User{
    turn: Boolean| null;
    genre: String | null;
    text: String | null;
}