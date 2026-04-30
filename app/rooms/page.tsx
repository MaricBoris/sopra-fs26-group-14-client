"use client"; // For components that need React hooks and browser APIs, SSR has to be disabled
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Table, Modal, Input, message } from "antd";
import HomeButton from "@/components/HomeButton";
import ProfileButton from "@/components/ProfileButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";

interface Room {
  id: number;
  name: string;
  playerCount: number;
  lobbyLeader: { id: number; username: string };
  users: { id: number; username: string }[];
  writers: { id: number; username: string }[];
  judges: { id: number; username: string }[];
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

  // 📝 fetch room list from GET /rooms
  const fetchRooms = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Room[]>("/rooms", token);
      setRooms(data);
    } catch (e) {
      message.error(`Failed to load rooms: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [api, token]);

  // 📝 on mount: redirect if not authenticated, then fetch
  useEffect(() => {
    if (!isMounted) return;
    if (!token || !userId) { router.push("/login"); return; }
    fetchRooms();
  }, [isMounted, token, userId, fetchRooms, router]);

  // 📝 poll every 3 seconds so room list stays live for all users
  useEffect(() => {
    if (!isMounted || !token) return;
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [isMounted, token, fetchRooms]);

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
    } catch {
      message.error("Room full: unable to join.");
    }
  };

  const columns = [
    { title: "#", key: "index", width: 25, align: "left" as const, render: (_: unknown, __: Room, index: number) => index + 1 },
    { title: "Room Name", dataIndex: "name", key: "name", align: "left" as const, width: 120 },
    {
      title: <div style={{ textAlign: "center" }}>Players</div>,
      key: "playerCount",
      width: 80,
      // 📝 count all participants: unassigned + writers + judges
      render: (_: unknown, record: Room) => (
        <div style={{ textAlign: "center" }}>
          {(record.users?.length ?? 0) + (record.writers?.length ?? 0) + (record.judges?.length ?? 0)}/3
        </div>
      ),
    },
    {
      title: "",
      key: "join",
      width: 70,
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
    
    <div className="lobby-page">
      <HomeButton />
      <ProfileButton />

      {/*  Lobby title (sits on top of the starry background, above the elevator) */}
      <h1 className="lobby-title">LOBBY</h1>
      <div className="lobby-title-divider">◆</div>

      {/*  Elevator stage: descends from top on mount, then table + button fade in */}
      <div className="elevator-stage">
        <div className="elevator-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/elevator.png" alt="Elevator" className="elevator-img" />

          {/*  Inner panel: Available Matches table sits here, between the two characters */}
          <div className="elevator-panel">
            <div className="available-matches-heading">AVAILABLE MATCHES</div>
            <div className="lobby-table" style={{ flex: 1, overflowY: "auto" }}>
              <Table
                dataSource={rooms}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
                onRow={(record) => ({ onClick: () => router.push(`/rooms/${record.id}`) })}
                style={{ cursor: "pointer", fontFamily: "var(--font-cinzel), serif" }}
              />
            </div>
          </div>

          {/* Create Match button: sits below the horizontal rod, inside the elevator floor area */}
          <div className="elevator-cta">
            <Button className="lobby-create-btn" onClick={() => setIsModalOpen(true)}>
              CREATE MATCH
            </Button>
          </div>
        </div>
      </div>

    {/* End ELevator logic*/} 
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
