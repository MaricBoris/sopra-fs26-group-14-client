
"use client";
import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation

import { Button, Input , message, Modal, Tooltip } from "antd";
import styles from "@/styles/page.module.css";
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

  const panelStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.025)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 1,
  };

  const inputInnerStyle: React.CSSProperties = {
    height: "100%",
    background: "rgba(255,255,255,0.07)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.10)",
    resize: "none",
    fontFamily: "var(--font-cinzel), serif",
  };

  const smallFieldStyle: React.CSSProperties = {
    height: 40,
    background: "rgba(255,255,255,0.05)",
    color: "#ffffff",
    border: "1px solid rgba(255,255,255,0.10)",
    fontFamily: "var(--font-cinzel), serif",
  };

 const activePlayerStyle: React.CSSProperties = {
   boxShadow: "0 0 0 2px #25d366, 0 0 18px 2px rgba(37,211,102,0.25)",
   borderRadius: 4,
   padding: 6,
   transition: "box-shadow 0.4s",
 };
 const inactivePlayerStyle: React.CSSProperties = {
   boxShadow: "none",
   borderRadius: 4,
   padding: 6,
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
    <span style={{ color: "rgba(255,255,255,0.85)" }}>{text}</span>
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
      try { //initial fetch +  give up immediately if the token is wrong or we don't have a game and trying to reconnect would be useless
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
          eventSource?.readyState === EventSource.CLOSED || //browser gave up himself 
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

 

  useEffect(() => { //executes the "cleanup", after a writer leave was detected
  if (!gameEnded) return;

  message.error("Game ended because a writer or judge left or disconnected.");

  const timeout = setTimeout(() => {
    router.push("/");
  }, 3000);

  return () => clearTimeout(timeout); //in case the component is unmounted (if the user redirects himself or something), before the timer expires, because then we obvioulsy don't want the message anymore
}, [gameEnded, router]);

useEffect(() => { //pre game countdown
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
  if (!game.turnStartedAt || !game.timer) return; // new guard

  const elapsed = Math.floor((Date.now() - game.turnStartedAt) / 1000); //Could autotrigger effect (Async problems)
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



if (!game) { //beim ersten rendern ist user noch null, dann zeigen wir erst mal "loading"
  return <div>Loading Game...</div>;
}

const quoteIncorporatedP1 = !!(game.writers[0]?.quote && wholeStoryText.toLowerCase().includes(game.writers[0].quote.toLowerCase()));
const quoteIncorporatedP2 = !!(game.writers[1]?.quote && wholeStoryText.toLowerCase().includes(game.writers[1].quote.toLowerCase()));

return (
  <div
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        background: "var(--background)",
        color: "#ffffff",
        padding: "20px",
        fontFamily: "var(--font-cinzel), serif",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
        {starting && ( //countdown
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 120,
            color: "#ffffff",
            zIndex: 999,
            fontFamily: "var(--font-cinzel), serif",
          }}>
      {startCountdown === 0 ? (
              <div style={{ fontSize: 64, fontWeight: "bold", letterSpacing: 6, color: "#ffffff" }}>
                Game Start!
              </div>
            ) : (
              <>
                <div style={{ fontSize: 16, letterSpacing: 3, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                  You are a
                </div>
                <div style={{ fontSize: 36, fontWeight: "bold", letterSpacing: 4 }}>
                  {isJudge ? "Judge" : "Writer"}
                </div>
                {game?.story?.objective && (
                  <div style={{ marginTop: 8, fontSize: 15, letterSpacing: 1 }}>
                    Story&apos;s theme: <span style={{ color: "#ffffff", fontWeight: "bold" }}>{game.story.objective}</span>
                  </div>
                )}
                {!isJudge && (
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>
                    Your Secret Genre: <span style={{ color: "#f0c040", fontWeight: "bold" }}>{isUserPlayer1 ? writer1Genre : writer2Genre}</span>
                  </div>
                )}
                <div style={{ fontSize: 100, fontWeight: "bold", lineHeight: 1, marginTop: 16 }}>
                  {startCountdown}
                </div>

              </>
            )}
        </div>
        )}
      <div
        style={{
          maxWidth: 1400,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        {/* Titelreihe */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px minmax(0, 1fr) 140px",
            alignItems: "center",
            gap: 16,
            width: "100%",
          }}
        >
          <div>
            <Button
             onClick={handleExit}
              style={{
                ["--btn-bg" as string]: "#c0392b",
                width: 120,
                height: 52,
                fontSize: 20,
              }}
            >
              Exit
            </Button>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 1,
              padding: "14px 22px",
              textAlign: "center",
              fontSize: 30,
              fontWeight: "bold",
              minWidth: 0,
            }}
          >
            Game Room
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        onClick={() => setRulesVisible(true)}
                        style={{
                          ["--btn-bg" as string]: "rgba(255,255,255,0.08)",
                          width: 120,
                          height: 52,
                          fontSize: 18,
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                      Help
                      </Button>
                    </div>
                  </div>

        {/* Live story titel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "150px minmax(0, 1fr) 150px",
            gap: 16,
            alignItems: "stretch",
            width: "100%",
          }}
        >
          <div />

          <div
            style={{
              position: "relative",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 1,
              minWidth: 0,
              height: 56,
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
          <div
            style={{
              width: 200,
              height: "100%",
              Height: 56,
              borderRight: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: "bold",
              letterSpacing: 2,
              color: game.phase === "EVALUATION" ? "#e74c3c"
                : game.phase === "TIEBREAKER" ? "#c39bd3"
                : "#2e9f44",
            }}
          >
            {game.phase === "EVALUATION" ? "EVALUATION PHASE"
              : game.phase === "TIEBREAKER" ? "TIEBREAKER PHASE"
              : "WRITING PHASE"}
          </div>

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 24,
                fontWeight: "bold",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              Live Story
            </div>

            <div
              style={{
                marginLeft: "auto",
                width: 200,
                height: "100%",
                minHeight: 56,
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
            {game.currentRound} / 4 rounds

            </div>
          </div>
        </div>

        {/* hauptbreich*/}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr) minmax(0, 1fr)",
            gap: 14,
            alignItems: "start",
            width: "100%",
          }}
        >
          {/* Player 1 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
              ...(isPlayer1Active && game.phase !== "EVALUATION" && !resultModalVisible ? activePlayerStyle : inactivePlayerStyle),
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
              <div className={styles.scrollTitle3}>{game.writers[0]?.username ?? "Player 1"}</div>
            </div>

            <div
              style={{
                ...panelStyle,
                padding: 20,
                height: 190,
                minWidth: 0,
              }}
            >
              <TextArea
                maxLength={2000}
                showCount
                disabled={!isUserPlayer1 || !game.writers[0].turn || game.phase === "EVALUATION"}
                style={inputInnerStyle}
                value={isUserPlayer1 ? OneInput : (game.writers[0]?.text ?? "")}
                onChange={(e) => setOneInput(e.target.value)}
                placeholder="Input Field Player 1"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 90px 105px",
                gap: 10,
                minWidth: 0,
              }}
            >
              <Tooltip title={!isUserPlayer2 ? (game.writers[0]?.genreDescription ?? "") : ""}>
                <Input
                  value={isUserPlayer1
                          ? writer1Genre
                          : isUserPlayer2
                          ? "Genre"
                          : writer1Genre}
                  readOnly
                  style={smallFieldStyle}
                />
              </Tooltip>
              <Input
                value={isPlayer1Active && game.phase !== "EVALUATION" ? countdown : "Timer"}
                readOnly
                style={{ ...smallFieldStyle, textAlign: "center" }}
              />
              <Button
              onClick={() =>handleSubmit(1,OneInput)}
              disabled={!isUserPlayer1 || !game.writers[0].turn || game.phase === "EVALUATION"}
                style={{
                  ["--btn-bg" as string]: "#2e9f44",
                  height: 40,
                  fontSize: 17,
                  opacity: !isUserPlayer1 || !game.writers[0].turn || game.phase === "EVALUATION" ? 0.4 : 1,
                }}
              >
                Submit
              </Button>
            </div>

           {(isUserPlayer1 || (!isUserPlayer1 && !isUserPlayer2)) && (
            <div
              style={{
                background: "rgba(255,255,255,0.018)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 1,
                padding: 10,
                height: 72,
                minWidth: 0,
              }}
            >
              <TextArea
                placeholder="Quote field P1"
                value={game.writers[0]?.quote ?? ""}
                readOnly
                style={{
                  height: "100%",
                  background: "rgba(255,255,255,0.045)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.07)",
                  resize: "none",
                  fontFamily: "var(--font-cinzel), serif",
                }}
              />

              {game.writers[0]?.quote && !quoteUsedP1 && !quoteIncorporatedP1 && !isUserPlayer2 && (() => {
                const assigned = game.writers[0].quoteAssignedRound ?? game.currentRound;
                const turnsLeft = 2 - Math.ceil((game.currentRound - assigned) / 2);
                const expired = turnsLeft <= 0;
                return (
                  <div style={{ fontSize: 11, color: expired ? "#e74c3c" : "#f0c040", marginTop: 2 }}>
                    {expired ? "Quote window expired!" : `Incorporate in your next ${turnsLeft} turn${turnsLeft !== 1 ? "s" : ""}`}
                  </div>
                );
              })()}
            {(quoteUsedP1 || quoteIncorporatedP1) && !isUserPlayer2 && (<div style={{ fontSize: 11, color: "#25d366", marginTop: 2 }}>Quote incorporated!</div>
                )}
            </div>
            )}
          {(isUserPlayer1 || (!isUserPlayer1 && !isUserPlayer2)) && (
            <Button
              onClick={() => navigator.clipboard.writeText(game.writers[0]?.quote ?? "")}
              style={{
                ["--btn-bg" as string]: "#7ea6e0",
                width: 118,
                height: 40,
                alignSelf: "center",
                fontSize: 17,
                marginTop: 2,
              }}
            >
              Copy
            </Button>
            )}
          </div>

         {/* Judge Spalte */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
            }}
          >
            <div
              style={{
                ...panelStyle,
                padding: 14,
                height: 400,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {game.story.objective && (
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    color: "#ffffff",
                    padding: "6px 10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 2,
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  Story Objective: {game.story.objective}
                </div>
              )}
              <TextArea 
                style={{ ...inputInnerStyle, flex: 1 }}
                value={wholeStoryText}
                readOnly
                placeholder="Text Field of active Story"
              />
            </div>
  


           {/* <div
              style={{
                textAlign: "center",
                fontSize: 20,
                fontWeight: "bold",
                padding: "2px 0 0 0",
                color: "#f4f4f4",
              }}
            >
              Judge
            </div>*/}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 2, marginBottom: 2 }}>
              <div className={styles.scrollTitleJudge}>{game.judges[0]?.username ?? "Judge"}</div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                minWidth: 0,
              }}
            >
              {isJudge && (
                <Button
                  disabled={quotedP1}
                  onClick={() => handleQuoteFetch(1)}
                  style={{
                    ["--btn-bg" as string]: "#3d8da8",
                    height: 44,
                    fontSize: 17,
                    width: 120,
                  }}
                >
                  Quote P1
                </Button>
              )}

              {isJudge && <Button
                disabled={!isJudge || game.phase !== "EVALUATION"}
                onClick={() => setDeclareModalVisible(true)}
                style={{
                  ["--btn-bg" as string]: "#c0392b",
                  height: 44,
                  fontSize: 17,
                  width: 120,
                }}
              >
                Declare
              </Button>}

              {isJudge && (
                <Button
                  disabled={quotedP2}
                  onClick={() => handleQuoteFetch(2)}
                  style={{
                    ["--btn-bg" as string]: "#3d8da8",
                    height: 44,
                    fontSize: 17,
                    width: 120,
                  }}
                >
                  Quote P2
                </Button>
              )}
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: 15,
                color: "rgba(255,255,255,0.78)",
                padding: "8px 12px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                marginTop: 2,
              }}
            >
              {game.phase === "EVALUATION"
                ? `The judge must decide! ${countdown}s remaining`
                : "The writers are creating the story."}
            </div>
          </div>

          {/* Player 2 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
              ...(isPlayer2Active && game.phase !== "EVALUATION" && !resultModalVisible ? activePlayerStyle : inactivePlayerStyle),
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
              <div className={styles.scrollTitle3}>{game.writers[1]?.username ?? "Player 2"}</div>
            </div>

            <div
              style={{
                ...panelStyle,
                padding: 20,
                height: 190,
                minWidth: 0,
              }}
            >
              <TextArea
                maxLength={2000}
                showCount
                disabled={!isUserPlayer2 || !game.writers[1].turn || game.phase === "EVALUATION"}
                style={inputInnerStyle}
                value={isUserPlayer2 ? TwoInput : (game.writers[1]?.text ?? "")}
                onChange={(e) => setTwoInput(e.target.value)}
                placeholder="Input Field Player 2"
              />

            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 90px 105px",
                gap: 10,
                minWidth: 0,
              }}
            >
              <Tooltip title={!isUserPlayer1 ? (game.writers[1]?.genreDescription ?? "") : ""}>
                <Input
                  value={isUserPlayer2
                          ? writer2Genre
                          : isUserPlayer1
                          ? "Genre"
                          : writer2Genre}
                  readOnly
                  style={smallFieldStyle}
                />
              </Tooltip>
              <Input
                value={isPlayer2Active && game.phase !== "EVALUATION" ? countdown : "Timer"}
                readOnly
                style={{ ...smallFieldStyle, textAlign: "center" }}
              />
              <Button
              onClick={() =>handleSubmit(2,TwoInput)}
              disabled={!isUserPlayer2 || !game.writers[1].turn || game.phase === "EVALUATION"}
                style={{
                  ["--btn-bg" as string]: "#2e9f44",
                  height: 40,
                  fontSize: 17,
                  opacity: !isUserPlayer2 || !game.writers[1].turn || game.phase === "EVALUATION" ? 0.4 : 1,
                }}
              >
                Submit
              </Button>
            </div>
           {(isUserPlayer2 || (!isUserPlayer1 && !isUserPlayer2)) && (
            <div
              style={{
                background: "rgba(255,255,255,0.018)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 1,
                padding: 10,
                height: 72,
                minWidth: 0,
              }}
            >
              <TextArea
                placeholder="Quote field P2"
                value={game.writers[1]?.quote ?? ""}
                readOnly
                style={{
                  height: "100%",
                  background: "rgba(255,255,255,0.045)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.07)",
                  resize: "none",
                  fontFamily: "var(--font-cinzel), serif",
                }}
              />
              {game.writers[1]?.quote && !quoteUsedP2 && !quoteIncorporatedP2 && !isUserPlayer1 && (() => {
                const assigned = game.writers[1].quoteAssignedRound ?? game.currentRound;
                const turnsLeft = 2 - Math.ceil((game.currentRound - assigned) / 2);
                const expired = turnsLeft <= 0;
                return (
                  <div style={{ fontSize: 11, color: expired ? "#e74c3c" : "#f0c040", marginTop: 2 }}>
                    {expired ? "Quote window expired!" : `Incorporate in your next ${turnsLeft} turn${turnsLeft !== 1 ? "s" : ""}`}
                  </div>
                );
              })()}
              {(quoteUsedP2 || quoteIncorporatedP2) && !isUserPlayer1 && (<div style={{ fontSize: 11, color: "#25d366", marginTop: 2 }}>Quote incorporated!</div>
              )}
            </div>
            )}
          {(isUserPlayer2 || (!isUserPlayer1 && !isUserPlayer2)) && (
            <Button
              onClick={() => navigator.clipboard.writeText(game.writers[1]?.quote ?? "")}
              style={{
                ["--btn-bg" as string]: "#7ea6e0",
                width: 118,
                height: 40,
                alignSelf: "center",
                fontSize: 17,
                marginTop: 2,
              }}
            >
              Copy
            </Button>
            )}
          </div>
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
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#fff",
            fontFamily: "var(--font-cinzel), serif",
            padding: "32px 24px",
          }
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <div style={{ fontSize: 22, fontWeight: "bold" }}>
            Who is the winner?
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Button
              onClick={() => handleVoteWinner(game?.writers[0]?.id ?? -1)}
              style={{
                ["--btn-bg" as string]: "#2e9f44",
                height: 48,
                fontSize: 17,
                width: 150,
              }}
            >
               {game?.writers[0]?.username ?? "Player 1"}
            </Button>
            <Button
              onClick={() => handleVoteWinner(game?.writers[1]?.id ?? -1)}
              style={{
                ["--btn-bg" as string]: "#3d8da8",
                height: 48,
                fontSize: 17,
                width: 150,
              }}
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
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#fff",
            fontFamily: "var(--font-cinzel), serif",
            padding: "40px 24px",
          }
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 26, fontWeight: "bold" }}>
            {resultGame?.story.hasWinner
              ? `Winner is ${resultGame.story.winnerUsername ?? "unknown"}!`
              : "Winner undefined"
            }
          </div>
          {resultGame?.story.hasWinner && (
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>
              Genre: {resultGame.story.winGenre ?? "—"}
            </div>
          )}
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
            Redirecting to home in 20 seconds...
          </div>
        </div>
      </Modal>
    {rulesVisible && (
            <div
              onClick={() => setRulesVisible(false)}
              style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.45)",
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
                  background: "rgba(20,20,35,0.75)",
                  backdropFilter: "blur(18px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 4,
                  padding: "36px 40px",
                  maxWidth: 540,
                  width: "90%",
                  color: "#ffffff",
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
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 20,
                  }}
                >✕</Button>

                <div style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
                  How to Play
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



                <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  Click anywhere outside to close
                </div>
              </div>
            </div>
          )}
      </div>
  );
};

export default GamePage;
