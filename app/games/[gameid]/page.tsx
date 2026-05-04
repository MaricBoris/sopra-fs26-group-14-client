"use client";
import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation
 
import { Button, Input , message, Modal, Tooltip } from "antd";
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
  const [countdown, setCountdown] = useState<number>(0);
  const [game, setGame] = useState<Game | null>(null);
  const [writer1Genre, setGenre1] = useState<string>("Genre");
  const [writer2Genre, setGenre2] = useState<string>("Genre");
  const [quoteUsedP1, setQuoteUsedP1] = useState(false);
  const [quoteUsedP2, setQuoteUsedP2] = useState(false);
  const [showIncorporatedHintP1, setShowIncorporatedHintP1] = useState(false);
  const [showIncorporatedHintP2, setShowIncorporatedHintP2] = useState(false);
  const hasTypedThisTurnP1 = useRef(false);
  const hasTypedThisTurnP2 = useRef(false);
  const { TextArea } = Input;
  const [starting, setStarting] = useState(true);
  const [startCountdown, setStartCountdown] = useState(5);
  const [redirectCountdown, setRedirectCountdown] = useState(20);
 
const {
  value: token,
  clear: clearToken,
} = useLocalStorage<string>("token", "");
 
const {
  value: userId,
  clear: clearId,
} = useLocalStorage<string>("userId", "");
 
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
const [frozenBullaugeSide, setFrozenBullaugeSide] = useState<"left" | "right" | null>(null);
 
//to remember where it last was before evaluation
useEffect(() => {
  if (!game) return;
  if (game.phase === "EVALUATION") return;
 
  if (isPlayer1Active && !isPlayer2Active) setFrozenBullaugeSide("right");
  else if (isPlayer2Active && !isPlayer1Active) setFrozenBullaugeSide("left");
}, [isPlayer1Active, isPlayer2Active, game?.phase]);
 
//determine where it should be right now
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
 
  // Polling
  useEffect(() => {
    if (!token || !gameid) return;
    if (gameEnded) return;
 
    const interval = setInterval(async () => {
      try {
        const latestGame = await apiService.get<Game>(`/games/${gameid}`, token);
        setGame(latestGame);
        setStoryyText(latestGame.story.storyText);
        setGenre1(latestGame.writers[0]?.genre ?? "Genre");
        setGenre2(latestGame.writers[1]?.genre ?? "Genre");
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
 
const quoteIncorporatedP1 = !!(game?.writers[0]?.quote && wholeStoryText.toLowerCase().includes(game.writers[0].quote.toLowerCase()));
const quoteIncorporatedP2 = !!(game?.writers[1]?.quote && wholeStoryText.toLowerCase().includes(game.writers[1].quote.toLowerCase()));
 
 // "quote incorperated" for 3 seconds, triggers exactly once at the transition from false to true
  useEffect(() => {
    if (quoteIncorporatedP1 || quoteUsedP1) {
      setShowIncorporatedHintP1(true);
      const t = setTimeout(() => setShowIncorporatedHintP1(false), 3000);
      return () => clearTimeout(t);
    }
  }, [quoteIncorporatedP1, quoteUsedP1]);

  useEffect(() => {
    if (quoteIncorporatedP2 || quoteUsedP2) {
      setShowIncorporatedHintP2(true);
      const t = setTimeout(() => setShowIncorporatedHintP2(false), 3000);
      return () => clearTimeout(t);
    }
  }, [quoteIncorporatedP2, quoteUsedP2]);
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
 
useEffect(() => { //actual timer countdown
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
  if (!resultModalVisible) {
    setRedirectCountdown(20); 
    return;
  }

  const countdownInterval = setInterval(() => {
    setRedirectCountdown(prev => {
      if (prev <= 1) {
        clearInterval(countdownInterval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
 
  const timeout = setTimeout(async () => {
    try {
      await apiService.delete(`/games/${gameid}`, {}, token);
    } catch (e) {
 
    }
    setResultModalVisible(false);
    router.push("/");
  }, 20000);
 
  return () => {
    clearTimeout(timeout);
    clearInterval(countdownInterval);
  };
}, [resultModalVisible, router]);
 
 
 
if (!game) { //beim ersten rendern ist user noch null, dann zeigen wir erst mal "loading"
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
 

//convert the timer seconds to minutes and seconds: instead of 90s->1:30 
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};
 
//----------------renderplayerslot function so we don't have to write the same thing twice-----------------------

  const renderPlayerSlot = (playerIdx: 0 | 1) => {
    const writer = game.writers[playerIdx];
    const isUserThisPlayer = playerIdx === 0 ? isUserPlayer1 : isUserPlayer2;
    const isThisPlayerActive = !!writer?.turn;
    const playerNum = (playerIdx + 1) as 1 | 2;
    const draftValue = playerIdx === 0 ? OneInput : TwoInput;
    const hasTypedRef = playerIdx === 0 ? hasTypedThisTurnP1 : hasTypedThisTurnP2;
    if (draftValue.length > 0) {
      hasTypedRef.current = true;
    }
    const showFirstTurnHint = isUserThisPlayer && isThisPlayerActive && game.currentRound <= 2 && !hasTypedRef.current;
    const setDraftValue = playerIdx === 0 ? setOneInput : setTwoInput;
    const genreVal = playerIdx === 0 ? writer1Genre : writer2Genre;
    const otherUserIsThisPlayer = playerIdx === 0 ? isUserPlayer2 : isUserPlayer1;
    const quoteUsed = playerIdx === 0 ? quoteUsedP1 : quoteUsedP2;
    const quoteIncorporated = playerIdx === 0 ? quoteIncorporatedP1 : quoteIncorporatedP2;
    const responseValue = isUserThisPlayer ? draftValue : writer?.text ?? "";
  
    return (
      <>

        {/*the username-title*/}

        <div style={{ flexShrink: 0, marginBottom: 4 }}>
          <div className="playerNameTitle">
            {(writer?.username ?? `Player ${playerNum}`).toUpperCase()}
          </div>
        </div>
  
        <div className="sectionLabel" style={{ marginBottom: 2, flexShrink: 0 }}>
          YOUR RESPONSE
        </div>
  
        <div
          className={`goldInput goldInputFlex ${showFirstTurnHint ? "flashHighlight-1" : ""}`}
          style={{ flex: 1, minHeight: 120, position: "relative" }}
        >
          <TextArea
            maxLength={2000}
            showCount
            disabled={!isUserThisPlayer || !isThisPlayerActive || game.phase === "EVALUATION"}
            value={responseValue}
            onChange={(e) => setDraftValue(e.target.value)}
            placeholder={showFirstTurnHint ? "" : "Enter your next part of the story..."}
            style={{ height: "100%", resize: "none" }}
          />
          {showFirstTurnHint && (
            <div className="activeTurnHint">
              It&apos;s your turn.<br />Start writing here
            </div>
          )}
        </div>
  
        <div style={{ marginTop: 6, flexShrink: 0 }}>
          <div className="sectionLabel" style={{ marginBottom: 2 }}>
            GENRE
          </div>
  
          <Tooltip title={!otherUserIsThisPlayer ? writer?.genreDescription ?? "" : ""}>
            <div className={`genreBox ${showFirstTurnHint ? "flashHighlight-2" : ""}`}>
              {isUserThisPlayer ? genreVal : otherUserIsThisPlayer ? "Genre" : genreVal}
            </div>
          </Tooltip>
        </div>
  
        {(isUserThisPlayer || isJudge) && writer?.quote && (!(quoteUsed || quoteIncorporated) || (playerIdx === 0 ? showIncorporatedHintP1 : showIncorporatedHintP2)) && (
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
  
              {(isUserThisPlayer || isJudge) && writer?.quote && (
                <button
                  onClick={() => navigator.clipboard.writeText(writer?.quote ?? "")}
                  className="assignQuoteButton"
                  title="Copy quote to clipboard"
                >
                  ⧉ Copy
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
        )}
  
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

//--------------------------------------end renderplayerslot function---------------------------------------------------------


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
            <span className="statusPill">{"\u231B\uFE0E"}  {game.currentRound} / {game.maxRounds}</span>
 
            <span className="statusPillSeparator">✦</span>
 
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
          <span className="storyObjectiveSide" aria-hidden />
          <div className={`storyObjectiveRibbon ${
            ((isUserPlayer1 && game.writers[0]?.turn) || (isUserPlayer2 && game.writers[1]?.turn))
            && game.currentRound <= 2 ? "flashHighlight-3" : ""
          }`}>
            <span className="storyObjectiveStar">✦</span>
            STORY OBJECTIVE: {game.story.objective}
            <span className="storyObjectiveStar">✦</span>
          </div>
          <span className="storyObjectiveSide storyObjectiveSideRight" aria-hidden />
        </div>
      )}
 
      <div className="panelsGraphic">
        {!showBullaugeOnLeft && <div className="slotLeft">{renderPlayerSlot(0)}</div>}
 
        <div className="slotMiddle">
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "35px 12px 0 20px",
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
 
        {showBullaugeOnLeft && (
          <div className="bullauge bullaugeLeft">
            {isUserPlayer1 && (
              <svg
                viewBox="0 0 400 100"
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "30px",
                  transform: "translateX(-50%)",
                  width: "95%",
                  height: "auto",
                  pointerEvents: "none",
                  overflow: "visible",
                }}
              >
                <defs>
                  <path
                    id="bullaugeArcLeft"
                    d="M 20,30 A 200,200 0 0 0 380,30"
                    fill="none"
                  />
                </defs>
                <text
                  style={{
                    fontFamily: "var(--font-cinzel), serif",
                    fontSize: 20,
                    fill: "#d4a857",
                    letterSpacing: 2,
                    fontWeight: "bold",
                  }}
                >
                  <textPath href="#bullaugeArcLeft" startOffset="50%" textAnchor="middle">
                    {(game.writers[0]?.username ?? "").length > 12
                      ? "It\u2019s not your turn!"
                      : `It\u2019s not your turn, ${game.writers[0]?.username ?? "Player 1"}!`}
                  </textPath>
                </text>
              </svg>
            )}
          </div>
        )}
        {showBullaugeOnRight && (
          <div className="bullauge bullaugeRight">
            {isUserPlayer2 && (
              <svg
                viewBox="0 0 400 100"
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "30px",
                  transform: "translateX(-50%)",
                  width: "95%",
                  height: "auto",
                  pointerEvents: "none",
                  overflow: "visible",
                }}
              >
                <defs>
                  <path
                    id="bullaugeArcRight"
                    d="M 20,30 A 200,200 0 0 0 380,30"
                    fill="none"
                  />
                </defs>
                <text
                  style={{
                    fontFamily: "var(--font-cinzel), serif",
                    fontSize: 20,
                    fill: "#d4a857",
                    letterSpacing: 2,
                    fontWeight: "bold",
                  }}
                >
                  <textPath href="#bullaugeArcRight" startOffset="50%" textAnchor="middle">
                    {(game.writers[1]?.username ?? "").length > 12
                      ? "It\u2019s not your turn!"
                      : `It\u2019s not your turn, ${game.writers[1]?.username ?? "Player 2"}!`}
                  </textPath>
                </text>
              </svg>
            )}
          </div>
        )}
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
          Redirecting to home in {redirectCountdown} seconds...
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

