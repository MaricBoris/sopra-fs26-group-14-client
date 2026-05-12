"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Table, message } from "antd";
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

  const columns = [
    {
      title: "Title",
      key: "title",
      render: (_: unknown, record: Story) => `${record.title}`,
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

      {/*Main title */}
      <h1 className="results-title">STORIES</h1>
      <div className="results-title-divider">◆</div>

      
      {/* The gas-station background picture*/}
      <div className="results-stage">
        {/* Inner panel: sits on the dark display board in the background image */}
        <div className="results-panel">
          {/* Table title */}
          <div className="results-screening-title">
            ✦ SCREENING TONIGHT ✦
          </div>

          <div className="results-table" style={{ flex: 1, overflowY: "auto" }}>
            <Table
              dataSource={stories}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{
                emptyText: (
                  <div className="results-empty-text">no program yet</div>
                ),
              }}
              onRow={(record) => ({ onClick: () => router.push(`/results/${record.id}`) })}
              style={{ cursor: "pointer", fontFamily: "var(--font-cinzel), serif" }}
            />
          </div>

          {/*Textline under the table */}
          <div className="results-screening-tagline">
           ✦ Pick a Story — See you at the Drive-In ✦
          </div>
        </div>
      </div>
    </div>
  );
}