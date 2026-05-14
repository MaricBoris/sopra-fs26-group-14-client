"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Tooltip } from "antd";
import HomeButton from "@/components/HomeButton";
import ProfileButton from "@/components/ProfileButton";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

// type script inteface according to AchievementGetDTO
interface Achievement {
  id: number;
  name: string;          
  displayName: string;
  description: string;
  icon: string;
}

//  type script interface according to UserAchievementGetDTO
interface UserAchievement {
  id: number;
  achievement: Achievement;
  unlockedAt: string;
  isDisplayed: boolean;
}

//  Maps the achievement name from backend to the filepath of the corresponding image
const badgeImage = (name: string): string => {
  return `/badges/${name.toLowerCase()}.webp`;
};

const AchievementsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const viewedUserId = params?.id;
  const apiService = useApi();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);

  const {
    value: token,
    clear: clearToken,
  } = useLocalStorage<string>("token", "");

  const {
    value: id,
    clear: clearId,
  } = useLocalStorage<string>("userId", "");

  //  Auth check-> push to /login if no token
  useEffect(() => {
    if (!isMounted) return;
    if (token === "") {
      router.push("/login");
      return;
    }
    const validateToken = async () => {
      try {
        const response = await apiService.get<User>(`/users/${id}`, token);
        if (!response) router.push("/login");
      } catch {
        console.log("Invalid or expired token");
        clearId();
        clearToken();
        router.push("/login");
      }
    };
    validateToken();
  }, [isMounted, token, id, apiService, router, clearId, clearToken]);

  // Fetch viewed user, all possible achievements and the users unlocked ones
  useEffect(() => {
    if (!isMounted || !token || !viewedUserId) return;

    const fetchUser = async () => {
      try {
        const u = await apiService.get<User>(`/users/${viewedUserId}`, token);
        setViewedUser(u);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    const fetchAllAchievements = async () => {
      try {
        const list = await apiService.get<Achievement[]>(`/achievements`, token);
        setAllAchievements(list ?? []);
      } catch (error) {
        console.error("Failed to fetch all achievements:", error);
      }
    };

    const fetchUnlocked = async () => {
      try {
        const list = await apiService.get<UserAchievement[]>(
          `/users/${viewedUserId}/achievements`,
          token
        );
        setUnlocked(list ?? []);
      } catch (error: unknown) {
        if (typeof error === "object" && error !== null && (error as { status?: number }).status === 401) {
          clearId();
          clearToken();
          router.push("/login");
        } else {
          console.error("Failed to fetch unlocked achievements:", error);
        }
      }
    };

    fetchUser();
    fetchAllAchievements();
    fetchUnlocked();
  }, [isMounted, viewedUserId, token, apiService, clearId, clearToken, router]);

  return (
    <div
      style={{
        minHeight: "100vh", //at least as high as viewport height/browser window height
        backgroundImage: "url('/starry-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed", //doesn't move when scrolled
      }}
    >
      <HomeButton /> 
      <ProfileButton />

      <main
        style={{
          display: "flex", //makes it a flexbox
          flexDirection: "column", //arranges children beneath each other instead of next to each other
          alignItems: "center", //aligns the children horizontally
          paddingTop: "clamp(14px, 3.2vh, 24px)", //scales with viewport height
          paddingBottom: "clamp(40px, 8vh, 60px)",
        }}
      >
        {/* Page title */}
        <h1 //header 1
          className="profile-title"
          style={{ position: "relative", //serves as ancor for children
             marginBottom: 4 //for pixels margin down to the next element
            }}
        >
          ACHIEVEMENTS OF {viewedUser?.username?.toUpperCase() ?? "USER"}
        </h1>
        <div
          className="profile-title-divider"
          style={{ position: "relative", marginBottom: "clamp(28px, 6.5vh, 50px)" }}
        >
          ✦
        </div>

        {/* Badge grid */}
        <div
          style={{
            display: "grid", //activates the grid layout
            gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 38vw), 1fr))", //make as many columns as possible, min width scales with viewport
            gap: "clamp(18px, 2.5vw, 28px)", //horizontal and vertical margin between the grid cells, scales with viewport
            width: "min(90vw, 1100px)", //take the smaller of both for width, either 90% of viewport or 1100 pixel
            padding: "0 16px", //top/down 0 and left/right 16 within the container
          }}
        >
          {allAchievements.map((a) => { //for all a's in allAchievements, map it to this function value and make a new array from all the results
            const ua = unlocked.find((u) => u.achievement.name === a.name); //figure out, if the achievement is in the unlocked list; find the first element in the array unlocked for which u.achievement.name === a.name
            const isUnlocked = !!ua; //if object true, if undefined false

            return ( //for each of the achievements we return one of these (still inside map)
              <Tooltip
                key={a.name} //necessary if we render lists, to identify each element by for example "ROOKIE_SCRIBE"
                title={ //whats written in the tooltip (description and locked/unlocked at )
                  <div style={{ fontFamily: "var(--font-cinzel), serif" }}>
                    <div style={{ color: "#f0e0b0", fontSize: 12 }}>
                      {a.description}
                    </div>
                    <div style={{ color: "#d4c98a", fontSize: 11, marginTop: 6, opacity: 0.8 }}>
                      {isUnlocked
                        ? `Unlocked: ${ua.unlockedAt ? new Date(ua.unlockedAt).toLocaleDateString() : "—"}`
                        : "Locked"}
                    </div>
                  </div>
                }
                color="rgba(15, 20, 48, 0.95)" //background colour of the tooltip (dark blue)
              >
                <div
                  style={{ //the container, which shows the tooltip if hovered over
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "default", //we don't want the clickable mouse cursor, we can just hover over it
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */} 
                  <img
                    src={badgeImage(a.name)} //uses the helper function to make the path to the image
                    alt={a.displayName} //what's displayed if the image is not there
                    style={{
                      width: "100%", //image should fill the container
                      maxWidth: "min(240px, 38vw)", //but max width scales with viewport
                      height: "auto", //and proportional height
                      filter: isUnlocked //the filter applied dependant on if unlocked or not
                        ? "drop-shadow(0 0 18px rgba(232, 216, 150, 0.35))" //if unlocked we want a golden drop shadow (goes exactly around shape of image, not for example in rectangle), 0 horizontal and vertical offset, 18 pixel blurr
                        : "grayscale(100%) brightness(0.45)", // grayed out and less bright
                      opacity: isUnlocked ? 1 : 0.55, //not opaque if unlocked, opaque if locked
                      userSelect: "none", //cannot select the image
                      transition: "filter 0.3s, opacity 0.3s", // if the filters change, do it "slowely" over 0.3 seconds
                    }}
                    onError={(e) => { //on 404, if image is not loading because path is broken etc
                      //  Fallback if image is missing, keeps the layout intact
                      (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; //e.currentTarget is the image itself, visibility hidden keeps the space reserved, so the grid doesn't collapse
                    }}
                  />
                </div>
              </Tooltip>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AchievementsPage;