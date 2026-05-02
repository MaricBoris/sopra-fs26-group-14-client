"use client";
import { useEffect, useState, useCallback } from "react";
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
  timer: number;
  maxRounds: number;
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
  const [roundsOpen, setRoundsOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [maxRounds, setMaxRounds] = useState(4);
  const [timer, setTimer] = useState(90);

  useEffect(() => setIsMounted(true), []);

  // 📝 Fetch room state from GET /rooms/{roomId}
  // 📝 If room is gone (404) it was dissolved, redirect to /rooms
  const fetchRoom = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Room>(`/rooms/${roomId}`, token);
      setRoom(data);
      if (data.maxRounds) setMaxRounds(data.maxRounds);
      if (data.timer) setTimer(data.timer);
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

  useEffect(() => {
    if (!isMounted || !token || !room) return;
    if (!isLobbyLeader) return;
    api.put(`/rooms/${roomId}/rounds`, maxRounds, token).catch((e) => {
      message.error(`Could not update max rounds: ${e instanceof Error ? e.message : String(e)}`);
    });
  }, [maxRounds]);

  
  useEffect(() => {
    if (!isMounted || !token || !room) return;
    if (!isLobbyLeader) return;
    api.put(`/rooms/${roomId}/timer`, timer, token).catch((e) => {
      message.error(`Could not update timer: ${e instanceof Error ? e.message : String(e)}`);
    });
  }, [timer]);

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

  const roundOptions = Array.from({ length: Math.ceil((30 - 2) / 4) + 1 }, (_, i) => 2 + i * 4);
  const timerOptions = Array.from({ length: Math.ceil((180 - 20) / 10) + 1 }, (_, i) => 20 + i * 10);

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
            className={`pregame-select-btn${isMyRole ? " selected" : ""}`}
            disabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation();
              // 📝 clicking own role deselects (sends NONE → backend puts user back in unassigned)
              handleSelectRole(isMyRole ? "NONE" : record.role);
            }}
            style={{
              width: 80, height: 30, fontSize: 13, padding: 0,
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
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('/rooms_id_03_quills.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed",
    }}>

      {/* 📝 Exit button */}
      <Button
        className="pregame-exit-btn"
        onClick={handleExit}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          width: 80,
          height: 38,
          fontSize: 14,
          zIndex: 100,
        } as React.CSSProperties}
      >
        Exit
      </Button>

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>

        {/* 📝 Pre-Game Room title matching lobby style */}
        <h1 className="lobby-title" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 4 }}>
          PRE-GAME ROOM
        </h1>
        <div className="lobby-title-divider" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 20 }}>◆</div>

        {/* Outer wrapper: frame + settings panel side by side */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>

          {/* 📝 Frame image with content positioned inside it */}
          <div style={{ position: "relative", width: "min(650px, 95vw)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rooms_id__center_02.png"
              alt="Room frame"
              style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none", userSelect: "none" }}
            />

            {/* 📝 Content panel overlaid inside the frame */}
            <div style={{
              position: "absolute",
              top: "25%",
              left: "20%",
              right: "20%",
              bottom: "10%",
              display: "flex",
              flexDirection: "column",
              fontFamily: "var(--font-cinzel), serif",
              color: "#ffffff",
              overflow: "hidden",
            }}>

              {/* 📝 Available Roles heading */}
              <div className="available-matches-heading" style={{ marginBottom: 10 }}>
                AVAILABLE ROLES
              </div>

              {/* 📝 Roles table */}
              <div className="pregame-table">
                <Table
                  dataSource={roleRows}
                  columns={roleColumns}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  onRow={(record) => ({ onClick: () => handleSelectRole(record.role) })}
                  style={{ cursor: "pointer", fontFamily: "var(--font-cinzel), serif", marginBottom: 12 }}
                />
              </div>

              {/* 📝 Users list */}
              <div style={{ textAlign: "center", marginBottom: 12, marginTop: 10 }}>
                <div className="available-matches-heading" style={{ marginBottom: 6 }}>USERS</div>
                {allUsers.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: "#6b6480" }}>No users yet</p>
                ) : (
                  allUsers.map((username, i) => (
                    <p key={i} style={{ margin: "2px 0", fontSize: 13, color: "#e8d896", fontFamily: "var(--font-display)", letterSpacing: 1 }}>
                      {username}
                    </p>
                  ))
                )}
              </div>

              {/* 📝 Start Game button: only visible to lobby leader */}
              {isLobbyLeader && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>
                  <Button
                    className="lobby-create-btn"
                    onClick={handleStartGame}
                    disabled={!rolesReady}
                  >
                    START GAME
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Settings panel: Max Rounds + Timer */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 12,
            marginTop: 80,
          }}>

            {/* Max Rounds box */}
            <div style={{ position: "relative" }}>
              <Button
                className="pregame-select-btn"
                disabled={!isLobbyLeader}
                onClick={() => { setRoundsOpen((o) => !o); setTimerOpen(false); }}
                style={{
                  width: 160, height: 38, fontSize: 13, padding: "0 10px",
                  opacity: isLobbyLeader ? 1 : 0.5,
                  fontFamily: "var(--font-cinzel), serif",
                } as React.CSSProperties}
              >
                Max Rounds: {maxRounds}
              </Button>

              {/* Curtain dropdown for rounds */}
              {roundsOpen && (
                <div style={{
                  position: "absolute", top: 42, left: 0, zIndex: 200,
                  background: "rgba(20,15,35,0.97)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  padding: 8,
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 6,
                  width: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}>
                  {roundOptions.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setMaxRounds(r); setRoundsOpen(false); }}
                      style={{
                        background: maxRounds === r ? "rgba(168,134,75,0.35)" : "rgba(255,255,255,0.05)",
                        border: maxRounds === r ? "1px solid #a8864b" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4, color: "#e8d896",
                        fontFamily: "var(--font-cinzel), serif",
                        fontSize: 12, padding: "4px 0", cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Round Timer box */}
            <div style={{ position: "relative" }}>
              <Button
                className="pregame-select-btn"
                disabled={!isLobbyLeader}
                onClick={() => { setTimerOpen((o) => !o); setRoundsOpen(false); }}
                style={{
                  width: 160, height: 38, fontSize: 13, padding: "0 10px",
                  opacity: isLobbyLeader ? 1 : 0.5,
                  fontFamily: "var(--font-cinzel), serif",
                } as React.CSSProperties}
              >
                Round Timer: {timer}s
              </Button>

              {/* Curtain dropdown for timer */}
              {timerOpen && (
                <div style={{
                  position: "absolute", top: 42, left: 0, zIndex: 200,
                  background: "rgba(20,15,35,0.97)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  padding: 8,
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 6,
                  width: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}>
                  {timerOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTimer(t); setTimerOpen(false); }}
                      style={{
                        background: timer === t ? "rgba(168,134,75,0.35)" : "rgba(255,255,255,0.05)",
                        border: timer === t ? "1px solid #a8864b" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4, color: "#e8d896",
                        fontFamily: "var(--font-cinzel), serif",
                        fontSize: 12, padding: "4px 0", cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}