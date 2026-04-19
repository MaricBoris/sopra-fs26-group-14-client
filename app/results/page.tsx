"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Table, message } from "antd";
import HomeButton from "@/components/HomeButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { Story } from "@/types/story";

export default function ResultsPage() {
  const router = useRouter();
  const api = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const [stories, setStories] = useState<Story[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const fetchStories = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Story[]>("/results", token);
      setStories(data);
    } catch (e) {
      message.error(`Failed to load stories: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [api, token]);

  useEffect(() => {
    if (!isMounted) return;
    if (!token || !userId) { router.push("/login"); return; }
    fetchStories();
  }, [isMounted, token, userId, fetchStories, router]);

  const handleJoinLobby = () => {
    if (token && userId) {
      router.push("/rooms");
    } else {
      router.push("/login");
    }
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 40,
      align: "left" as const,
      render: (_: unknown, __: Story, index: number) => index + 1,
    },
    {
      title: "Story",
      key: "story",
      render: (_: unknown, record: Story) => `Story #${record.id}`,
    },
    {
      title: "Winner",
      key: "winner",
      render: (_: unknown, record: Story) =>
        record.hasWinner && record.winnerUsername ? record.winnerUsername : "—",
    },
  ];

  if (!isMounted) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <HomeButton />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>

        {/* 📝 Title banner */}
        <div style={{ position: "relative", marginBottom: -22 }}>
          <Image src="/schriftrolle.png" alt="Stories banner" width={400} height={100} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
          <h1 style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", margin: 0, fontSize: 40, fontFamily: "var(--font-cinzel), serif", color: "#3b2a1a", whiteSpace: "nowrap" }}>Stories</h1>
        </div>

        <div style={{ width: 660, maxWidth: "100%", background: "rgba(255,255,255,0.09)", backdropFilter: "blur(12px)", borderRadius: 1, border: "1px solid rgba(255,255,255,0.15)", padding: 24 }}>
          {/* 📝 Scrollable story table */}
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            <Table
              dataSource={stories}
              columns={columns}
              rowKey="id"
              pagination={false}
              onRow={(record) => ({ onClick: () => router.push(`/results/${record.id}`) })}
              style={{ cursor: "pointer", fontFamily: "var(--font-cinzel), serif" }}
            />
          </div>

          {/* 📝 Join Lobby button */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            <Button style={{ width: 160, height: 38, fontSize: 14 }} onClick={handleJoinLobby}>
              Join Lobby
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
