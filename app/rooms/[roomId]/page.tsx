"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Button, Table, message } from "antd";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";

interface UserGetDTO {
  id: number;
  username: string;
}

interface WriterGetDTO {
  id: number;
  username: string;
}

interface JudgeGetDTO {
  id: number;
  username: string;
}

interface Room {
  id: number;
  name: string;
  lobbyLeader: UserGetDTO;
  playerCount: number;
  users: UserGetDTO[];
  writers: WriterGetDTO[];
  judges: JudgeGetDTO[];
}

interface GameGetDTO {
  gameId: number;
  judges: JudgeGetDTO[];
}

// 📝 Role rows table
interface RoleRow {
  key: string;
  role: string;
  roleName: string;
  count: number;
  max: number;
}

export default function PreGameRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const api = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const [room, setRoom] = useState<Room | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // 📝 Fetch room state from GET /rooms/{roomId}
  // 📝 If room is gone (404) it was dissolved, redirect to /rooms
  const fetchRoom = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Room>(`/rooms/${roomId}`, token);
      setRoom(data);
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) {
        // 📝 room gone: game may have started, try to find active game
        try {
          const game = await api.get<GameGetDTO>(`/games/current`, token);
          router.push(`/games/${game.gameId}`);
        } catch {
          // 📝 no active game either: room was dissolved
          message.info("The room was dissolved.");
          router.push("/rooms");
        }
      } else {
        message.error(`Failed to load room: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }, [api, roomId, token, router]);

  // 📝 Mount gate + auth check + initial fetch
  useEffect(() => {
    if (!isMounted) return;
    if (!token || !userId) {
      router.push("/login");
      return;
    }
    fetchRoom();
  }, [isMounted, token, userId, fetchRoom, router]);

  // 📝 Poll every 3s so all users see live role updates
  useEffect(() => {
    if (!isMounted || !token) return;
    const interval = setInterval(fetchRoom, 3000);
    return () => clearInterval(interval);
  }, [isMounted, token, fetchRoom]);

  // 📝 PUT /rooms/{roomId}/leave - redirect to /rooms
  // 📝 If this was the last user: room is dissolved, show message
  const handleExit = async () => {
    const wasLastUser = room && (room.users.length + room.writers.length + room.judges.length) <= 1;
    try {
      await api.put(`/rooms/${roomId}/leave`, {}, token);
    } catch {
    }
    if (wasLastUser) {
      message.info("Room dissolved, last player left.");
    }
    router.push("/rooms");
  };

  // 📝 PUT /rooms/{roomId}/roles, refresh room
  const handleSelectRole = async (role: string) => {
    try {
      await api.put(`/rooms/${roomId}/roles`, { role }, token);
      await fetchRoom();
    } catch (e) {
      message.error(`Could not select role: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // 📝 POST /rooms/{roomId}, start game, redirect to /games/{gameId}
  const handleStartGame = async () => {
    try {
      const game = await api.post<GameGetDTO>(`/rooms/${roomId}`, {}, token);
      router.push(`/games/${game.gameId}`);
    } catch (e) {
      message.error(`Could not start game: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const isLobbyLeader = room?.lobbyLeader?.id === parseInt(userId ?? "0");
  // 📝 all roles must be filled before the lobby leader can start the game
  const rolesReady = room ? room.writers.length === 2 && room.judges.length === 1 : false;
  // 📝 track which role the current user holds to highlight button
  const myRole = room
    ? room.writers.some((w) => w.id === parseInt(userId ?? "0")) ? "WRITER"
    : room.judges.some((j) => j.id === parseInt(userId ?? "0")) ? "JUDGE"
    : null
    : null;

  // 📝 All participants = unassigned users + writers + judges
  const allUsers = room
    ? [
        ...room.users.map((u) => u.username),
        ...room.writers.map((w) => w.username),
        ...room.judges.map((j) => j.username),
      ]
    : [];

  const roleRows: RoleRow[] = room
    ? [
        { key: "WRITER", role: "WRITER", roleName: "Writers", count: room.writers.length, max: 2 },
        { key: "JUDGE", role: "JUDGE", roleName: "Judge", count: room.judges.length, max: 1 },
      ]
    : [];

  const roleColumns = [
    {
      title: "#",
      key: "index",
      width: 40,
      render: (_: unknown, __: RoleRow, index: number) => index + 1,
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
    },
    {
      title: <div style={{ textAlign: "center" }}>Slots</div>,
      key: "slots",
      width: 80,
      render: (_: unknown, record: RoleRow) => (
        <div style={{ textAlign: "center" }}>{record.count}/{record.max}</div>
      ),
    },
    {
      title: "",
      key: "select",
      width: 100,
      align: "right" as const,
      render: (_: unknown, record: RoleRow) => {
        const isMyRole = myRole === record.role;
        const isFull = record.count >= record.max;
        const isDisabled = !isMyRole && isFull;
        return (
          <Button
            disabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation();
              // 📝 clicking own role deselects (sends NONE → backend puts user back in unassigned)
              handleSelectRole(isMyRole ? "NONE" : record.role);
            }}
            style={{
              width: 80, height: 30, fontSize: 13, padding: 0,
              ...(isMyRole && { ["--btn-bg" as string]: "#25d366" }),
              ...(isDisabled && { opacity: 0.4 }),
            } as React.CSSProperties}
          >
            {isMyRole ? "Deselect" : "Select"}
          </Button>
        );
      },
    },
  ];

  if (!isMounted) return null;

  return (
    <div style={{ minHeight: "100vh" }}>

      {/* 📝 Exit button */}
      <Button
        onClick={handleExit}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          width: 80,
          height: 38,
          fontSize: 14,
          zIndex: 100,
          ["--btn-bg" as string]: "#c0392b",
        } as React.CSSProperties}
      >
        Exit
      </Button>

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>

        {/* 📝 Pre-Game Room banner with schriftrolle.png */}
        <div style={{ position: "relative", marginBottom: -22 }}>
          <Image
            src="/schriftrolle.png"
            alt="Pre-Game Room banner"
            width={400}
            height={100}
            style={{ maxWidth: "100%", height: "auto", display: "block" }}
          />
          <h1 style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            margin: 0,
            fontSize: 28,
            fontFamily: "var(--font-cinzel), serif",
            color: "#3b2a1a",
            whiteSpace: "nowrap",
          }}>
            Pre-Game Room
          </h1>
        </div>

        {/* 📝 Main glass box */}
        <div style={{
          width: 560,
          maxWidth: "100%",
          background: "rgba(255,255,255,0.09)",
          backdropFilter: "blur(12px)",
          borderRadius: 1,
          border: "1px solid rgba(255,255,255,0.15)",
          padding: 24,
        }}>

          {/* 📝 Available Roles heading */}
          <div style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 2,
            padding: "10px 0",
            textAlign: "center",
            marginBottom: 16,
          }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-cinzel), serif" }}>Available Roles</h2>
          </div>

          {/* 📝 Roles table: Writers and Judge rows with Select buttons */}
          <Table
            dataSource={roleRows}
            columns={roleColumns}
            rowKey="key"
            pagination={false}
            onRow={(record) => ({ onClick: () => handleSelectRole(record.role) })}
            style={{ cursor: "pointer", fontFamily: "var(--font-cinzel), serif", marginBottom: 20 }}
          />

          {/* 📝 Users box: all participants currently in the room */}
          <div style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 2,
            padding: "12px 20px",
            marginBottom: 20,
            textAlign: "center",
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontFamily: "var(--font-cinzel), serif" }}>Users</h3>
            {allUsers.length === 0 ? (
              <p style={{ margin: 0, fontFamily: "var(--font-cinzel), serif", opacity: 0.6 }}>No users yet</p>
            ) : (
              allUsers.map((username, i) => (
                <p key={i} style={{ margin: "2px 0", fontFamily: "var(--font-cinzel), serif" }}>{username}</p>
              ))
            )}
          </div>

          {/* 📝 Start Game button: only visible to lobby leader */}
          {isLobbyLeader && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                onClick={handleStartGame}
                disabled={!rolesReady}
                style={{
                  width: 160,
                  height: 38,
                  fontSize: 14,
                  ["--btn-bg" as string]: "#25d366",
                } as React.CSSProperties}
              >
                Start Game
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
