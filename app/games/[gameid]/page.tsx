"use client";
import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation

import { Button, Input , message, Modal, Tooltip } from "antd";
import { Game } from "@/types/game";
import { Writer } from "@/types/writer";
import { ApplicationError } from "@/types/error";
import React, { useEffect, useState, useRef } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { getApiDomain } from "@/utils/domain";

const GamePage: React.FC = () => {

  const router = useRouter();
  const params = useParams<{ gameid: string }>();
  const gameid = params?.gameid;
  const apiService = useApi();
  const [countdown, setCountdown] = useState<number>(0);
  const [game, setGame] = useState<Game | null>(null);
  const [writer1Genre, setGenre1] = useState<string>("Genre");
  const [writer2Genre, setGenre2] = useState<string>("Genre");
  const [quoteUsedP1, setQuoteUsedP1] = useState(false);
  const [quoteUsedP2, setQuoteUsedP2] = useState(false);
  const { TextArea } = Input;
  const [starting, setStarting] = useState(true);
  const [startCountdown, setStartCountdown] = useState(5);

  // ============================================================
  // STYLE OBJECTS — redesigned for the starry / gold theme
  // ============================================================

  // Active player highlight (gold glow instead of green)
  const activePlayerStyle: React.CSSProperties = {
    boxShadow: "0 0 0 1px rgba(212,168,87,0.7), 0 0 24px 4px rgba(212,168,87,0.35)",
    borderRadius: 8,
    transition: "box-shadow 0.4s",
  };
  const inactivePlayerStyle: React.CSSProperties = {
    boxShadow: "none",
    borderRadius: 8,
    transition: "box-shadow 0.4s",
  };

const {
  value: token,
  clear: clearToken,
} = useLocalStorage<string>("token", "");

const {
  value: userId,
  clear: clearId,
} = useLocalStorage<string>("userId", "");

const RuleItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, lineHeight: 1.6 }}>
    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
    <span style={{ color: "rgba(245,230,200,0.85)" }}>{text}</span>
  </div>
);

const [ wholeStoryText,setStoryyText] = useState<string>("");
const [TwoInput, setTwoInput] = useState("");
const [OneInput, setOneInput] = useState("");
const activeWriter = game?.writers.find((writer) => writer.turn);
const CurrentUserisActiveWriter= activeWriter?.id===Number(userId);
const isPlayer1Active = !!game?.writers[0]?.turn;
const isPlayer2Active = !!game?.writers[1]?.turn;
const isUserPlayer1 = game?.writers?.[0]?.id === Number(userId);
const isUserPlayer2 = game?.writers?.[1]?.id === Number(userId);
const isJudge = !isUserPlayer1 && !isUserPlayer2;
const [declareModalVisible, setDeclareModalVisible] = useState(false);
const [resultModalVisible, setResultModalVisible] = useState(false);
const [resultGame, setResultGame] = useState<Game | null>(null);
const votingInProgress = useRef(false);
const [gameEnded, setGameEnded] = useState(false);
const [rulesVisible, setRulesVisible] = useState(false);

const handleSubmit = async (player: 1 | 2, input: string): Promise<void> => {
  const prettyinput=input.trim();
  try {
    await apiService.post<Game>(`/games/${gameid}/input`,{ player: player, input: prettyinput },token);

    const quote = game?.writers[player - 1]?.quote;
    if (quote && prettyinput.toLowerCase().includes(quote.toLowerCase())) {
        if (player === 1) setQuoteUsedP1(true);
        else setQuoteUsedP2(true);
    }

    if (player===2){
      setTwoInput("");
    }
    else{
      setOneInput("")
    }
  } catch (error: unknown) {
      if (error instanceof Error) {
        const appError = error as ApplicationError;
        if(appError.status===403){
           alert("It's not your turn");
        }else {
          alert(`Saving player input failed, pls try again`);
          console.log("Saving Player input failed", error);
        }

      }
    };
}


const handleExit=async() : Promise<void> =>{
  try{
    await apiService.post(`/games/${gameid}/leave`, {}, token);
    router.push("/");
  }catch (error){
    console.log("Closing game failed", error);
    alert("Exit failed, pls try again");
  }

}

const [quotedP1, setQuotedP1] = useState(false);
const [quotedP2, setQuotedP2] = useState(false);

const handleQuoteFetch = async (player: 1 | 2): Promise<void> => {
    try {
        await apiService.get<Game>(`/games/${gameid}/quotes?player=${player}`, token);
        if (player === 1) {
            setQuotedP1(true);
            }
        else {
            setQuotedP2(true);
            }
    } catch (error) {
        message.error("Failed to fetch quote.");
    }
};

  useEffect(() => {
    if (!token || !gameid) return;

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const handleGameUpdate = (event: MessageEvent) => {
      const latestGame: Game = JSON.parse(event.data);

      setGame(latestGame);
      setStoryyText(latestGame.story.storyText);

      if (latestGame.story.hasWinner || latestGame.phase === "FINISHED") {
        setResultModalVisible(prev => {
          if (!prev) {
            setResultGame(latestGame);
            return true;
          }
          return prev;
        });
      }
    };

    const handleGameDeleted = () => {
      setResultModalVisible(prev => {
        if (!prev && !votingInProgress.current) {
          setGameEnded(true);
        }
        return prev;
      });
    };

    const connect = async () => {
      let initialGame: Game | null = null;
      try {
        initialGame = await apiService.get<Game>(`/games/${gameid}`, token);
      } catch (error) {
        const appError = error as ApplicationError;
        if (appError.status === 401 || appError.status === 403) {
          message.error("Session expired. Please log in again.");
          clearToken();
          router.push("/login");
          return;
        }
        if (appError.status === 404) {
          message.error("Game no longer exists.");
          router.push("/");
          return;
        }

      }
       if (initialGame) {
          setGame(initialGame);
          setStoryyText(initialGame.story.storyText);
          setGenre1(initialGame.writers[0]?.genre ?? "Genre");
          setGenre2(initialGame.writers[1]?.genre ?? "Genre");
        }
      const streamUrl = `${getApiDomain()}/games/${gameid}/stream?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = async () => {
        reconnectAttempts = 0;
        try {
          const currentGame = await apiService.get<Game>(`/games/${gameid}`, token);
          setGame(currentGame);
          setStoryyText(currentGame.story.storyText);
          if (currentGame.story.hasWinner) {
            setResultModalVisible(prev => {
              if (!prev) {
                setResultGame(currentGame);
                return true;
              }
              return prev;
            });
          }
        } catch {

        }
      };

      eventSource.addEventListener("game-update", handleGameUpdate);
      eventSource.addEventListener("game-deleted", handleGameDeleted);

      eventSource.onerror = () => {
        reconnectAttempts++;

        if (
          eventSource?.readyState === EventSource.CLOSED ||
          reconnectAttempts >= maxReconnectAttempts
        ) {
          eventSource?.close();
          message.error("Lost connection to game. Please reload.");
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, [token, gameid]);

  // Polling fallback
  useEffect(() => {
    if (!token || !gameid) return;
    if (gameEnded) return;

    const interval = setInterval(async () => {
      try {
        const latestGame = await apiService.get<Game>(`/games/${gameid}`, token);
        setGame(latestGame);
        setStoryyText(latestGame.story.storyText);
        if (latestGame.story.hasWinner) {
          setResultModalVisible(prev => {
            if (!prev) {
              setResultGame(latestGame);
              return true;
            }
            return prev;
          });
        }
      } catch (error) {
        const appError = error as ApplicationError;
        if (appError?.status === 404) {
          setResultModalVisible(prev => {
            if (!prev && !votingInProgress.current) {
              setGameEnded(true);
            }
            return prev;
          });
        }

      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token, gameid, gameEnded]);


  useEffect(() => {
    if (!token || !gameid ) return;
    if (!isUserPlayer1 || !isPlayer1Active) return;

    const timeout = setTimeout(() => {
      apiService.post<Game>(
        `/games/${gameid}/draft`,
        { player: 1, input: OneInput },
        token
      ).catch((error) => {
        console.log("Saving Player 1 draft failed", error);
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [OneInput, token, gameid, isUserPlayer1, isPlayer1Active, apiService]);

  useEffect(() => {
    if (!token || !gameid ) return;
    if (!isUserPlayer2 || !isPlayer2Active) return;

    const timeout = setTimeout(() => {
      apiService.post<Game>(
        `/games/${gameid}/draft`,
        { player: 2, input: TwoInput },
        token
      ).catch((error) => {
        console.log("Saving Player 2 draft failed", error);
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [TwoInput, token, gameid, isUserPlayer2, isPlayer2Active, apiService]);

  useEffect(() => {
    if (isUserPlayer1 && !isPlayer1Active) {
      setOneInput("");
    }
  }, [isUserPlayer1, isPlayer1Active]);

  useEffect(() => {
    if (isUserPlayer2 && !isPlayer2Active) {
      setTwoInput("");
    }
  }, [isUserPlayer2, isPlayer2Active]);



  useEffect(() => {
  if (!gameEnded) return;

  message.error("Game ended because a writer or judge left or disconnected.");

  const timeout = setTimeout(() => {
    router.push("/");
  }, 3000);

  return () => clearTimeout(timeout);
}, [gameEnded, router]);

useEffect(() => {
  if (!starting) return;
  if (startCountdown <= 0) {
    const id = setTimeout(() => setStarting(false), 1000);
    return () => clearTimeout(id);
  }
  const id = setTimeout(() => setStartCountdown(x => x - 1), 1000);
  return () => clearTimeout(id);
}, [startCountdown, starting]);

useEffect(() => {
  if (!game?.turnStartedAt) return;
   if (starting) return;

  const updateCountdown = () => {
    const elapsed = Math.floor((Date.now() - game.turnStartedAt) / 1000);
    const remaining = Math.max(0, game.timer - elapsed);
    setCountdown(remaining);
  };

  updateCountdown();
  const id = setInterval(updateCountdown, 1000);

  return () => clearInterval(id);
}, [game?.turnStartedAt, game?.timer, starting]);

const handleVoteWinner = async (writerId: number): Promise<void> => {
  votingInProgress.current = true;
  setDeclareModalVisible(false);
  console.log("writers:", game?.writers);
  console.log("writer[0] id:", game?.writers[0]?.id);
  console.log("writer[1] id:", game?.writers[1]?.id);
  try {
    const response = await apiService.post<Game>(
      `/games/${gameid}/vote`,
      writerId,
      token
    );
    setGame(response);
    setResultGame(response);
    setResultModalVisible(true);
  } catch (error) {
    votingInProgress.current = false;
    console.error("Declare winner failed", error);
    message.error("Failed to declare winner, please try again.");
  }
};


const autoVoteFired = useRef(false);

useEffect(() => {
  if (!game || !isJudge) return;
  if (game.phase !== "EVALUATION") return;
  if (autoVoteFired.current) return;
  if (!game.turnStartedAt || !game.timer) return;

  const elapsed = Math.floor((Date.now() - game.turnStartedAt) / 1000);
  if (elapsed < game.timer) return;

  autoVoteFired.current = true;
  handleVoteWinner(-1);
}, [countdown, game, isJudge]);


useEffect(() => {
  if (!resultModalVisible) return;

  const timeout = setTimeout(async () => {
    try {
      await apiService.delete(`/games/${gameid}`, {}, token);
    } catch (e) {

    }
    setResultModalVisible(false);
    router.push("/");
  }, 20000);

  return () => clearTimeout(timeout);
}, [resultModalVisible, router]);



if (!game) {
  return (
    <div className="gameStarryBg" style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--gold)", fontFamily: "var(--font-cinzel), serif",
      fontSize: 24, letterSpacing: 4,
    }}>
      Loading Game...
    </div>
  );
}

const quoteIncorporatedP1 = !!(game.writers[0]?.quote && wholeStoryText.toLowerCase().includes(game.writers[0].quote.toLowerCase()));
const quoteIncorporatedP2 = !!(game.writers[1]?.quote && wholeStoryText.toLowerCase().includes(game.writers[1].quote.toLowerCase()));

// Format timer like "01:24"
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

return (
  <div
    className="gameStarryBg"
    style={{
      color: "#ffffff",
      padding: "32px 28px 28px 28px",
      fontFamily: "var(--font-cinzel), serif",
      overflowX: "hidden",
      overflowY: "auto",
      boxSizing: "border-box",
    }}
  >
    {/* PRE-GAME COUNTDOWN OVERLAY */}
    {starting && (
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(5,8,25,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        fontFamily: "var(--font-cinzel), serif",
      }}>
        {startCountdown === 0 ? (
          <div style={{ fontSize: 64, fontWeight: "bold", letterSpacing: 6, color: "var(--gold)" }}>
            Game Start!
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, letterSpacing: 3, color: "rgba(212,168,87,0.5)", textTransform: "uppercase" }}>
              You are a
            </div>
            <div style={{ fontSize: 36, fontWeight: "bold", letterSpacing: 4, color: "var(--gold)" }}>
              {isJudge ? "Judge" : "Writer"}
            </div>
            {game?.story?.objective && (
              <div style={{ marginTop: 8, fontSize: 15, letterSpacing: 1, color: "#e8e4d8" }}>
                Story&apos;s theme: <span style={{ color: "var(--gold-bright)", fontWeight: "bold" }}>{game.story.objective}</span>
              </div>
            )}
            {!isJudge && (
              <div style={{ fontSize: 15, color: "#e8e4d8", letterSpacing: 1 }}>
                Your Secret Genre: <span style={{ color: "var(--gold-bright)", fontWeight: "bold" }}>{isUserPlayer1 ? writer1Genre : writer2Genre}</span>
              </div>
            )}
            <div style={{ fontSize: 100, fontWeight: "bold", lineHeight: 1, marginTop: 16, color: "var(--gold)" }}>
              {startCountdown}
            </div>
          </>
        )}
      </div>
    )}

    {/* MAIN CONTENT WRAPPER */}
    <div style={{
      maxWidth: 1500,
      width: "100%",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 18,
      boxSizing: "border-box",
    }}>

      {/* ===== TOP ROW: Exit | Game Room title | Help/Profile ===== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr 180px",
        alignItems: "center",
        gap: 16,
        width: "100%",
      }}>
        {/* Exit */}
        <button onClick={handleExit} className="cornerButton">
          ← EXIT
        </button>

        {/* Center: Game Room title + Live Story subtitle + status pills */}
        <div style={{ textAlign: "center" }}>
          <h1 className="gameRoomTitle">GAME ROOM</h1>
          <div className="liveStorySubtitle">✦ LIVE STORY ✦</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 10 }}>
            <span className="statusPill">
              👥 {game.writers.length + game.judges.length} / 4
            </span>
            <span className="statusPill">
              ⏱ {game.phase === "EVALUATION" || (isPlayer1Active || isPlayer2Active) ? formatTime(countdown) : "--:--"}
            </span>
          </div>
        </div>

        {/* Help/Profile */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setRulesVisible(true)} className="cornerButton">
            HELP →
          </button>
        </div>
      </div>

      {/* ===== STORY OBJECTIVE RIBBON ===== */}
      {game.story.objective && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <div className="storyObjectiveRibbon">
            STORY OBJECTIVE: {game.story.objective}
          </div>
        </div>
      )}

      {/* ===== MAIN AREA: 3 panels ===== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1fr)",
        gap: 8,
        alignItems: "start",
        width: "100%",
        marginTop: 4,
      }}>

        {/* ============== PLAYER 1 PANEL (LEFT) ============== */}
        <div
          className="panelLeft"
          style={{
            ...(isPlayer1Active && game.phase !== "EVALUATION" && !resultModalVisible ? activePlayerStyle : inactivePlayerStyle),
            aspectRatio: "1 / 1.05",
            padding: "60px 70px 70px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          {/* Player name */}
          <div style={{ textAlign: "center" }}>
            <div className="playerNameTitle">
              {(game.writers[0]?.username ?? "Player 1").toUpperCase()}
            </div>
            <div className="playerSubtitle">✦ PLAYER 1 ✦</div>
          </div>

          {/* YOUR RESPONSE label */}
          <div className="sectionLabel" style={{ marginTop: 8 }}>YOUR RESPONSE</div>

          {/* Response textarea */}
          <div className="goldInput" style={{ flex: 1, minHeight: 0 }}>
            <TextArea
              maxLength={2000}
              showCount
              disabled={!isUserPlayer1 || !game.writers[0].turn || game.phase === "EVALUATION"}
              value={isUserPlayer1 ? OneInput : (game.writers[0]?.text ?? "")}
              onChange={(e) => setOneInput(e.target.value)}
              placeholder="Enter your next part of the story..."
              style={{ height: "100%", minHeight: 110, resize: "none" }}
            />
          </div>

          {/* Genre + Characters row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            alignItems: "center",
          }}>
            <div>
              <div className="sectionLabel" style={{ marginBottom: 4 }}>GENRE</div>
              <Tooltip title={!isUserPlayer2 ? (game.writers[0]?.genreDescription ?? "") : ""}>
                <div className="goldInput" style={{
                  padding: "6px 12px",
                  borderRadius: 16,
                  textAlign: "center",
                  color: "var(--gold)",
                  fontSize: 14,
                  letterSpacing: 1,
                }}>
                  {isUserPlayer1
                    ? writer1Genre
                    : isUserPlayer2
                    ? "Genre"
                    : writer1Genre}
                </div>
              </Tooltip>
            </div>
            <div>
              <div className="sectionLabel" style={{ marginBottom: 4 }}>CHARACTERS</div>
              <div style={{
                color: "var(--gold-soft)",
                fontSize: 13,
                textAlign: "center",
                padding: "6px 12px",
              }}>
                {(isUserPlayer1 ? OneInput : game.writers[0]?.text ?? "").length} / 2000
              </div>
            </div>
          </div>

          {/* YOUR QUOTE */}
          {(isUserPlayer1 || (!isUserPlayer1 && !isUserPlayer2)) && (
            <>
              <div className="sectionLabel">YOUR QUOTE</div>
              <div className="goldInput">
                <TextArea
                  placeholder="Enter a short quote from your response..."
                  value={game.writers[0]?.quote ?? ""}
                  readOnly
                  style={{ minHeight: 36, height: 36, resize: "none" }}
                />
              </div>
              {game.writers[0]?.quote && !quoteUsedP1 && !quoteIncorporatedP1 && !isUserPlayer2 && (() => {
                const assigned = game.writers[0].quoteAssignedRound ?? game.currentRound;
                const turnsLeft = 2 - Math.ceil((game.currentRound - assigned) / 2);
                const expired = turnsLeft <= 0;
                return (
                  <div style={{ fontSize: 11, color: expired ? "#e74c3c" : "var(--gold-bright)", textAlign: "center" }}>
                    {expired ? "Quote window expired!" : `Incorporate in your next ${turnsLeft} turn${turnsLeft !== 1 ? "s" : ""}`}
                  </div>
                );
              })()}
              {(quoteUsedP1 || quoteIncorporatedP1) && !isUserPlayer2 && (
                <div style={{ fontSize: 11, color: "#7fdc9b", textAlign: "center" }}>Quote incorporated!</div>
              )}
            </>
          )}

          {/* Submit button */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            <Button
              onClick={() => handleSubmit(1, OneInput)}
              disabled={!isUserPlayer1 || !game.writers[0].turn || game.phase === "EVALUATION"}
              className="goldButton"
              style={{
                width: 140,
                opacity: !isUserPlayer1 || !game.writers[0].turn || game.phase === "EVALUATION" ? 0.4 : 1,
              }}
            >
              SUBMIT
            </Button>
          </div>
        </div>

        {/* ============== JUDGE / ACTIVE STORY PANEL (MIDDLE) ============== */}
        <div
          className="panelMiddle"
          style={{
            aspectRatio: "1 / 0.92",
            padding: "70px 80px 70px 80px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          {/* Story content */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 4px",
            minHeight: 0,
          }}>
            <div className="storyText">
              {wholeStoryText || (
                <span style={{ color: "rgba(245,230,200,0.4)", fontStyle: "italic" }}>
                  The story will appear here as the writers contribute...
                </span>
              )}
            </div>
          </div>

          {/* Judge name */}
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <div className="goldText" style={{
              fontSize: 18,
              letterSpacing: 3,
              color: "var(--gold)",
            }}>
              {(game.judges[0]?.username ?? "Judge").toUpperCase()}
            </div>
            <div className="playerSubtitle">JUDGE</div>
          </div>

          {/* Phase status */}
          <div style={{
            textAlign: "center",
            fontSize: 13,
            letterSpacing: 3,
            color: game.phase === "EVALUATION" ? "#e08a8a"
              : game.phase === "TIEBREAKER" ? "#c9a3e0"
              : "var(--gold-soft)",
          }}>
            {game.phase === "EVALUATION"
              ? `THE JUDGE MUST DECIDE! ${countdown}s`
              : game.phase === "TIEBREAKER"
              ? "TIEBREAKER PHASE"
              : "THE WRITERS ARE CREATING THE STORY."}
          </div>
        </div>

        {/* ============== PLAYER 2 PANEL (RIGHT) ============== */}
        <div
          className="panelRight"
          style={{
            ...(isPlayer2Active && game.phase !== "EVALUATION" && !resultModalVisible ? activePlayerStyle : inactivePlayerStyle),
            aspectRatio: "1 / 1.05",
            padding: "60px 60px 70px 70px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 0,
          }}
        >
          {/* Player name */}
          <div style={{ textAlign: "center" }}>
            <div className="playerNameTitle">
              {(game.writers[1]?.username ?? "Player 2").toUpperCase()}
            </div>
            <div className="playerSubtitle">✦ PLAYER 2 ✦</div>
          </div>

          <div className="sectionLabel" style={{ marginTop: 8 }}>YOUR RESPONSE</div>

          <div className="goldInput" style={{ flex: 1, minHeight: 0 }}>
            <TextArea
              maxLength={2000}
              showCount
              disabled={!isUserPlayer2 || !game.writers[1].turn || game.phase === "EVALUATION"}
              value={isUserPlayer2 ? TwoInput : (game.writers[1]?.text ?? "")}
              onChange={(e) => setTwoInput(e.target.value)}
              placeholder="Enter your next part of the story..."
              style={{ height: "100%", minHeight: 110, resize: "none" }}
            />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            alignItems: "center",
          }}>
            <div>
              <div className="sectionLabel" style={{ marginBottom: 4 }}>GENRE</div>
              <Tooltip title={!isUserPlayer1 ? (game.writers[1]?.genreDescription ?? "") : ""}>
                <div className="goldInput" style={{
                  padding: "6px 12px",
                  borderRadius: 16,
                  textAlign: "center",
                  color: "var(--gold)",
                  fontSize: 14,
                  letterSpacing: 1,
                }}>
                  {isUserPlayer2
                    ? writer2Genre
                    : isUserPlayer1
                    ? "Genre"
                    : writer2Genre}
                </div>
              </Tooltip>
            </div>
            <div>
              <div className="sectionLabel" style={{ marginBottom: 4 }}>CHARACTERS</div>
              <div style={{
                color: "var(--gold-soft)",
                fontSize: 13,
                textAlign: "center",
                padding: "6px 12px",
              }}>
                {(isUserPlayer2 ? TwoInput : game.writers[1]?.text ?? "").length} / 2000
              </div>
            </div>
          </div>

          {(isUserPlayer2 || (!isUserPlayer1 && !isUserPlayer2)) && (
            <>
              <div className="sectionLabel">YOUR QUOTE</div>
              <div className="goldInput">
                <TextArea
                  placeholder="Enter a short quote from your response..."
                  value={game.writers[1]?.quote ?? ""}
                  readOnly
                  style={{ minHeight: 36, height: 36, resize: "none" }}
                />
              </div>
              {game.writers[1]?.quote && !quoteUsedP2 && !quoteIncorporatedP2 && !isUserPlayer1 && (() => {
                const assigned = game.writers[1].quoteAssignedRound ?? game.currentRound;
                const turnsLeft = 2 - Math.ceil((game.currentRound - assigned) / 2);
                const expired = turnsLeft <= 0;
                return (
                  <div style={{ fontSize: 11, color: expired ? "#e74c3c" : "var(--gold-bright)", textAlign: "center" }}>
                    {expired ? "Quote window expired!" : `Incorporate in your next ${turnsLeft} turn${turnsLeft !== 1 ? "s" : ""}`}
                  </div>
                );
              })()}
              {(quoteUsedP2 || quoteIncorporatedP2) && !isUserPlayer1 && (
                <div style={{ fontSize: 11, color: "#7fdc9b", textAlign: "center" }}>Quote incorporated!</div>
              )}
            </>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            <Button
              onClick={() => handleSubmit(2, TwoInput)}
              disabled={!isUserPlayer2 || !game.writers[1].turn || game.phase === "EVALUATION"}
              className="goldButton"
              style={{
                width: 140,
                opacity: !isUserPlayer2 || !game.writers[1].turn || game.phase === "EVALUATION" ? 0.4 : 1,
              }}
            >
              SUBMIT
            </Button>
          </div>
        </div>
      </div>

      {/* ===== FOOTER PILL BAR: Quote P1 | Declare | Quote P2 ===== */}
      {isJudge && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 0,
          marginTop: 4,
        }}>
          <button
            disabled={quotedP1}
            onClick={() => handleQuoteFetch(1)}
            className="footerPill"
            style={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: "none",
            }}
          >
            ✒ QUOTE P1
          </button>
          <button
            disabled={!isJudge || game.phase !== "EVALUATION"}
            onClick={() => setDeclareModalVisible(true)}
            className="footerPill footerPillCenter"
            style={{
              borderRadius: 0,
              padding: "14px 36px",
            }}
          >
            ♛ DECLARE
          </button>
          <button
            disabled={quotedP2}
            onClick={() => handleQuoteFetch(2)}
            className="footerPill"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: "none",
            }}
          >
            QUOTE P2 ✒
          </button>
        </div>
      )}

      {/* Phase status footer */}
      <div style={{
        textAlign: "center",
        fontSize: 13,
        letterSpacing: 4,
        color: "var(--gold-soft)",
        marginTop: 4,
        textTransform: "uppercase",
      }}>
        ✦ {game.phase === "EVALUATION"
          ? `THE JUDGE MUST DECIDE! ${countdown}s REMAINING`
          : "THE WRITERS ARE CREATING THE STORY."} ✦
      </div>
    </div>

    {/* ====================== MODALS ====================== */}
    <Modal
      open={declareModalVisible}
      footer={null}
      closable={true}
      onCancel={() => setDeclareModalVisible(false)}
      centered
      width={420}
      styles={{
        body: {
          background: "linear-gradient(135deg, #0f1430 0%, #1a2042 100%)",
          border: "1px solid rgba(212,168,87,0.5)",
          borderRadius: 8,
          color: "#fff",
          fontFamily: "var(--font-cinzel), serif",
          padding: "32px 24px",
        }
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "var(--gold)", letterSpacing: 2 }}>
          Who is the winner?
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Button
            onClick={() => handleVoteWinner(game?.writers[0]?.id ?? -1)}
            className="goldButton"
            style={{ height: 48, width: 150 }}
          >
            {game?.writers[0]?.username ?? "Player 1"}
          </Button>
          <Button
            onClick={() => handleVoteWinner(game?.writers[1]?.id ?? -1)}
            className="goldButton"
            style={{ height: 48, width: 150 }}
          >
            {game?.writers[1]?.username ?? "Player 2"}
          </Button>
        </div>
      </div>
    </Modal>

    <Modal
      open={resultModalVisible}
      footer={null}
      closable={false}
      centered
      width={500}
      styles={{
        body: {
          background: "linear-gradient(135deg, #0f1430 0%, #1a2042 100%)",
          border: "1px solid rgba(212,168,87,0.5)",
          borderRadius: 8,
          color: "#fff",
          fontFamily: "var(--font-cinzel), serif",
          padding: "40px 24px",
        }
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ fontSize: 26, fontWeight: "bold", color: "var(--gold)", letterSpacing: 2, textAlign: "center" }}>
          {resultGame?.story.hasWinner
            ? `Winner is ${resultGame.story.winnerUsername ?? "unknown"}!`
            : "Winner undefined"
          }
        </div>
        {resultGame?.story.hasWinner && (
          <div style={{ fontSize: 16, color: "rgba(245,230,200,0.7)" }}>
            Genre: {resultGame.story.winGenre ?? "—"}
          </div>
        )}
        <div style={{ fontSize: 14, color: "rgba(245,230,200,0.5)", marginTop: 8 }}>
          Redirecting to home in 20 seconds...
        </div>
      </div>
    </Modal>

    {/* RULES MODAL */}
    {rulesVisible && (
      <div
        onClick={() => setRulesVisible(false)}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5,8,25,0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "linear-gradient(135deg, #0f1430 0%, #1a2042 100%)",
            border: "1px solid rgba(212,168,87,0.5)",
            borderRadius: 8,
            padding: "36px 40px",
            maxWidth: 540,
            width: "90%",
            color: "#f5e6c8",
            fontFamily: "var(--font-cinzel), serif",
            position: "relative",
          }}
        >
          <Button
            onClick={() => setRulesVisible(false)}
            style={{
              position: "absolute",
              top: 14, right: 14,
              ["--btn-bg" as string]: "transparent",
              border: "none",
              color: "var(--gold)",
              fontSize: 20,
            }}
          >✕</Button>

          <div style={{
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 20,
            textAlign: "center",
            color: "var(--gold)",
            letterSpacing: 3,
          }}>
            ✦ HOW TO PLAY ✦
          </div>

          {isJudge ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <RuleItem icon="⚖️" text="You are the Judge. You observe the story but do not write." />
              <RuleItem icon="💬" text="Assign a quote to either writer via Quote P1 / Quote P2. Each writer must incorporate it within 2 of their own turns." />
              <RuleItem icon="🚫" text="You can only assign one quote per writer." />
              <RuleItem icon="🏆" text="After 20 rounds the game enters Evaluation. Use the Declare button to pick the winner — the writer whose genre best shaped the story." />
              <RuleItem icon="⏱️" text="If you don't vote before the timer expires, a tie is recorded automatically." />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <RuleItem icon="✍️" text="Writers alternate turns building a shared story. Steer it toward your secret genre." />
              <RuleItem icon="🎭" text="Your genre is shown in your genre field, hover onto it to see the full description. The opponent does not know your genre!" />
              <RuleItem icon="💬" text="The Judge may assign you a quote. Weave it into the story within 2 of your own turns or face a penalty." />
              <RuleItem icon="⏱️" text="Each turn has a timer. If it expires your turn is skipped. Submit before time runs out." />
              <RuleItem icon="🏆" text="After 20 rounds the Judge decides whose genre dominated the story. Write convincingly!" />
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "rgba(245,230,200,0.3)" }}>
            Click anywhere outside to close
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default GamePage;