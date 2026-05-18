import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

export const useActiveSessionCheck = () => {
    const router = useRouter();
    const apiService = useApi();
    const { value: token } = useLocalStorage<string>("token", "");
    const { value: userId } = useLocalStorage<string>("userId", "");

    const [modalVisible, setModalVisible] = useState(false);
    const [sessionType, setSessionType] = useState<"game" | "room" | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const check = async () => {
            // Check active game first
            try {
                const game = await apiService.get<{ gameId: number }>(`/games/current`, token);
                if (game?.gameId) {
                    setSessionType("game");
                    setSessionId(String(game.gameId));
                    setModalVisible(true);
                    return;
                }
            } catch (e: any) {
                if (e?.status !== 404) console.error("Game check failed", e);
            }

            // Check active room
            try {
                const rooms = await apiService.get<{
                    id: number;
                    users: { id: number }[];
                    writers: { id: number }[];
                    judges: { id: number }[];
                }[]>(`/rooms`, token);

                const activeRoom = rooms.find(room =>
                    room.users?.some(u => u.id === Number(userId)) ||
                    room.writers?.some(w => w.id === Number(userId)) ||
                    room.judges?.some(j => j.id === Number(userId))
                );

                if (activeRoom) {
                    setSessionType("room");
                    setSessionId(String(activeRoom.id));
                    setModalVisible(true);
                }
            } catch (e) {
                console.error("Room check failed", e);
            }
        };

        check();
    }, [token]);

    const handleRejoin = () => {
        setModalVisible(false);
        if (sessionType === "game") router.push(`/games/${sessionId}`);
        else if (sessionType === "room") router.push(`/rooms/${sessionId}`);
    };

    return { modalVisible, sessionType, handleRejoin };
};