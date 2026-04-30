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

  // 📝 Profile button: same logic as <ProfileButton/> component — go to /users/{userId} if logged in, else /login
  const handleProfileClick = () => {
    if (token && userId) {
      router.push(`/users/${userId}`);
    } else {
      router.push("/login");
    }
  };

  // 📝 don't render until mounted to avoid hydration mismatch with localStorage
  if (!isMounted) return null;

 return (
    <div className="home-page">
      {/*  Top-right button stack: Profile + Login/Register/Logout depending on auth */}
      <div className="home-top-buttons">
        <Button className="home-nav-btn" onClick={handleProfileClick}>
          ◉ PROFILE
        </Button>
        {!token && !userId && (
          <>
            <Button className="home-nav-btn" onClick={() => router.push("/login")}>
              LOGIN
            </Button>
            <Button className="home-nav-btn" onClick={() => router.push("/register")}>
              REGISTER
            </Button>
          </>
        )}
        {token && userId && (
          <Button className="home-nav-btn" onClick={handleLogout}>
            ⎋ LOGOUT
          </Button>
        )}
      </div>

      {/*  Beschreibungstext unter dem im Hintergrund eingebrannten Storywars-Titel */}
      <p className="home-description">
        Face one another in a collaborative and competitive writing game.<br />
        Try to steer the story toward your assigned genre<br />
        and convince the judge you should be crowned the winner.
        <span className="home-description-cta">
          Register and join the lobby to face other users now!
        </span>
      </p>

      {/*  Hauptbuttons unten: Stories + Lobby */}
      <div className="home-main-buttons">
        <Button className="home-main-btn" onClick={() => router.push("/results")}>
          STORIES
        </Button>
        <Button className="home-main-btn" onClick={handleLobbyClick}>
          LOBBY
        </Button>
      </div>
    </div>
  );
}
