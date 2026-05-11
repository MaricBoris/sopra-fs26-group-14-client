"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { message } from "antd";
import HomeButton from "@/components/HomeButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { Story } from "@/types/story";
import { User } from "@/types/user";
import { GenreRating } from "@/types/genreRating";

// maps genre names to the file slugs
const GENRE_TO_SLUG: Record<string, string> = {
  "Horror": "horror",
  "Drama": "drama",
  "Thriller": "thriller",
  "Tragedy": "tragedy",
  "Dystopian Sci-Fi": "dystopian",
  "Survival": "survival",
  "Crime": "crime",
  "Psychological": "psychological",
  "Dark Fantasy": "darkfantasy",
  "Comedy": "comedy",
  "Love Story": "love",
  "Utopian Sci-Fi": "utopian",
  "Fairy Tale": "fairytale",
  "Kids / Disney Fantasy": "kidsfantasy",
};

const genreImage = (genre: string | null | undefined): string | null => {
  if (!genre) return null;
  const slug = GENRE_TO_SLUG[genre];
  if (!slug) return null;
  return `/genres/genre-${slug}-left.webp`;
};

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

  // Left = winner side, Right = loser side 
  // Each side is a writer with username, genre, votes and a vote action button
  const leftWriter = rating
    ? {
        userId: rating.winnerUserId,
        name: rating.winnerUsername ?? story.winnerUsername ?? "Player 1",
        genre: rating.winnerGenre ?? story.winGenre ?? null,
        votes: rating.winnerVotes ?? 0,
        userObj: winnerUser,
      }
    : {
        userId: null,
        name: story.winnerUsername ?? "Player 1",
        genre: story.winGenre ?? null,
        votes: 0,
        userObj: winnerUser,
      };

  const rightWriter = rating
    ? {
        userId: rating.loserUserId,
        name: rating.loserUsername ?? story.loserUsername ?? "Player 2",
        genre: rating.loserGenre ?? story.loseGenre ?? null,
        votes: rating.loserVotes ?? 0,
        userObj: loserUser,
      }
    : {
        userId: null,
        name: story.loserUsername ?? "Player 2",
        genre: story.loseGenre ?? null,
        votes: 0,
        userObj: loserUser,
      };

  const leftBg = genreImage(leftWriter.genre);
  const rightBg = genreImage(rightWriter.genre);

  const renderWriterPanel = (
    writer: typeof leftWriter,
    side: "left" | "right",
    bgUrl: string | null,
  ) => {
    const isMyVote = !!(rating && writer.userId && rating.userVotedForId === writer.userId);
    // check: can the user actually make/change a vote on this writer?
    const canVoteNow = !!(rating && rating.canVote && writer.userId);
    // status line text, only shown if voting is possible
    const statusText = canVoteNow
      ? (rating!.userVotedForId ? "Change your vote" : "Cast your vote")
      : null;

    return (
      <div className={`drivein-side drivein-side-${side}`}>
        {bgUrl && (
          <div
            className="drivein-side-bg"
            style={{ backgroundImage: `url('${bgUrl}')` }}
            aria-hidden
          />
        )}
        <div className="drivein-side-overlay" aria-hidden />

        <div className="drivein-side-content">
          <button
            type="button"
            className="drivein-username"
            onClick={() => handlePlayerClick(writer.userObj)}
          >
            {writer.name}
          </button>
          <div className="drivein-genre">{writer.genre ?? "—"}</div>

          {statusText && (
            <div className="drivein-vote-status">{statusText}</div>
          )}

          <div className="drivein-votes">
            {writer.votes} vote{writer.votes === 1 ? "" : "s"}
          </div>
        </div>

        {canVoteNow && (
          <div className="drivein-vote-btn-wrap">
            <button
              type="button"
              className={`drivein-vote-btn ${isMyVote ? "drivein-vote-btn-active" : ""}`}
              disabled={voting}
              onClick={() => handleVote(writer.userId)}
            >
              {isMyVote ? "♥ VOTED" : "♥ VOTE"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="drivein-page">
      <HomeButton />

      {/* Full-viewport ambient fill */}
      <div className="drivein-fill" aria-hidden />

      <div className="drivein-canvas">
        {/*main image */}
        <img
          src="/bg-storiespage.webp"
          alt=""
          className="drivein-bg"
          aria-hidden
          draggable={false}
        />

        <div className="drivein-stage">
          {/* Left writer panel */}
          {renderWriterPanel(leftWriter, "left", leftBg)}

          {/* Center screen: the story */}
          <div className="drivein-screen">
            <div className="drivein-screen-inner">
              <h2 className="drivein-story-title">THE STORY</h2>
              <div className="drivein-story-divider">✦</div>

              <div className="drivein-story-text">
                {story.storyText || "No story text available."}
              </div>

              <div className="drivein-winners">
                <div className="drivein-winner-row">
                  <span className="drivein-winner-label">WINNER BY JUDGE</span>
                  <span className="drivein-winner-value">
                    {story.hasWinner && story.winnerUsername ? story.winnerUsername : "—"}
                  </span>
                </div>
                <div className="drivein-winner-row">
                  <span className="drivein-winner-label">WINNER BY VOTES</span>
                  <span className="drivein-winner-value">
                    {(() => {
                      if (!rating) return "—";
                      const w = rating.winnerVotes ?? 0;
                      const l = rating.loserVotes ?? 0;
                      if (w === 0 && l === 0) return "—";
                      if (w > l) return rating.winnerUsername ?? "—";
                      if (l > w) return rating.loserUsername ?? "—";
                      return "Tie";
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right writer panel */}
          {renderWriterPanel(rightWriter, "right", rightBg)}
        </div>
      </div>

      {/* Return button */}
      <div className="drivein-return-wrap">
        <button
          type="button"
          className="drivein-return-btn"
          onClick={() => router.push("/results")}
        >
          Return to Stories
        </button>
      </div>
    </div>
  );
}
