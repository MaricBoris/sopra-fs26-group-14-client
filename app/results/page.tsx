"use client";
import { useEffect, useState, useCallback } from "react";
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
    <div className="results-page">
      <HomeButton />

      {/* Title above the display board */}
      <h1 className="results-title">STORIES</h1>
      <div className="results-title-divider">◆</div>

      {/* Stage holds the panel/CTA overlays positioned over the gas-station background */}
      <div className="results-stage">
        {/* Inner panel: sits on the dark display board in the background image */}
        <div className="results-panel">
          <div className="results-table" style={{ flex: 1, overflowY: "auto" }}>
            <Table
              dataSource={stories}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              onRow={(record) => ({ onClick: () => router.push(`/results/${record.id}`) })}
              style={{ cursor: "pointer", fontFamily: "var(--font-cinzel), serif" }}
            />
          </div>
        </div>

        {/* Join Lobby button below the display board */}
        <div className="results-cta">
          <Button className="lobby-create-btn" onClick={handleJoinLobby}>
            JOIN LOBBY
          </Button>
        </div>
      </div>
    </div>
  );
}