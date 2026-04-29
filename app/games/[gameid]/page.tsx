"use client";

import { useRouter, useParams } from "next/navigation";
import { Button, Input, message, Modal, Tooltip } from "antd";
import { Game } from "@/types/game";
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

  const { TextArea } = Input;

  const [countdown, setCountdown] = useState<number>(0);
  const [game, setGame] = useState<Game | null>(null);
  const [writer1Genre, setGenre1] = useState<string>("Genre");
  const [writer2Genre, setGenre2] = useState<string>("Genre");
  const [quoteUsedP1, setQuoteUsedP1] = useState(false);
  const [quoteUsedP2, setQuoteUsedP2] = useState(false);
  const [wholeStoryText, setStoryyText] = useState<string>("");
  const [TwoInput, setTwoInput] = useState("");
  const [OneInput, setOneInput] = useState("");
  const [declareModalVisible, setDeclareModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [resultGame, setResultGame] = useState<Game | null>(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [quotedP1, setQuotedP1] = useState(false);
  const [quotedP2, setQuotedP2] = useState(false);
  const [starting, setStarting] = useState(true);
  const [startCountdown, setStartCountdown] = useState(5);
  const [frozenBullaugeSide, setFrozenBullaugeSide] = useState<"left" | "right" | null>(null);

  const votingInProgress = useRef(false);
  const autoVoteFired = useRef(false);

  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const isPlayer1Active = !!game?.writers[0]?.turn;
  const isPlayer2Active = !!game?.writers[1]?.turn;
  const isUserPlayer1 = game?.writers?.[0]?.id === Number(userId);
  const isUserPlayer2 = game?.writers?.[1]?.id === Number(userId);
  const isJudge = !isUserPlayer1 && !isUserPlayer2;

  useEffect(() => {
    if (!game) return;
    if (game.phase === "EVALUATION") return;

    if (isPlayer1Active && !isPlayer2Active) setFrozenBullaugeSide("right");
    else if (isPlayer2Active && !isPlayer1Active) setFrozenBullaugeSide("left");
  }, [isPlayer1Active, isPlayer2Active, game?.phase, game]);

  let showBullaugeOnLeft = false;
  let showBullaugeOnRight = false;

  if (game) {
    if (game.phase === "EVALUATION") {
      showBullaugeOnLeft = frozenBullaugeSide === "left";
      showBullaugeOnRight = frozenBullaugeSide === "right";
    } else {
      showBullaugeOnLeft = !isPlayer1Active && isPlayer2Active;
      showBullaugeOnRight = !isPlayer2Active && isPlayer1Active;
    }
  }

  const RuleItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: "rgba(245,230,200,0.85)" }}>{text}</span>
    </div>
  );

  const handleSubmit = async (player: 1 | 2, input: string): Promise<void> => {
    const prettyinput = input.trim();

    try {
      await apiService.post<Game>(
        `/games/${gameid}/input`,
        { player, input: prettyinput },
        token
      );

      const quote = game?.writers[player - 1]?.quote;

      if (quote && prettyinput.toLowerCase().includes(quote.toLowerCase())) {
        if (player === 1) setQuoteUsedP1(true);
        else setQuoteUsedP2(true);
      }

      if (player === 2) setTwoInput("");
      else setOneInput("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        const appError = error as ApplicationError;

        if (appError.status === 403) {
          alert("It's not your turn");
        } else {
          alert("Saving player input failed, pls try again");
          console.log("Saving Player input failed", error);
        }
      }
    }
  };

  const handleExit = async (): Promise<void> => {
    try {
      await apiService.post(`/games/${gameid}/leave`, {}, token);
      router.push("/");
    } catch (error) {
      console.log("Closing game failed", error);
      alert("Exit failed, pls try again");
    }
  };

  const handleQuoteFetch = async (player: 1 | 2): Promise<void> => {
    try {
      await apiService.get<Game>(`/games/${gameid}/quotes?player=${player}`, token);

      if (player === 1) setQuotedP1(true);
      else setQuotedP2(true);
    } catch {
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
        setResultModalVisible((prev) => {
          if (!prev) {
            setResultGame(latestGame);
            return true;
          }
          return prev;
        });
      }
    };

    const handleGameDeleted = () => {
      setResultModalVisible((prev) => {
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
            setResultModalVisible((prev) => {
              if (!prev) {
                setResultGame(currentGame);
                return true;
              }
              return prev;
            });
          }
        } catch {
          // ignore reconnect fetch errors
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
  }, [token, gameid, apiService, clearToken, router]);

  useEffect(() => {
    if (!token || !gameid) return;
    if (gameEnded) return;

    const interval = setInterval(async () => {
      try {
        const latestGame = await apiService.get<Game>(`/games/${gameid}`, token);
        setGame(latestGame);
        setStoryyText(latestGame.story.storyText);

        if (latestGame.story.hasWinner) {
          setResultModalVisible((prev) => {
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
          setResultModalVisible((prev) => {
            if (!prev && !votingInProgress.current) {
              setGameEnded(true);
            }
            return prev;
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token, gameid, gameEnded, apiService]);

  useEffect(() => {
    if (!token || !gameid) return;
    if (!isUserPlayer1 || !isPlayer1Active) return;

    const timeout = setTimeout(() => {
      apiService
        .post<Game>(`/games/${gameid}/draft`, { player: 1, input: OneInput }, token)
        .catch((error) => {
          console.log("Saving Player 1 draft failed", error);
        });
    }, 100);

    return () => clearTimeout(timeout);
  }, [OneInput, token, gameid, isUserPlayer1, isPlayer1Active]);

  useEffect(() => {
    if (!token || !gameid) return;
    if (!isUserPlayer2 || !isPlayer2Active) return;

    const timeout = setTimeout(() => {
      apiService
        .post<Game>(`/games/${gameid}/draft`, { player: 2, input: TwoInput }, token)
        .catch((error) => {
          console.log("Saving Player 2 draft failed", error);
        });
    }, 100);

    return () => clearTimeout(timeout);
  }, [TwoInput, token, gameid, isUserPlayer2, isPlayer2Active]);

  useEffect(() => {
    if (isUserPlayer1 && !isPlayer1Active) setOneInput("");
  }, [isUserPlayer1, isPlayer1Active]);

  useEffect(() => {
    if (isUserPlayer2 && !isPlayer2Active) setTwoInput("");
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

    const id = setTimeout(() => setStartCountdown((x) => x - 1), 1000);
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

    try {
      const response = await apiService.post<Game>(`/games/${gameid}/vote`, writerId, token);
      setGame(response);
      setResultGame(response);
      setResultModalVisible(true);
    } catch (error) {
      votingInProgress.current = false;
      console.error("Declare winner failed", error);
      message.error("Failed to declare winner, please try again.");
    }
  };

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
      } catch {
        // ignore delete errors before redirect
      }

      setResultModalVisible(false);
      router.push("/");
    }, 20000);

    return () => clearTimeout(timeout);
  }, [resultModalVisible, router, gameid, token]);

  if (!game) {
    return (
      <div
        className="gameStarryBg"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--gold)",
          fontFamily: "var(--font-cinzel), serif",
          fontSize: 24,
          letterSpacing: 4,
        }}
      >
        Loading Game...
      </div>
    );
  }

  const quoteIncorporatedP1 = !!(
    game.writers[0]?.quote &&
    wholeStoryText.toLowerCase().includes(game.writers[0].quote.toLowerCase())
  );

  const quoteIncorporatedP2 = !!(
    game.writers[1]?.quote &&
    wholeStoryText.toLowerCase().includes(game.writers[1].quote.toLowerCase())
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const renderPlayerSlot = (playerIdx: 0 | 1) => {
    const writer = game.writers[playerIdx];
    const isUserThisPlayer = playerIdx === 0 ? isUserPlayer1 : isUserPlayer2;
    const isThisPlayerActive = !!writer?.turn;
    const playerNum = (playerIdx + 1) as 1 | 2;
    const draftValue = playerIdx === 0 ? OneInput : TwoInput;
    const setDraftValue = playerIdx === 0 ? setOneInput : setTwoInput;
    const genreVal = playerIdx === 0 ? writer1Genre : writer2Genre;
    const otherUserIsThisPlayer = playerIdx === 0 ? isUserPlayer2 : isUserPlayer1;
    const quoteUsed = playerIdx === 0 ? quoteUsedP1 : quoteUsedP2;
    const quoteIncorporated = playerIdx === 0 ? quoteIncorporatedP1 : quoteIncorporatedP2;
    const responseValue = isUserThisPlayer ? draftValue : writer?.text ?? "";

    return (
      <>
        <div style={{ flexShrink: 0, marginBottom: 4 }}>
          <div className="playerNameTitle">
            {(writer?.username ?? `Player ${playerNum}`).toUpperCase()}
          </div>
        </div>

        <div className="sectionLabel" style={{ marginBottom: 2, flexShrink: 0 }}>
          YOUR RESPONSE
        </div>

        <div className="goldInput goldInputFlex" style={{ flex: 1, minHeight: 120 }}>
          <TextArea
            maxLength={2000}
            showCount
            disabled={!isUserThisPlayer || !isThisPlayerActive || game.phase === "EVALUATION"}
            value={responseValue}
            onChange={(e) => setDraftValue(e.target.value)}
            placeholder="Enter your next part of the story..."
            style={{ height: "100%", resize: "none" }}
          />
        </div>

        <div style={{ marginTop: 6, flexShrink: 0 }}>
          <div className="sectionLabel" style={{ marginBottom: 2 }}>
            GENRE
          </div>

          <Tooltip title={!otherUserIsThisPlayer ? writer?.genreDescription ?? "" : ""}>
            <div className="genreBox">
              {isUserThisPlayer ? genreVal : otherUserIsThisPlayer ? "Genre" : genreVal}
            </div>
          </Tooltip>
        </div>

        <div style={{ marginTop: 6, flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span className="sectionLabel">YOUR QUOTE</span>

            {isJudge && (
              <button
                onClick={() => handleQuoteFetch(playerNum)}
                disabled={playerNum === 1 ? quotedP1 : quotedP2}
                className="assignQuoteButton"
                title="Assign a quote from the story to this player"
              >
                ✒ Assign
              </button>
            )}
          </div>

          <div className="goldInput">
            <TextArea
              placeholder="Quote will appear here..."
              value={writer?.quote ?? ""}
              readOnly
              rows={3}
              style={{ fontSize: 12, resize: "none" }}
            />
          </div>

          {writer?.quote &&
            !quoteUsed &&
            !quoteIncorporated &&
            isUserThisPlayer &&
            (() => {
              const assigned = writer.quoteAssignedRound ?? game.currentRound;
              const turnsLeft = 2 - Math.ceil((game.currentRound - assigned) / 2);
              const expired = turnsLeft <= 0;

              return (
                <div
                  style={{
                    fontSize: 10,
                    color: expired ? "#e74c3c" : "var(--gold-bright)",
                    textAlign: "center",
                    marginTop: 3,
                  }}
                >
                  {expired ? "Quote expired!" : `Use in next ${turnsLeft} turn${turnsLeft !== 1 ? "s" : ""}`}
                </div>
              );
            })()}

          {(quoteUsed || quoteIncorporated) && isUserThisPlayer && (
            <div
              style={{
                fontSize: 10,
                color: "#7fdc9b",
                textAlign: "center",
                marginTop: 3,
              }}
            >
              Quote incorporated!
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 16,
            flexShrink: 0,
          }}
        >
          <Button
            onClick={() => {console.log("clicked"); handleSubmit(playerNum, draftValue); }}
            disabled={!isUserThisPlayer || !isThisPlayerActive || game.phase === "EVALUATION"}
            className="goldButton"
            style={{
              width: 120,
              opacity: !isUserThisPlayer || !isThisPlayerActive || game.phase === "EVALUATION" ? 0.4 : 1,
            }}
          >
            SUBMIT
          </Button>
        </div>
      </>
    );
  };

  return (
    <div
      className="gameStarryBg"
      style={{
        color: "#ffffff",
        padding: "12px 28px 18px 28px",
        fontFamily: "var(--font-cinzel), serif",
        overflowX: "hidden",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {starting && (
        <div className="startOverlay">
          {startCountdown === 0 ? (
            <div className="startOverlayTitle">Game Start!</div>
          ) : (
            <>
              <div className="startOverlaySmall">You are a</div>

              <div className="startOverlayRole">{isJudge ? "Judge" : "Writer"}</div>

              {game?.story?.objective && (
                <div className="startOverlayText">
                  Story&apos;s theme:{" "}
                  <span style={{ color: "var(--gold-bright)", fontWeight: "bold" }}>
                    {game.story.objective}
                  </span>
                </div>
              )}

              {!isJudge && (
                <div className="startOverlayText">
                  Your Secret Genre:{" "}
                  <span style={{ color: "var(--gold-bright)", fontWeight: "bold" }}>
                    {isUserPlayer1 ? writer1Genre : writer2Genre}
                  </span>
                </div>
              )}

              <div className="startOverlayCountdown">{startCountdown}</div>
            </>
          )}
        </div>
      )}

      <div className="gameContentWrapper">
        <div className="topGameRow">
          <button onClick={handleExit} className="cornerButton">
            ← EXIT
          </button>

          <div style={{ textAlign: "center" }}>
            <h1 className="gameRoomTitle">GAME ROOM</h1>

            <div className="statusPillRow">
              <span className="statusPill">👥 {game.writers.length + game.judges.length} / 4</span>

              <span className="statusPill">
                ⏱ {game.phase === "EVALUATION" || isPlayer1Active || isPlayer2Active ? formatTime(countdown) : "--:--"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setRulesVisible(true)} className="cornerButton">
              HELP →
            </button>
          </div>
        </div>

        {game.story.objective && (
          <div className="storyObjectiveWrap">
            <div className="storyObjectiveRibbon">
              ✦ STORY OBJECTIVE: {game.story.objective} ✦
            </div>
          </div>
        )}

        <div className="panelsGraphic">
          {!showBullaugeOnLeft && <div className="slotLeft">{renderPlayerSlot(0)}</div>}

          <div className="slotMiddle">
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 12px 0 12px",
                minHeight: 0,
              }}
            >
              {wholeStoryText ? (
                <div className="storyText">{wholeStoryText}</div>
              ) : (
                <div className="storyTextEmpty">
                  The story will appear here as the writers contribute...
                </div>
              )}
            </div>
          </div>

          {!showBullaugeOnRight && <div className="slotRight">{renderPlayerSlot(1)}</div>}

          {showBullaugeOnLeft && <div className="bullauge bullaugeLeft" />}
          {showBullaugeOnRight && <div className="bullauge bullaugeRight" />}
        </div>

        <div className="footerPillWrap">
          <button
            disabled={!isJudge || quotedP1}
            onClick={() => handleQuoteFetch(1)}
            className="footerPill"
            style={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
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
              padding: "9px 28px",
            }}
          >
            ♛ DECLARE
          </button>

          <button
            disabled={!isJudge || quotedP2}
            onClick={() => handleQuoteFetch(2)}
            className="footerPill"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
          >
            QUOTE P2 ✒
          </button>
        </div>

        <div className="bottomPhaseStatus">
          ✦{" "}
          {game.phase === "EVALUATION"
            ? `THE JUDGE MUST DECIDE! ${countdown}s REMAINING`
            : "THE WRITERS ARE CREATING THE STORY."}{" "}
          ✦
        </div>
      </div>

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
          },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: "var(--gold)",
              letterSpacing: 2,
            }}
          >
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
          },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: "var(--gold)",
              letterSpacing: 2,
              textAlign: "center",
            }}
          >
            {resultGame?.story.hasWinner
              ? `Winner is ${resultGame.story.winnerUsername ?? "unknown"}!`
              : "Winner undefined"}
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

      {rulesVisible && (
        <div
          onClick={() => setRulesVisible(false)}
          className="rulesOverlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rulesModal"
          >
            <Button
              onClick={() => setRulesVisible(false)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                ["--btn-bg" as string]: "transparent",
                border: "none",
                color: "var(--gold)",
                fontSize: 20,
              }}
            >
              ✕
            </Button>

            <div className="rulesTitle">✦ HOW TO PLAY ✦</div>

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
                <RuleItem icon="🔭" text="When it's the other player's turn, a porthole covers their panel — only the active writer's response is visible to everyone." />
                <RuleItem icon="🏆" text="After 20 rounds the Judge decides whose genre dominated the story. Write convincingly!" />
              </div>
            )}

            <div className="rulesCloseHint">Click anywhere outside to close</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;