"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { BookOutlined, CodeOutlined, GlobalOutlined } from "@ant-design/icons";
import ProfileButton from "./components/ProfileButton";
import useLocalStorage from "@/hooks/useLocalStorage";

export default function Home() {
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  // 📝 mount gate -> don't read localStorage before it's available (prevents hydration mismatch)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const handleLobbyClick = () => {
    if (token && userId) {
      router.push("/rooms");
    } else {
      router.push("/login");
    }
  };

  // 📝 don't render until mounted to avoid hydration mismatch with localStorage
  if (!isMounted) return null;

  return (
      <div style={{ minHeight: "100vh" }}>
      <ProfileButton />
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
        <div style={{ width: 660, maxWidth: "100%" }}>
          <Image src="/frontpage_banner.png" alt="banner" width={660} height={300} style={{ maxWidth: "100%", height: "auto" }} />
          <p style={{ textAlign: "center", maxWidth: 600, margin: "5px auto 0" }}>
            Face one another in a collaborative and competitive writing game!<br />
            Try to steer the story towards your assigned literature genre and <br />convince the judge that you shall be crowned the winner!<br />
            <strong>Register and join the lobby to face other users now!</strong>
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 35 }}>
            <Button
              onClick={() => router.push("/results")}
              style={{ ["--btn-bg" as string]: "#6253c6b3", padding: "15px 54px", fontSize: "34px", height: "auto", borderColor: "#ffffff" } as React.CSSProperties}
            >Stories</Button>
            <Button
              onClick={handleLobbyClick}
              style={{ ["--btn-bg" as string]: "#6253c6b3", padding: "15px 54px", fontSize: "34px", height: "auto", borderColor: "#ffffff" } as React.CSSProperties}
            >Lobby</Button>
          </div>
        </div>
      </main>
    </div>
  );
}


