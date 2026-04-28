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
import { GenreRating } from "@/types/genreRating";

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
  const [rating, setRating] = useState<GenreRating | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMounted) return;
    if (!token || !userId) { router.push("/login"); return; }

    const load = async () => {
      try {
        const [found, users, rate] = await Promise.all([
          api.get<Story>(`/results/story/${storyId}`, token),
          api.get<User[]>("/users", token),
          api.get<GenreRating>(`/stories/${storyId}/genre-rating`, token),
        ]);
        setRating(rate);
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

  const handleVote = async (votedForUserId: number | null) => {
    if (!votedForUserId || !token) return;
    setVoting(true);
    try {
      const updated = await api.post<GenreRating>(
        `/stories/${storyId}/genre-rating`,
        { votedForUserId },
        token,
      );
      setRating(updated);
      message.success("Vote recorded");
    } catch (e) {
      message.error(`Failed to vote: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setVoting(false);
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

        {/* Genre voting  */}
        {rating && (rating.winnerUserId || rating.loserUserId) && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "var(--font-cinzel), serif", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
              {rating.canVote
                ? (rating.userVotedForId ? "You can change your vote:" : "Whose genre fits the story best?")
                : "Voting unavailable — you participated in this story."}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { id: rating.winnerUserId, name: rating.winnerUsername, genre: rating.winnerGenre, votes: rating.winnerVotes },
                { id: rating.loserUserId, name: rating.loserUsername, genre: rating.loserGenre, votes: rating.loserVotes },
              ].map((p) => {
                if (!p.id) return null;
                const isMyVote = rating.userVotedForId === p.id;
                return (
                  <Button
                    key={p.id}
                    onClick={() => handleVote(p.id)}
                    disabled={!rating.canVote || voting}
                    style={{
                      height: "auto",
                      padding: "8px 14px",
                      background: isMyVote ? "#d4a44a" : "rgba(255,255,255,0.12)",
                      color: isMyVote ? "#3b2a1a" : "#fff",
                      border: isMyVote ? "1px solid #d4a44a" : "1px solid rgba(255,255,255,0.2)",
                      fontFamily: "var(--font-cinzel), serif",
                      fontWeight: isMyVote ? 600 : 400,
                      minWidth: 180,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      lineHeight: 1.3,
                    }}
                  >
                    <span>{p.name ?? "Player"}</span>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>{p.genre ?? "—"}</span>
                    <span style={{ fontSize: 12, marginTop: 2 }}>{p.votes} vote{p.votes === 1 ? "" : "s"}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
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
