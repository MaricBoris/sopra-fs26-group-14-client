// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Table } from "antd";
import type { TableProps } from "antd";

import HomeButton from "@/components/HomeButton";
import ProfileButton from "@/components/ProfileButton";

// 📝 Columns for user list table
const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
    onCell: () => ({ style: { textAlign: "center" as const } }),
  },
];

const UsersPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);

  const {
    value: token,
    clear: clearToken,
  } = useLocalStorage<string>("token", "");

  const {
    value: userId,
    clear: clearId,
  } = useLocalStorage<string>("userId", "");

  const handleLogout = async (): Promise<void> => {
    try {
      await apiService.post("/users/logout", {}, token);
    } catch (error) {
      console.log("Logout request failed:", error);
    } finally {
      clearToken();
      clearId();
      router.push("/");
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        const users: User[] = await apiService.get<User[]>("/users", token);
        setUsers(users);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService, token]);

  useEffect(() => {
    if (token !== "") {
      const validateToken = async () => {
        try {
          const response = await apiService.get<User>(
            `/users/${userId}`,
            token
          );

          if (!response) {
            router.push("/login");
          }
        } catch (error) {
          console.log("Invalid or expired token");
          clearId();
          clearToken();
          router.push("/login");
        }
      };

      validateToken();
    } else {
      router.push("/login");
    }
  }, [token, userId, apiService, router, clearId, clearToken]);

  return (
    <>
      <HomeButton />
      <ProfileButton />

      {/* 📝 Logout button fixed below Profile button */}
      <div style={{ position: "fixed", top: 76, right: 16, zIndex: 1000 }}>
        <Button
          className="users-logout-btn"
          onClick={handleLogout}
          style={{ width: 104, height: 50, fontSize: 18, padding: 0 }}
        >
          Logout
        </Button>
      </div>

      <div style={{
        minHeight: "100vh",
        backgroundImage: "url('/users_wp.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}>
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, paddingBottom: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: "translateX(calc(0.02 * min(85vw, 85vh * 1672 / 941)))" }}>
            <h1 className="profile-title" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 4 }}>
              Users
            </h1>
            <div className="profile-title-divider" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 8 }}>✦</div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>

            {/* 📝 Frame image filling full viewport */}
            <div className="users-frame" style={{ position: "relative", width: "min(85vw, calc(85vh * 1672 / 941))", aspectRatio: "1672 / 941" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/users_frame.webp"
                alt="Users frame"
                style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none", userSelect: "none" }}
              />

              {/* 📝 User list panel */}
              <div className="users-list-frame" style={{
                position: "absolute",
                top: "10%",
                bottom: "56%",
                left: "52%",
                transform: "translateX(-50%)",
                width: "18%",
                display: "flex",
                flexDirection: "column",
                fontFamily: "var(--font-cinzel), serif",
                color: "#ffffff",
                overflow: "hidden",
                padding: "0.15cqw",
              }}>
                {users && (
                  <div className="users-table" style={{ flex: 1, overflow: "auto" }}>
                    <Table<User>
                      columns={columns}
                      dataSource={users}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      showHeader={false}
                      style={{ fontFamily: "var(--font-cinzel), serif", fontSize: "0.9cqw", cursor: "pointer" }}
                      onRow={(row) => ({
                        onClick: () => router.push(`/users/${row.id}`),
                        style: { cursor: "pointer" },
                      })}
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UsersPage;
