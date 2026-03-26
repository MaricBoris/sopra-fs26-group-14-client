// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect , useState} from "react";
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


const UsersPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
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
     if(!token) return;
    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const users: User[] = await apiService.get<User[]>("/users", token);
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
  }, [apiService, token]); 
  
  useEffect(() => {
        if (token !="") {
  
          const validateToken = async () => {
  
            try {
              const response = await apiService.get<User>(`/users/${userId}`, token); //It will function when API is configured with id and authorization
  
  
              //If token/id mismatch or invalid go to login
              if (!response) {
                router.push(`/login`);
              }
              
      
            } catch (error) {
              console.log("Invalid or expired token");
              clearId();
              clearToken(); 
              router.push("/login");
            }
          };
          validateToken();
        }
    
        else{
          router.push(`/login`); 
        }
      }, [token, userId, apiService, router, clearId, clearToken]);

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

export default UsersPage;