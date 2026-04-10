
"use client";
import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation

import { Button, Input , message} from "antd";
import styles from "@/styles/page.module.css";
import { Game } from "@/types/game";
import { Writer } from "@/types/writer";
import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

const GamePage: React.FC = () => {

  const router = useRouter();
  const params = useParams<{ gameid: string }>();
  const gameid = params?.gameid;
  const apiService = useApi();
  
  const [game, setGame] = useState<Game | null>(null); 
  const [writer1Genre, setGenre1] = useState<string>("Genre"); 
  const [writer2Genre, setGenre2] = useState<string>("Genre");  
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

const handleSubmit = async (player: 1 | 2, input: string): Promise<void> => {
  if (!input.trim()) return;
  try {
    const response=await apiService.post<Game>(`/games/${gameid}/input`,{ player: player, input: input },token);
    const holeStoryText=response.story.text;
    setStoryyText(holeStoryText);
    if (player===2){
      setTwoInput("");
    }
    else{
      setOneInput("")
    }
  } catch (error) {
    alert(`Saving player input failed, pls try again`);
    console.log("Saving Player input failed", error);
  }
};

const handleExit=async() : Promise<void> =>{
  try{
    await apiService.post(`/games/${gameid}/leave`, {}, token);
    router.push("/home");
  }catch (error){
    console.log("Closing game failed", error);
    alert("Exit failed, pls try again");
  }
  
}
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

      setStoryyText(ourGame.story.text);
      
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

  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (!token || !gameid || !game) return;

    const checkIfGameStillExists = async () => {
    try {
        await apiService.get(`/games/${gameid}`, token);
      } catch (error: any) {
        if (error?.status === 404) {
          setGameEnded(true);
        
        }
      }
    };

    const id = setInterval(checkIfGameStillExists, 3000); //diese funktion wird unabhängig vom effekt vom browser alle 3 sekunden ausgeführt

    return () => clearInterval(id); //cleanup funktion, wenn die komponente verlassen wird oder der effekt neu läuft, stoppt die ständige funktionsausführung
  }, [apiService, token, gameid, router, game]);

  useEffect(() => { //executes the "cleanup", after a writer leave was detected
  if (!gameEnded) return;

  message.error("Game ended because a writer left or disconnected.");

  const timeout = setTimeout(() => {
    router.push("/home");
  }, 3000);

  return () => clearTimeout(timeout); //in case the component is unmounted (if the user redirects himself or something), before the timer expires, because then we obvioulsy don't want the message anymore
}, [gameEnded, router]);

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
              1 / 20
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
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
              <div className={styles.scrollTitle3}>Player 1</div>
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
                    style={inputInnerStyle}
                    value={OneInput} //react kontrolliert das input feld, React setzt bei jedem Render den Wert des Input-Felds auf den aktuellen State wholestoryText. 
                    onChange={(e) => setOneInput(e.target.value)} //e ist das event objekt, e.target das input feld und e.target.value das was im feld steht
                    placeholder="Input Field Player 1"
                  />{/* Bei jedem tippen wird neu gerendert!!*/}
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
                value={game.writers[0].id === Number(userId) ? writer1Genre : "Genre"}
                readOnly
                style={smallFieldStyle}
              />
              <Input
                value="Timer"
                readOnly
                style={{ ...smallFieldStyle, textAlign: "center" }}
              />
              <Button
              onClick={() =>handleSubmit(1,OneInput)}
                style={{
                  ["--btn-bg" as string]: "#2e9f44",
                  height: 40,
                  fontSize: 17,
                }}
              >
                Submit
              </Button>
            </div>

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
                style={{
                  height: "100%",
                  background: "rgba(255,255,255,0.045)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.07)",
                  resize: "none",
                  fontFamily: "var(--font-cinzel), serif",
                }}
              />
            </div>

            <Button
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
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
                minWidth: 0,
              }}
            >
              <Button
                style={{
                  ["--btn-bg" as string]: "#3d8da8",
                  height: 44,
                  fontSize: 17,
                }}
              >
                Quote P1
              </Button>

              <Button
                style={{
                  ["--btn-bg" as string]: "#c0392b",
                  height: 44,
                  fontSize: 17,
                }}
              >
                Declare
              </Button>

              <Button
                style={{
                  ["--btn-bg" as string]: "#3d8da8",
                  height: 44,
                  fontSize: 17,
                }}
              >
                Quote P2
              </Button>
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
              Game Status
            </div>
          </div>

          {/* Player 2 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
              <div className={styles.scrollTitle3}>Player 2</div>
            </div>

            <div
              style={{
                ...panelStyle,
                padding: 12,
                height: 190,
                minWidth: 0,
              }}
            >
              <TextArea //controlled input
                    style={inputInnerStyle}
                    value={TwoInput} //react kontrolliert das input feld, React setzt bei jedem Render den Wert des Input-Felds auf den aktuellen State wholestoryText. 
                    onChange={(e) => setTwoInput(e.target.value)} //e ist das event objekt, e.target das input feld und e.target.value das was im feld steht
                    placeholder="Input Field Player 2"
                  />{/* Bei jedem tippen wird neu gerendert!!*/}
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
                value={game.writers[1].id === Number(userId) ? writer2Genre : "Genre"}
                readOnly
                style={smallFieldStyle}
              />
              <Input
                value="Timer"
                readOnly
                style={{ ...smallFieldStyle, textAlign: "center" }}
              />
              <Button
              onClick={() =>handleSubmit(2,TwoInput)}
                style={{
                  ["--btn-bg" as string]: "#2e9f44",
                  height: 40,
                  fontSize: 17,
                }}
              >
                Submit
              </Button>
            </div>

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
                style={{
                  height: "100%",
                  background: "rgba(255,255,255,0.045)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.07)",
                  resize: "none",
                  fontFamily: "var(--font-cinzel), serif",
                }}
              />
            </div>

            <Button
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;