"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, message } from "antd";
import HomeButton from "@/components/HomeButton";
import ProfileButton from "@/components/ProfileButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { LeaderboardEntry as ApiLeaderboardEntry } from "@/types/leaderboardEntry";

// 14 genres, split into the drawer's two compartment rows (7 each)
// Order is left to right in each row
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

  // mount gate: don't read localStorage before it's available 
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // drawer open/closed and currently-selected genre
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // leaderboard data: overall by default, per-genre when selectedGenre is set
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
          `Failed to load leaderboard`
        );
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isMounted, token, selectedGenre, api]);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre((currentGenre) =>
      currentGenre === genre ? null : genre
    );
  };

  const columns = [
    {
      title: "#",
      key: "rank",
      width: 50,
      align: "left" as const, //as const, so typescript is happy. It expects either left, center or right and not a random string
      render: (_: unknown, __: ApiLeaderboardEntry, index: number) => //we ignore the first 2 argument/don't need them, only index is of interest for us here
      //value (dataindex, for example username or score, set in the other columns, but not here), record (the whole leaderboardentry object for this row), index
        index + 1,
    },
    {
      title: "Player",
      dataIndex: "username", //specifies, which field from apileaderboardentry we want here: username
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
        selectedGenre === genre ? "is-active" : "" //styling is always drawer-genre-btn and (in case of selectedGenre === genre) also is-active 
      }`}
      onClick={() => handleGenreSelect(genre)}
      // Only interactive when drawer is actually open
      tabIndex={isDrawerOpen ? 0 : -1} //ignored by tabs
      aria-hidden={!isDrawerOpen} //ignored by screenreaders
    >
      {/* Psychological gets a soft hyphen so it breaks between Psycho-
          and logical if the cell is too small. Love Story and Fairy Tale gets a
          forced line break so it sits on two lines like Dark Fantasy. */}
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

      {/* Stage: holds the 3 stacked image layers + the open/close button + the
          leaderboard panel that sits inside the chessboards dark area. */}
      <div className="chessboard-stage">
        <div className="chessboard-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Unterteil_Schachbrett_mit_schublade.webp"
            alt=""
            className="chessboard-bottom"
          />
          <div
            className={`chessboard-drawer ${isDrawerOpen ? "is-open" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/schublade.webp"
              alt=""
              className="chessboard-drawer-img"
            />
  
            <div className="drawer-genres-row drawer-genres-row--top">
              {GENRES_TOP.map((genre) => renderGenreButton(genre))}
            </div>
            <div className="drawer-genres-row drawer-genres-row--bottom">
              {GENRES_BOTTOM.map((genre) => renderGenreButton(genre))}
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/perfektes_oberes_schachbrett_teil.webp"
            alt=""
            className="chessboard-top"
          />

          {/* Drawer open/close button */}
          <button
            className="chessboard-drawer-toggle"
            onClick={() => setIsDrawerOpen((v) => !v)}
          >
            {isDrawerOpen ? "Close" : "Pick a Genre"}
          </button>

          {/* Leaderboard panel*/}
          <div className="leaderboard-panel">
            <div className="leaderboard-table">
              <Table
                dataSource={entries} //the data that should go in the table, our entries
                columns={columns} //the columns defined above
                rowKey="userId"
                pagination={false} //does not do pages for the table, for example first 10 on page 1, next 10 on page 2 etc
                size="small"
                loading={loading} //shows a loading status if loading is true
                locale={{
                  emptyText: ( //configures the empty text
                    <span
                      style={{
                        color: "#8A775F",
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