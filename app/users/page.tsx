// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Table } from "antd";
import type { TableProps } from "antd"; // antd component library allows imports of types
// Optionally, you can import a CSS module or file for additional styling:
// import "@/styles/views/Dashboard.scss";
import styles from "@/styles/page.module.css";

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "#",
    key: "index",
    width: 70,
    render: (_, __, index) => index + 1, //numbering starts from 1 instead of 0
    onCell: () => ({ //style for the cells of this column
      style: {
        backgroundColor: "#8f8c8c", //light gray
        fontWeight: "bold",           //makes the numbers bold
        textAlign: "center",          //centers the numbers 
      },
    }),
  },
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  }
];

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    value: token, // is commented out because we dont need to know the token value for logout
    // set: setToken, // is commented out because we dont need to set or update the token value
    clear: clearToken, // all we need in this scenario is a method to clear the token
  } = useLocalStorage<string>("token", ""); // if you wanted to select a different token, i.e "lobby", useLocalStorage<string>("lobby", "");
  const { 
    value: userId,
    clear: clearId, 
  } = useLocalStorage<string>("userId", "");

  const handleLogout = async (): Promise<void> => {
    try {
      await apiService.post("/users/logout", {token});
    } catch (error) {
      console.log("Logout request failed:", error);
    } finally {
      clearToken();
      clearId();
      router.push("/home");
    }
  };
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        console.log("Fetched users:", users);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService]); // dependency apiService does not re-trigger the useEffect on every render because the hook uses memoization (check useApi.tsx in the hooks).
  // if the dependency array is left empty, the useEffect will trigger exactly once
  // if the dependency array is left away, the useEffect will run on every state change. Since we do a state change to users in the useEffect, this results in an infinite loop.
  // read more here: https://react.dev/reference/react/useEffect#specifying-reactive-dependencies

  return (
    <>
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
 
      <Button type="primary" onClick={() => router.push("/home")}>
        Home
      </Button>

      
      <Button style={{
        backgroundColor: "#669d4b", // so ein moosgrün
        color: "black",
        borderColor: "#669d4b",
      }}
      onClick={() => router.push(`/users/${userId}`)}>
        Profile
      </Button>

    </div>
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
        
       <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}> {/*display flex brauchen wir, um justifyContent überhaupt sinnvoll zu benutzen*/}
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

export default Dashboard;
