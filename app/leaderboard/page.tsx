"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, message } from "antd";
import HomeButton from "@/components/HomeButton";
import ProfileButton from "@/components/ProfileButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { LeaderboardEntry as ApiLeaderboardEntry } from "@/types/leaderboardEntry";

// 14 genres, split into the drawer's two compartment rows (7 each).
// Top row sits behind / above, bottom row in front. Order is left-to-right
// in each row.
const GENRES_TOP = [
  "Horror",
  "Utopian",
  "Dystopian",
  "Dark Fantasy",
  "Psychological",
  "Survival",
  "Love Story",
];
const GENRES_BOTTOM = [
  "Comedy",
  "Disney",
  "Tragedy",
  "Drama",
  "Crime",
  "Thriller",
  "Fairy Tale",
];

export default function LeaderboardPage() {
  const router = useRouter();
  const api = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  // mount gate: don't read localStorage before it's available (avoids SSR
  // hydration mismatch, same pattern as the lobby page).
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // drawer open/closed and currently-selected genre
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // leaderboard data — overall by default, per-genre when selectedGenre is set
  const [entries, setEntries] = useState<ApiLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // auth redirect
  useEffect(() => {
    if (!isMounted) return;
    if (!token || !userId) router.push("/login");
  }, [isMounted, token, userId, router]);

  // fetch leaderboard whenever the selected genre changes
  useEffect(() => {
    if (!isMounted || !token) return;

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const query = selectedGenre
          ? `/leaderboard?genre=${encodeURIComponent(selectedGenre)}`
          : `/leaderboard`;
        const data = await api.get<ApiLeaderboardEntry[]>(query, token);
        setEntries(data);
      } catch (e) {
        message.error(
          `Failed to load leaderboard: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isMounted, token, selectedGenre, api]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    // Could close the drawer after selection; left open here so the user can
    // switch genres without reopening every time.
    // setIsDrawerOpen(false);
  };

  const columns = [
    {
      title: "#",
      key: "rank",
      width: 50,
      align: "left" as const,
      render: (_: unknown, __: ApiLeaderboardEntry, index: number) =>
        index + 1,
    },
    {
      title: "Player",
      dataIndex: "username",
      key: "username",
      align: "left" as const,
    },
    {
      title: <div style={{ textAlign: "right" }}>Score</div>,
      dataIndex: "score",
      key: "score",
      align: "right" as const,
      width: 80,
    },
  ];

  if (!isMounted) return null;

  // Helper to render one genre button. Used twice (top and bottom row).
  const renderGenreButton = (genre: string) => (
    <button
      key={genre}
      className={`drawer-genre-btn ${
        selectedGenre === genre ? "is-active" : ""
      }`}
      onClick={() => handleGenreSelect(genre)}
      // Only interactive when drawer is actually open
      tabIndex={isDrawerOpen ? 0 : -1}
      aria-hidden={!isDrawerOpen}
    >
      {/* "Psychological" gets a soft hyphen so it breaks between Psycho-
          and logical if the cell is too narrow. "Love Story" gets a
          forced line break so it sits on two lines like "Dark Fantasy". */}
      {genre === "Psychological" ? (
        <>Psycho&shy;logical</>
      ) : genre === "Love Story" ? (
        <>
          Love
          <br />
          Story
        </>
      ) : genre === "Fairy Tale" ? (
        <>
          Fairy
          <br />
          Tale
        </>
      ) : (
        genre
      )}
    </button>
  );

  return (
    <div className="leaderboard-page">
      <HomeButton />
      <ProfileButton />

      {/* No page title — the LEADERBOARD wordmark is engraved on the
          chessboard graphic itself, and skipping the title gives the drawer
          more vertical room to slide out below the chessboard. */}

      {/* Stage: holds the 3 stacked image layers + the toggle button + the
          leaderboard panel that sits inside the chessboard's dark area. */}
      <div className="chessboard-stage">
        <div className="chessboard-wrap">
          {/* Layer (z=2): bottom piece — the sub-base with a flat black
              "drawer slot" area in the middle. The drawer image will sit
              on top of this when closed. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Unterteil_Schachbrett_mit_schublade.webp"
            alt=""
            className="chessboard-bottom"
          />

          {/* Layer (z=3): drawer — slides between bottom (z=2) and top (z=4).
              When closed, only the drawer-front strip is visible and it
              covers the bottom piece's black slot area. When open, the
              compartments are revealed above the drawer-front. */}
          <div
            className={`chessboard-drawer ${isDrawerOpen ? "is-open" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/schublade.webp"
              alt=""
              className="chessboard-drawer-img"
            />
            {/* Genre buttons split into two independent grids — one per
                row of the drawer's compartments. The drawer is shown in
                slight perspective, so the rows have different bounds. */}
            <div className="drawer-genres-row drawer-genres-row--top">
              {GENRES_TOP.map((genre) => renderGenreButton(genre))}
            </div>
            <div className="drawer-genres-row drawer-genres-row--bottom">
              {GENRES_BOTTOM.map((genre) => renderGenreButton(genre))}
            </div>
          </div>

          {/* Layer (z=4): top piece — the chessboard with statuettes and the
              engraved "LEADERBOARD" title. Hides the upper part of the
              drawer when retracted. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/perfektes_oberes_schachbrett_teil.webp"
            alt=""
            className="chessboard-top"
          />

          {/* Drawer toggle button: positioned over the plaque on the top
              piece's plinth. Label stays "Pick a Genre" / "Close" regardless
              of which genre is currently selected — the selection is
              communicated by the highlighted button inside the drawer and
              by the leaderboard table below. */}
          <button
            className="chessboard-drawer-toggle"
            onClick={() => setIsDrawerOpen((v) => !v)}
            aria-label={isDrawerOpen ? "Close drawer" : "Open drawer"}
            aria-expanded={isDrawerOpen}
          >
            {isDrawerOpen ? "Close" : "Pick a Genre"}
          </button>

          {/* Leaderboard panel: sits inside the dark inset on the top piece,
              below the engraved LEADERBOARD title. */}
          <div className="leaderboard-panel">
            <div className="leaderboard-table">
              <Table
                dataSource={entries}
                columns={columns}
                rowKey="userId"
                pagination={false}
                size="small"
                loading={loading}
                locale={{
                  emptyText: (
                    <span
                      style={{
                        color: "#6b6480",
                        fontFamily: "var(--font-cinzel), serif",
                      }}
                    >
                      {selectedGenre
                        ? `No rankings yet for ${selectedGenre}.`
                        : "No champions yet — be the first!"}
                    </span>
                  ),
                }}
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}