"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { BookOutlined, CodeOutlined, GlobalOutlined } from "@ant-design/icons";
import ProfileButton from "./components/ProfileButton";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";

export default function Home() {
  const router = useRouter();
  const api = useApi();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", ""); // 📝 to clear userId on logout

  // 📝 mount gate -> don't read localStorage before it's available (prevents hydration mismatch)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const handleLogout = async () => {
    try {
      await api.post("/users/logout", {}, token);
      clearToken();
      clearUserId(); // 📝 also clear stored user id
      // 📝 user stays on home page after logout (no redirect)
    } catch (e) {
      alert(`Logout failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

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
      {/* 📝 Login + Register buttons: only shown when not logged in */}
      {!token && !userId && (
        <div style={{ position: "fixed", top: 78, right: 60, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
          <Button onClick={() => router.push("/login")} style={{ ["--btn-bg" as string]: "#0cd244", width: 110, height: 50, padding: 0, fontSize: "20px" } as React.CSSProperties}>Login</Button>
          <Button onClick={() => router.push("/register")} style={{ ["--btn-bg" as string]: "#4aa3d4", width: 110, height: 50, padding: 0, fontSize: "20px" } as React.CSSProperties}>Register</Button>
        </div>
      )}
      {/* 📝 Logout button: only shown when logged in */}
      {token && userId && (
        <div style={{ position: "fixed", top: 78, right: 60, zIndex: 1000 }}>
          <Button onClick={handleLogout} style={{ ["--btn-bg" as string]: "#c0392b", width: 110, height: 50, padding: 0, fontSize: "20px" } as React.CSSProperties}>Logout</Button>
        </div>
      )}
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20 }}>
        <div style={{ width: 660, maxWidth: "100%", background: "rgba(255,255,255,0.09)", backdropFilter: "blur(12px)", borderRadius: 1, border: "1px solid rgba(255,255,255,0.15)", padding: 24 }}>
          {/* 📝 Framing box: */}
          <Image src="/banner_darkblue_pen+genre_storywars4.png" alt="banner" width={660} height={300} style={{ maxWidth: "100%", height: "auto" }} />
          <p style={{ textAlign: "center", maxWidth: 600, margin: "5px auto 0", fontFamily: "var(--font-cinzel), serif", fontSize: "16px" }}>
            Face one another in a collaborative and competitive writing game!<br />
            Try to steer the story towards your assigned literature genre<br />and convince the judge that you shall be crowned the winner!<br />
            <strong>Register and join the lobby to face other users now!</strong>
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 35 }}>
            <Button
              onClick={() => router.push("/results")}
              style={{ ["--btn-bg" as string]: "#6253c6b3", width: 220, height: 80, fontSize: "34px", padding: 0, borderColor: "#ffffff" } as React.CSSProperties}
            >Stories</Button>
            <Button
              onClick={handleLobbyClick}
              style={{ ["--btn-bg" as string]: "#6253c6b3", width: 220, height: 80, fontSize: "34px", padding: 0, borderColor: "#ffffff" } as React.CSSProperties}
            >Lobby</Button>
          </div>
        </div>
      </main>
    </div>
  );
}


