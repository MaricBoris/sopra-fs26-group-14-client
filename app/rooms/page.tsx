"use client"; // For components that need React hooks and browser APIs, SSR has to be disabled
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Table, Modal, Input, message } from "antd";
import HomeButton from "@/components/HomeButton";
import ProfileButton from "@/components/ProfileButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";

// Room object shape based on REST spec (7 fields)
interface Room {
  id: number;
  name: string;
  playerCount: number;
  lobbyLeader: string;
  users: string[];
  writers: string[];
  judges: string[];
}

export default function RoomsPage() {
  const router = useRouter();
  const api = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomName, setRoomName] = useState("");

  // 📝 mount gate -> don't read localStorage before it's available (prevents hydration mismatch)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // 📝 fetch room list from GET /rooms on mount, redirect to login if not authenticated
  useEffect(() => {
    if (!isMounted) return;
    if (!token || !userId) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const data = await api.get<Room[]>("/rooms", token);
        setRooms(data);
      } catch (e) {
        message.error(`Failed to load rooms: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
  }, [isMounted, token, userId, api, router]);

  // 📝 POST /rooms -> create room with name, redirect creator to /rooms/{roomId}
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      message.error("Room name cannot be empty.");
      return;
    }
    try {
      const created = await api.post<Room>("/rooms", { name: roomName.trim() }, token);
      setIsModalOpen(false);
      setRoomName("");
      router.push(`/rooms/${created.id}`);
    } catch (e) {
      message.error(`Could not create room: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // 📝 PUT /rooms/{roomId}/join -> redirect to pre-game room or show error if full/started
  const handleJoin = async (room: Room) => {
    try {
      await api.put(`/rooms/${room.id}/join`, {}, token);
      router.push(`/rooms/${room.id}`);
    } catch (e) {
      message.error(`Could not join room: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const columns = [
    { title: "#", key: "index", width: 25, align: "left" as const, render: (_: unknown, __: Room, index: number) => index + 1 },
    { title: "Room Name", dataIndex: "name", key: "name", align: "left" as const, width: 120 },
    {
      title: <div style={{ textAlign: "center" }}>Players</div>,
      dataIndex: "playerCount",
      key: "playerCount",
      width: 120,
      render: (count: number) => <div style={{ textAlign: "center" }}>{count}/3</div>,
    },
    {
      title: "",
      key: "join",
      width: 100,
      align: "right" as const,
      render: (_: unknown, record: Room) => (
        <Button onClick={(e) => { e.stopPropagation(); handleJoin(record); }} style={{ width: 70, height: 30, fontSize: 13, padding: 0 }}>
          Join
        </Button>
      ),
    },
  ];

  // 📝 don't render until mounted to avoid hydration mismatch with localStorage
  if (!isMounted) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <HomeButton />
      <ProfileButton />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>

        {/* 📝 Lobby title banner with text overlaid on schriftrolle.png */}
        <div style={{ position: "relative", marginBottom: -22 }}>
          <Image src="/schriftrolle.png" alt="Lobby banner" width={400} height={100} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
          <h1 style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", margin: 0, fontSize: 40, fontFamily: "var(--font-cinzel), serif", color: "#3b2a1a", whiteSpace: "nowrap" }}>Lobby</h1>
        </div>

        <div style={{ width: 660, maxWidth: "100%", background: "rgba(255,255,255,0.09)", backdropFilter: "blur(12px)", borderRadius: 1, border: "1px solid rgba(255,255,255,0.15)", padding: 24 }}>
          {/* 📝 Available Matches heading */}
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 2, padding: "10px 0", textAlign: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-cinzel), serif" }}>Available Matches</h2>
          </div>

          {/* 📝 Room list: scrollable table, max height fits ~6 rows before scrolling */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
          <Table
            dataSource={rooms}
            columns={columns}
            rowKey="id"
            pagination={false}

            onRow={(record) => ({ onClick: () => router.push(`/rooms/${record.id}`) })}
            style={{ cursor: "pointer", fontFamily: "var(--font-cinzel), serif" }}
          />
          </div>

          {/* 📝 Create Match button: opens modal to enter room name */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            <Button style={{ width: 160, height: 38, fontSize: 14 }} onClick={() => setIsModalOpen(true)}>
              Create Match
            </Button>
          </div>
        </div>
      </main>

      {/* 📝 Modal: prompts user to enter a room name before creating */}
      <Modal
        title="Create Match"
        open={isModalOpen}
        onOk={handleCreateRoom}
        onCancel={() => { setIsModalOpen(false); setRoomName(""); }}
        okText="Create"
      >
        <Input
          placeholder="Enter room name (max 15 chars)"
          value={roomName}
          maxLength={15}
          onChange={(e) => setRoomName(e.target.value)}
          onPressEnter={handleCreateRoom}
        />
      </Modal>
    </div>
  );
}
