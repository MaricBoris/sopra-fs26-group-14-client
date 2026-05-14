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
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", ""); //to clear userId on logout

  //mount gate -> don't read localStorage before it's available (prevents hydration mismatch)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const [hqLoaded, setHqLoaded] = useState(false);

  //clears token and UserId if they are expired
  useEffect(() => {
    if (!token) return;
    api.get(`/users/${userId}`, token).catch(() => {
      clearToken();
      clearUserId();
    });
  }, []);

  useEffect(() => {
    const TAGLINES = [
      "StoryWars — Once upon a time",
      "StoryWars — Ink shall be spilled",
      "StoryWars — Write. Duel. Win.",
      "StoryWars — May the Pen guide You",
      "StoryWars — Quill powered duels",
      "StoryWars — The plot thickens",
      "StoryWars — Prose before foes",
      "StoryWars — Loading plot twist",
      "StoryWars — Between the lines"
    ];
    document.title = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/users/logout", {}, token);
      clearToken();
      clearUserId(); //also clear stored user id
      //user stays on home page after logout (no redirect)
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

  
  const handleProfileClick = () => {
    if (token && userId) {
      router.push(`/users/${userId}`);
    } else {
      router.push("/login");
    }
  };

  // don't render until mounted to avoid hydration mismatch with localStorage
  if (!isMounted) return null;

 return (
    <div className="home-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/background_home_hq.webp"
        alt=""
        aria-hidden="true"
        className={`home-page-hq ${hqLoaded ? "is-loaded" : ""}`}
        onLoad={() => setHqLoaded(true)}
        decoding="async"
      />
      {/*  Top-right button stack: Profile + Login/Register/Logout depending on auth */}
      <div className="home-top-buttons">
      {token && userId && (
        <>
          <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
            <Button className="profile-nav-btn" onClick={handleProfileClick} style={{ width: 104, height: 50, fontSize: 18, padding: 0 }}>
              Profile
            </Button>
          </div>
          <div style={{ position: "fixed", top: 76, right: 16, zIndex: 1000 }}>
            <Button className="users-logout-btn" onClick={handleLogout} style={{ width: 104, height: 50, fontSize: 18, padding: 0 }}>
              Logout
            </Button>
          </div>
        </>
      )}
      </div>

      {/* the text that describes the game */}
      <p className="home-description">
        Face one another in a collaborative and competitive writing game.<br />
        Try to steer the story toward your assigned genre<br />
        and convince the judge you should be crowned the winner.
        <span className="home-description-cta">
          Register and join the lobby to face other users now!
        </span>
      </p>

      {/* stories and lobby buttons*/}
      <div className="home-main-buttons">
        {token && userId ? (
          <>
            <Button className="home-main-btn" onClick={() => router.push("/results")}>
              STORIES
            </Button>
            <Button className="home-main-btn" onClick={() => router.push("/tutorial")}>
              TUTORIAL
            </Button>
            <Button className="home-main-btn" onClick={handleLobbyClick}>
              LOBBY
            </Button>
          </>
        ) : (
          <>
            <Button className="home-main-btn" onClick={() => router.push("/register")}>
              REGISTER
            </Button>
            <Button className="home-main-btn" onClick={() => router.push("/tutorial")}>
              TUTORIAL
            </Button>
            <Button className="home-main-btn" onClick={() => router.push("/login")}>
              LOGIN
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
