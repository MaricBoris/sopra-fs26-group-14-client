"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Button, message } from "antd";
import HomeButton from "@/components/HomeButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { Story } from "@/types/story";
import { User } from "@/types/user";

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = Number(params.storyid);
  const api = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const [story, setStory] = useState<Story | null>(null);
  const [winnerUser, setWinnerUser] = useState<User | null>(null);
  const [loserUser, setLoserUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMounted) return;
    if (!token || !userId) { router.push("/login"); return; }

    const load = async () => {
      try {
        const [found, users] = await Promise.all([
          api.get<Story>(`/results/story/${storyId}`, token),
          api.get<User[]>("/users", token),
        ]);
        setStory(found);
        if (found.winnerUsername) {
          setWinnerUser(users.find((u) => u.username === found.winnerUsername) ?? null);
        }
        if (found.loserUsername) {
          setLoserUser(users.find((u) => u.username === found.loserUsername) ?? null);
        }
      } catch (e) {
        message.error(`Failed to load story: ${e instanceof Error ? e.message : String(e)}`);
        router.push("/results");
      }
    };
    load();
  }, [isMounted, token, userId, storyId, api, router]);

  const handlePlayerClick = (user: User | null) => {
    if (user?.id) {
      router.push(`/users/${user.id}`);
    } else {
      router.push("/login");
    }
  };

  if (!isMounted || !story) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <HomeButton />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>

        {/* 📝 Title banner */}
        <div style={{ position: "relative", marginBottom: -22 }}>
          <Image src="/schriftrolle.png" alt="Story banner" width={400} height={100} style={{ maxWidth: "100%", height: "auto", display: "block" }} />
          <h1 style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", margin: 0, fontSize: 40, fontFamily: "var(--font-cinzel), serif", color: "#3b2a1a", whiteSpace: "nowrap" }}>Story #{storyId}</h1>
        </div>

        {/* 📝 Outer row: P1 | box | P2 */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* 📝 Player 1 (winner) — outside the box, aligned to top */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", flexShrink: 0, paddingTop: 0 }}>
            <Button
              onClick={() => handlePlayerClick(winnerUser)}
              style={{ background: "#4a7c59", color: "#fff", border: "none", fontFamily: "var(--font-cinzel), serif" }}
            >
              {story.winnerUsername ?? "Player 1"}
            </Button>
            <span style={{ fontSize: 13, fontFamily: "var(--font-cinzel), serif", color: "rgba(255,255,255,0.75)" }}>
              {story.winGenre ?? "—"}
            </span>
          </div>

          {/* 📝 Box: winner line + story text + return button */}
          <div style={{ width: 560, maxWidth: "100%", background: "rgba(255,255,255,0.09)", backdropFilter: "blur(12px)", borderRadius: 1, border: "1px solid rgba(255,255,255,0.15)", padding: 24 }}>
            {/* 📝 Winner line */}
            <div style={{ textAlign: "center", marginBottom: 16, fontFamily: "var(--font-cinzel), serif", fontSize: 15, color: "rgba(255,255,255,0.85)" }}>
              {story.hasWinner && story.winnerUsername ? `Winner: ${story.winnerUsername}` : "No winner"}
            </div>

            {/* 📝 Story text */}
            <div
              style={{
                maxHeight: 360,
                overflowY: "auto",
                background: "rgba(255,255,255,0.07)",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.15)",
                padding: 16,
                fontFamily: "var(--font-cinzel), serif",
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.9)",
                whiteSpace: "pre-wrap",
              }}
            >
              {story.storyText || "No story text available."}
            </div>

          </div>

          {/* 📝 Player 2 (loser) — outside the box, aligned to top */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0, paddingTop: 0 }}>
            <Button
              onClick={() => handlePlayerClick(loserUser)}
              style={{ background: "#4a7c59", color: "#fff", border: "none", fontFamily: "var(--font-cinzel), serif" }}
            >
              {story.loserUsername ?? "Player 2"}
            </Button>
            <span style={{ fontSize: 13, fontFamily: "var(--font-cinzel), serif", color: "rgba(255,255,255,0.75)", alignSelf: "flex-start" }}>
              {story.loseGenre ?? "—"}
            </span>
          </div>

        </div>

        {/* 📝 Return button */}
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
          <Button style={{ width: 180, height: 38, fontSize: 14 }} onClick={() => router.push("/results")}>
            Return to Stories
          </Button>
        </div>
      </main>
    </div>
  );
}
