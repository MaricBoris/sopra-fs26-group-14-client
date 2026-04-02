"use client";

import React from "react";
import { Button, Input } from "antd";
import {  ReloadOutlined, ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import styles from "@/styles/page.module.css";

const GamePage: React.FC = () => {
  const { TextArea } = Input;

  return (
    <>
      

      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          color: "#ffffff",
          padding: "24px 32px",
          fontFamily: "var(--font-cinzel), serif",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
         

          {/* Exit + title */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr 180px",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div>
              <Button
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

            {/*<div
            
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 1,
                padding: "18px 24px",
                textAlign: "center",
                fontSize: 34,
                fontWeight: "bold",
              }}
            >
              <div className={styles.scrollTitle}>Game Room</div>
            </div>
            <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 180,
  }}
>
  <div className={styles.scrollTitle2}>Game Room</div>
</div>*/}
           <div
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 1,
                padding: "18px 24px",
                textAlign: "center",
                fontSize: 34,
                fontWeight: "bold",
              }}
            >
              Game Room
            </div>
  

            <div />
          </div>

          {/* Live story header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px",
              gap: 16,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 1,
                display: "grid",
                gridTemplateColumns: "1fr 100px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 20px",
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: "bold",
                }}
              >
                Live Story
              </div>
              
              <div
                style={{
                  borderLeft: "1px solid rgba(255,255,255,0.08)",
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
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              Round
            </div>
          </div>

          {/* Main 3-column area */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.05fr 1fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            {/* Player 1 */}
           <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
             {/*} <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: "14px 20px",
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: "bold",
                }}
              >
                Player 1
              </div>*/}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div className={styles.scrollTitle}>Player 1</div>
        </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: 16,
                  minHeight: 260,
                }}
              >
                <TextArea
                  placeholder="Input field P1"
                  autoSize={{ minRows: 10, maxRows: 10 }}
                  style={{
                    height: "100%",
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    resize: "none",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 110px 120px",
                  gap: 12,
                }}
              >
                <Input
                  value="Genre P1"
                  readOnly
                  style={{
                    height: 48,
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
                <Input
                  value="Timer"
                  readOnly
                  style={{
                    height: 48,
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    textAlign: "center",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
                <Button
                  style={{
                    ["--btn-bg" as string]: "#2e9f44",
                    height: 48,
                    fontSize: 20,
                  }}
                >
                  Submit
                </Button>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: 16,
                  minHeight: 120,
                }}
              >
                <TextArea
                  placeholder="Quote field P1"
                  autoSize={{ minRows: 4, maxRows: 4 }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    resize: "none",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
              </div>

              <Button
                style={{
                  ["--btn-bg" as string]: "#7ea6e0",
                  width: 140,
                  height: 48,
                  alignSelf: "center",
                  fontSize: 20,
                }}
              >
                Copy
              </Button>
            </div>

            {/* Center column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: 20,
                  minHeight: 520,
                }}
              >
                <TextArea
                  placeholder="Text field of active story. All committed messages will show up here."
                  autoSize={{ minRows: 20, maxRows: 20 }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    resize: "none",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: "14px 20px",
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: "bold",
                }}
              >
                Judge
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                }}
              >
                <Button
                  style={{
                    ["--btn-bg" as string]: "#3d8da8",
                    height: 52,
                    fontSize: 20,
                  }}
                >
                  Quote P1
                </Button>

                <Button
                  style={{
                    ["--btn-bg" as string]: "#c0392b",
                    height: 52,
                    fontSize: 20,
                  }}
                >
                  Declare
                </Button>

                <Button
                  style={{
                    ["--btn-bg" as string]: "#3d8da8",
                    height: 52,
                    fontSize: 20,
                  }}
                >
                  Quote P2
                </Button>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: 18,
                  minHeight: 120,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                Game Status
              </div>
            </div>

            {/* Player 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
             {/* <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: "14px 20px",
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: "bold",
                }}
              >
                Player 2
              </div>*/}
               <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div className={styles.scrollTitle}>Player 2</div>
        </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: 16,
                  minHeight: 260,
                }}
              >
                <TextArea
                  placeholder="Input field P2"
                  autoSize={{ minRows: 10, maxRows: 10 }}
                  style={{
                    height: "100%",
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    resize: "none",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 110px 120px",
                  gap: 12,
                }}
              >
                <Input
                  value="Genre P2"
                  readOnly
                  style={{
                    height: 48,
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
                <Input
                  value="Timer"
                  readOnly
                  style={{
                    height: 48,
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    textAlign: "center",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
                <Button
                  style={{
                    ["--btn-bg" as string]: "#2e9f44",
                    height: 48,
                    fontSize: 20,
                  }}
                >
                  Submit
                </Button>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                  padding: 16,
                  minHeight: 120,
                }}
              >
                <TextArea
                  placeholder="Quote field P2"
                  autoSize={{ minRows: 4, maxRows: 4 }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    resize: "none",
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                />
              </div>

              <Button
                style={{
                  ["--btn-bg" as string]: "#7ea6e0",
                  width: 140,
                  height: 48,
                  alignSelf: "center",
                  fontSize: 20,
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamePage;