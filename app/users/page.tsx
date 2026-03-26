// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Table } from "antd";
import type { TableProps } from "antd";
import styles from "@/styles/page.module.css";

import HomeButton from "@/components/HomeButton";
import ProfileButton from "@/components/ProfileButton";

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "#",
    key: "index",
    width: 70,
    render: (_, __, index) => index + 1,
    onCell: () => ({
      style: {
        backgroundColor: "#8f8c8c",
        fontWeight: "bold",
        textAlign: "center",
      },
    }),
  },
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
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
      router.push("/home");
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

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div className={styles.scrollTitle}>User Profiles</div>
        </div>

        {users && (
          <>
            <Table<User>
              columns={columns}
              dataSource={users}
              rowKey="id"
              scroll={{ y: 300 }}
              pagination={false}
              showHeader={false}
              rowClassName={(_, index) =>
                index % 2 === 0 ? styles.evenRow : styles.oddRow
              }
              onRow={(row) => ({
                onClick: () => router.push(`/users/${row.id}`),
                style: { cursor: "pointer" },
              })}
            />

            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Button danger type="primary" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default UsersPage;