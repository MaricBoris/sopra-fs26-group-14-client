"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Table, message } from "antd";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { genInputSmallStyle } from "antd/es/input/style";

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

interface ChatMessage {
  username: string;
  message: string;
  timestamp: string;
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
  chat: ChatMessage[];
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
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [chatOpen, setChatOpen] = useState(false);

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

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    try {
      await api.put(`/rooms/${roomId}/chat`, { message: chatInput.trim() }, token);
      setChatInput("");
    } catch {
      message.error("Failed to send message.");
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
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      width: "10cqw",
    },
    {
      title: "Slots",
      key: "slots",
      width: "69cqw",
      onHeaderCell: () => ({ style: { textAlign: "center" as const } }),
      onCell: () => ({ style: { textAlign: "center" as const } }),
      render: (_: unknown, record: RoleRow) => `${record.count}/${record.max}`,
    },
    {
      title: "",
      key: "select",
      width: "6.9cqw",
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
              width: "5.5cqw", height: "2.1cqw", fontSize: "0.9cqw", padding: 0,
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
      backgroundImage: "url('/rooms_id_wp.webp')",
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
          width: 104,
          height: 50,
          fontSize: 18,
          zIndex: 100,
        } as React.CSSProperties}
      >
        Exit
      </Button>

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 0 }}>

        {/* 📝 Outer wrapper */}
        <div style={{ display: "flex", justifyContent: "center" }}>

          {/* 📝 Frame image filling full viewport height */}
          <div className="pregame-frame" style={{ position: "relative", width: "min(100vw, calc(100vh * 1448 / 1086))", aspectRatio: "1448 / 1086" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/rooms_id_frame.webp"
              alt="Room frame"
              style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none", userSelect: "none" }}
            />

            {/* 📝 Title overlaid on transparent top of frame */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, zIndex: 5 }}>
              <h1 className="lobby-title" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 4 }}>
                PRE-GAME ROOM
              </h1>
              <div className="lobby-title-divider" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 0 }}>✦</div>
            </div>

            {/* 📝 Users panel */}
            <div style={{
              position: "absolute",
              top: "26.4%",
              left: "33.3%",
              right: "5%",
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "1.1cqw",
            }}>
              <span style={{ color: "#e8d896" }}>Users: </span>
              <span style={{ color: "#e8d896" }}>
                {allUsers.length === 0 ? "—" : allUsers.join(", ")}
              </span>
            </div>

            {/* 📝 Content panel overlaid inside the frame */}
            <div style={{
              position: "absolute",
              top: "12%",
              left: "32.1%",
              right: "32.1%",
              bottom: "25%",
              display: "flex",
              flexDirection: "column",
              fontFamily: "var(--font-cinzel), serif",
              color: "#ffffff",
              overflow: "visible",
            }}>

              {/* 📝 Available Roles heading */}
              <div className="available-matches-heading" style={{ marginBottom: "1.6cqw", fontSize: "1.2cqw", color: "#e8d896" }}>
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
                  style={{ cursor: "pointer", fontFamily: "var(--font-cinzel), serif", marginBottom: "0.8cqw", fontSize: "0.9cqw" }}
                />
              </div>

            </div>
            {/* 📝 Chat sidebar toggle button */}
            <button
              onClick={() => setChatOpen(o => !o)}
              style={{
                position: "fixed",
                right: chatOpen ? "clamp(160px, 15vw, 220px)" : "0px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(15, 12, 50, 0.85)",
                border: "1px solid rgba(212, 175, 93, 0.55)",
                borderRight: "None",
                borderRadius: "4px 0 0 4px",
                color: "var(--gold)",
                fontFamily: "var(--font-cinzel), serif",
                fontSize: "clamp(9px, 1.2vh, 12px)",
                padding: "12px 6px",
                cursor: "pointer",
                zIndex: 200,
                writingMode: "vertical-rl",
                letterSpacing: 2,
                transition: "right 0.3s ease",
              }}
            >
              {chatOpen ? "✕" : "✒ CHAT"}
            </button>

            {/* 📝 Chat sidebar */}
            {chatOpen && (
              <div style={{
                position: "fixed",
                right: 1,
                top: "25%",
                bottom: "25%",
                width: "min(clamp(160px, 15vw, 220px), 60vw)",
                overflow: "hidden",
                background: "rgba(15, 12, 50, 0.65)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(212, 175, 93, 0.55)",
                boxShadow: "0 0 18px rgba(212, 175, 93, 0.15)",
                borderRight: "none",
                borderRadius: "8px 0 0 8px",
                display: "flex",
                flexDirection: "column",
                zIndex: 199,
                fontFamily: "var(--font-cinzel), serif",
              }}>
                {/* header */}
                <div style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(212,168,87,0.2)",
                  color: "var(--gold)",
                  fontSize: "clamp(10px, 1.3vh, 13px)",
                  letterSpacing: 2,
                }}>
                  ✒ CHAT
                </div>

                {/* messages */}
                <div style={{
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: "8px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  {(room?.chat ?? []).length === 0 ? (
                    <span style={{ color: "#6b6480", fontSize: "clamp(11px, 1.5vh, 14px)" }}>No messages yet...</span>
                  ) : (
                    (room?.chat ?? []).map((msg, i) => (
                      <div key={i} style={{
                        fontSize: "clamp(11px, 1.5vh, 14px)",
                        color: "#e8d896",
                        fontFamily: "var(--font-cinzel), serif",
                        wordBreak: "break-all",
                        overflowWrap: "break-word",
                      }}>
                        <span style={{ color: "var(--gold)" }}>{msg.username}</span>
                        <span style={{ color: "rgba(245,230,200,0.5)" }}> ✦ </span>
                        <span>{msg.message}</span>
                      </div>
                    ))
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* input */}
                <div style={{
                  display: "flex",
                  borderTop: "1px solid rgba(212,168,87,0.2)",
                  padding: "8px 0",
                  boxSizing: "border-box",
                  width: "100%",
                }}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Say something..."
                    maxLength={200}
                    style={{
                      width: "calc(100% - 36px)",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#fff",
                      fontFamily: "var(--font-cinzel), serif",
                      fontSize: "clamp(11px, 1.5vh, 14px)",
                      padding: "10px 10px",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    onClick={handleSendChat}
                    style={{
                      width: 36,
                      flexShrink: 0,
                      background: "transparent",
                      border: "none",
                      borderLeft: "1px solid rgba(212,168,87,0.2)",
                      color: "var(--gold)",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    ✒
                  </button>
                </div>
              </div>
            )}

            {/* 📝 Settings row  */}
            <div style={{ position: "absolute", top: "31%", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>

              {/* 📝 Max Rounds button + dropdown */}
              <div style={{ position: "relative" }}>
                <Button
                  className="pregame-select-btn"
                  disabled={!isLobbyLeader}
                  onClick={() => { setRoundsOpen((o) => !o); setTimerOpen(false); }}
                  style={{
                    width: "clamp(123px, 12vh, 164px)", height: "clamp(29px, 3.8vh, 38px)",
                    fontSize: "clamp(9px, 1.2vh, 14px)", padding: "0 4px",
                    opacity: isLobbyLeader ? 1 : 0.7,
                  } as React.CSSProperties}
                >
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}><span>Max Rounds</span><span>{maxRounds}</span></span>
                </Button>
                {roundsOpen && (
                  <div style={{
                    position: "absolute", right: "100%", top: 0, zIndex: 200,
                    marginRight: 4,
                    background: "rgba(20,15,35,0.97)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 6, padding: 8,
                    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
                    width: "clamp(163px, 20vh, 219px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  }}>
                    {roundOptions.map((r) => (
                      <button key={r} onClick={() => { setMaxRounds(r); setRoundsOpen(false); }}
                        style={{
                          background: maxRounds === r ? "rgba(168,134,75,0.35)" : "rgba(255,255,255,0.05)",
                          border: maxRounds === r ? "1px solid #a8864b" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 4, color: "#e8d896",
                          fontFamily: "var(--font-cinzel), serif",
                          fontSize: "clamp(10px, 1.4vh, 13px)", padding: "4px 0", cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                      >{r}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* 📝 Round Timer button + dropdown */}
              <div style={{ position: "relative" }}>
                <Button
                  className="pregame-select-btn"
                  disabled={!isLobbyLeader}
                  onClick={() => { setTimerOpen((o) => !o); setRoundsOpen(false); }}
                  style={{
                    width: "clamp(123px, 12vh, 164px)", height: "clamp(29px, 3.8vh, 38px)",
                    fontSize: "clamp(9px, 1.2vh, 14px)", padding: "0 4px",
                    opacity: isLobbyLeader ? 1 : 0.7,
                  } as React.CSSProperties}
                >
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}><span>Round Timer</span><span>{timer}s</span></span>
                </Button>
                {timerOpen && (
                  <div style={{
                    position: "absolute", left: "100%", top: 0, zIndex: 200,
                    marginLeft: 4,
                    background: "rgba(20,15,35,0.97)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 6, padding: 8,
                    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
                    width: "clamp(163px, 20vh, 219px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  }}>
                    {timerOptions.map((t) => (
                      <button key={t} onClick={() => { setTimer(t); setTimerOpen(false); }}
                        style={{
                          background: timer === t ? "rgba(168,134,75,0.35)" : "rgba(255,255,255,0.05)",
                          border: timer === t ? "1px solid #a8864b" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 4, color: "#e8d896",
                          fontFamily: "var(--font-cinzel), serif",
                          fontSize: "clamp(10px, 1.4vh, 13px)", padding: "4px 0", cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                      >{t}s</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 📝 Start Game button — independent absolute div */}
            {isLobbyLeader && (
              <div style={{ position: "absolute", top: "75.35%", left: "50%", transform: "translateX(-50%)" }}>
                <Button
                  className="pregame-start-btn"
                  onClick={handleStartGame}
                  disabled={!rolesReady}
                  style={{ width: "clamp(127px, 15.6vh, 171px)" } as React.CSSProperties}
                >
                  START GAME
                </Button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}