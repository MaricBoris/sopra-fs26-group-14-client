
"use client";
import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation

import { Button, Input , message, Modal } from "antd";
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

const [ wholeStoryText,setStoryyText] = useState<string>("");
const [TwoInput, setTwoInput] = useState("");
const [OneInput, setOneInput] = useState("");
const lastDraftSentAtP1 = useRef(0);
const lastDraftSentAtP2 = useRef(0);
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

const handleSubmit = async (player: 1 | 2, input: string): Promise<void> => {
  const prettyinput=input.trim();
  try {
    const response=await apiService.post<Game>(`/games/${gameid}/input`,{ player: player, input: prettyinput },token);
    setGame(response);
    const quote = game?.writers[player - 1]?.quote;
    if (quote && prettyinput.toLowerCase().includes(quote.toLowerCase())) {
        if (player === 1) setQuoteUsedP1(true);
        else setQuoteUsedP2(true);
    }
    const holeStoryText=response.story.storyText;
    setStoryyText(holeStoryText);
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
        const response = await apiService.get<Game>(`/games/${gameid}/quotes?player=${player}`, token);
        setGame(response);
        if (player === 1) setQuotedP1(true);
        else setQuotedP2(true);
    } catch (error) {
        message.error("Failed to fetch quote.");
    }
};

useEffect(() => { 
  
  if (!token || !gameid) return; 
  const getGame = async () => { 
    try { 
      const ourGame: Game = await apiService.get<Game>(`/games/${gameid}`, token); 
      setGame(ourGame);
      
      const writer1 = ourGame.writers[0];
      const writer2 = ourGame.writers[1];

      setGenre1(writer1?.genre ?? "Genre");
      setGenre2(writer2?.genre ?? "Genre");

      setStoryyText(ourGame.story.storyText);
      
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Fetching game failed:\n${error.message}`);
      } else {
        alert("Fetching game failed (unknown error).");
        console.error("Unknown error:", error);
      }

    }
  } 
  getGame();

   
  }, [apiService, token, gameid]);

  useEffect(() => {
    if (!token || !gameid) return;

    const streamUrl = `${getApiDomain()}/games/${gameid}/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    const handleGameUpdate = (event: MessageEvent) => {
      const latestGame: Game = JSON.parse(event.data);

      setGame(latestGame);
      setStoryyText(latestGame.story.storyText);

      setGenre1(latestGame.writers[0]?.genre ?? "Genre");
      setGenre2(latestGame.writers[1]?.genre ?? "Genre");

      if (latestGame.story.hasWinner && !resultModalVisible) {
        setResultGame(latestGame);
        setResultModalVisible(true);
      }
    };

    const handleGameDeleted = () => {
      if (!resultModalVisible && !votingInProgress.current) {
        setGameEnded(true);
      }
    };

    eventSource.addEventListener("game-update", handleGameUpdate as EventListener);
    eventSource.addEventListener("game-deleted", handleGameDeleted as EventListener);

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.removeEventListener("game-update", handleGameUpdate as EventListener);
      eventSource.removeEventListener("game-deleted", handleGameDeleted as EventListener);
      eventSource.close();
    };
  }, [token, gameid, resultModalVisible]);

  const [gameEnded, setGameEnded] = useState(false);


  useEffect(() => {
    if (!token || !gameid || !game) return;
    if (!isUserPlayer1 || !isPlayer1Active) return;

    const now = Date.now();

    if (now - lastDraftSentAtP1.current < 100) {
      return;
    }

    lastDraftSentAtP1.current = now;

    apiService.post<Game>(
      `/games/${gameid}/draft`,
      { player: 1, input: OneInput },
      token
    ).catch((error) => {
      console.log("Saving Player 1 draft failed", error);
    });
  }, [OneInput, token, gameid, game, isUserPlayer1, isPlayer1Active, apiService]);

  useEffect(() => {
    if (!token || !gameid || !game) return;
    if (!isUserPlayer2 || !isPlayer2Active) return;

    const now = Date.now();

    if (now - lastDraftSentAtP2.current < 100) {
      return;
    }

    lastDraftSentAtP2.current = now;

    apiService.post<Game>(
      `/games/${gameid}/draft`,
      { player: 2, input: TwoInput },
      token
    ).catch((error) => {
      console.log("Saving Player 2 draft failed", error);
    });
  }, [TwoInput, token, gameid, game, isUserPlayer2, isPlayer2Active, apiService]);

  useEffect(() => { //executes the "cleanup", after a writer leave was detected
  if (!gameEnded) return;

  message.error("Game ended because a writer or judge left or disconnected.");

  const timeout = setTimeout(() => {
    router.push("/");
  }, 3000);

  return () => clearTimeout(timeout); //in case the component is unmounted (if the user redirects himself or something), before the timer expires, because then we obvioulsy don't want the message anymore
}, [gameEnded, router]);

useEffect(() => {
  if (!game?.turnStartedAt) return;

  const updateCountdown = () => {
    const elapsed = Math.floor((Date.now() - game.turnStartedAt) / 1000);
    const remaining = Math.max(0, game.timer - elapsed);
    setCountdown(remaining);
  };

  updateCountdown();
  const id = setInterval(updateCountdown, 1000);

  return () => clearInterval(id);
}, [game?.turnStartedAt, game?.timer]);

const handleVoteWinner = async (writerId: number): Promise<void> => {
  votingInProgress.current = true;
  setDeclareModalVisible(false);
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

          <div />
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
              minHeight: 56,
              overflow: "hidden",
            }}
          >
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
                width: 100,
                height: "100%",
                minHeight: 56,
                borderLeft: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
            {game.currentRound} / 20

            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              minWidth: 0,
            }}
          >
            Round
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
              ...(isPlayer1Active && game.phase !== "EVALUATION" ? activePlayerStyle : inactivePlayerStyle),
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
              <div className={styles.scrollTitle3}>{game.writers[0]?.username ?? "Player 1"}</div>
            </div>

            <div
              style={{
                ...panelStyle,
                padding: 12,
                height: 190,
                minWidth: 0,
              }}
            >
              <TextArea

                disabled={!isUserPlayer1 || !game.writers[0].turn}
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
              <Input
                value={isUserPlayer1
                        ? writer1Genre
                        : isUserPlayer2
                        ? "Genre"
                        : writer1Genre}
                readOnly
                style={smallFieldStyle}
              />
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

              {game.writers[0]?.quote && !quoteUsedP1 && isUserPlayer1 && (
                  <div style={{ fontSize: 11, color: "#f0c040", marginTop: 2 }}>
                      Incorporate in your next 2 turns
                  </div>
              )}
              {quoteUsedP1 && isUserPlayer1 && (
                  <div style={{ fontSize: 11, color: "#25d366", marginTop: 2 }}>Quote incorporated!</div>
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
              }}
            >
                  <TextArea 
                    style={inputInnerStyle}
                    value={wholeStoryText} //react kontrolliert das input feld, React setzt bei jedem Render den Wert des Input-Felds auf den aktuellen State wholestoryText.
                    readOnly
                    placeholder="Text Field of active Story"
                  />{/* Bei jedem change wird neu gerendert!!*/}
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
              <div className={styles.scrollTitleJudge}>Judge</div>
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

              <Button
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
              </Button>

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
              ...(isPlayer2Active && game.phase !== "EVALUATION" ? activePlayerStyle : inactivePlayerStyle),
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
              <div className={styles.scrollTitle3}>{game.writers[1]?.username ?? "Player 2"}</div>
            </div>

            <div
              style={{
                ...panelStyle,
                padding: 12,
                height: 190,
                minWidth: 0,
              }}
            >
              <TextArea
                disabled={!isUserPlayer2 || !game.writers[1].turn}
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
              <Input
                value={isUserPlayer2
                        ? writer2Genre
                        : isUserPlayer1
                        ? "Genre"
                        : writer2Genre}
                readOnly
                style={smallFieldStyle}
              />
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
              {game.writers[1]?.quote && !quoteUsedP2 && isUserPlayer2 && (
                  <div style={{ fontSize: 11, color: "#f0c040", marginTop: 2 }}>
                      To incorporate in your next 2 turns
                  </div>
              )}
              {quoteUsedP2 && isUserPlayer2 && (<div style={{ fontSize: 11, color: "#25d366", marginTop: 2 }}>Quote incorporated!</div>
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
    </div>
  );
};

export default GamePage;
