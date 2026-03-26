"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering


import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation
import HomeButton from "../../components/HomeButton";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, Card, Table, Descriptions } from "antd";
import React, { useEffect, useState } from "react";
import styles from "@/styles/page.module.css";



interface FormFieldProps {
  label: string;
  value: string;
}

const Login: React.FC = () => {
  const router = useRouter();

  //const params = useParams<{ id: string }>();   //TO DELETE WHEN LOGIN AND REGISTER SET THE ID
  const apiService = useApi();
  const [users, setUser] = useState<User | null>(null);

  const {
    value: token, 
    set: setToken, 
    clear: clearToken, 
  } = useLocalStorage<string>("token", "");

  const {
        value: id,
        set: setId,
        clear: clearId
      } = useLocalStorage<string>("userId", "");
  
  useEffect(() => {
        
        if (token !="") {
  
          const validateToken = async () => {
  
            try {
              //setId(Number(params.id))  //TO DELETE WHEN LOGIN AND REGISTER IS IMPLEMENTED
              const response = await apiService.get<User[]>(`/users/${id}`, token); 
  
              //If token/id mismatch go to login
              if (!response) {
                router.push(`/login`);
              }
     
              //If token is present and valid current page is ok
                    
            } catch (error) {
              console.log("Invalid or expired token");
              clearId();
              clearToken(); 
            }
          };
          
          validateToken();
        }
    
        else{
        
          router.push(`/login`); 
        }
      }, [token]);


    useEffect(() => {
        const fetchUser = async () => {
          try {
          
            const response = await apiService.get<User>(`/users/${id}`, token);
            setUser(response);
            console.log("Fetched user:", response);

          } catch (error) {
            if (error instanceof Error) {
              alert(`Something went wrong while fetching users:\n${error.message}`);
            } else {
              console.error("An unknown error occurred while fetching users.");
            }
          }
        };
    
        fetchUser();
      }, [apiService]); 

  const handleLogout = () => {
    clearId();
    clearToken();
    router.push("/");
  };

  return (
    <>
      <HomeButton />
      <div style={{ position: "fixed", top: 20, right: 60, zIndex: 1000 }}>
        <Button
          onClick={() => router.push("/users")}
          style={{ ["--btn-bg" as string]: "#6253c6b3", width: 110, height: 50, padding: 0, fontSize: "20px" } as React.CSSProperties}
        >
          Users
        </Button>
      </div>

      <div className="login-container">
        {/* outer frame */}
        <div style={{
          width: 480,
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 1,
          padding: 24,
          fontFamily: "var(--font-cinzel), serif",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>

          {/* header box */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 1,
            padding: "12px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: "bold" }}>User Profile</div>
          </div>

          {/* info box */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 1,
            padding: "16px 24px",
          }}>
            <Descriptions column={1} styles={{ label: { color: "#aaaaaa", fontFamily: "var(--font-cinzel), serif" }, content: { color: "#ffffff", fontFamily: "var(--font-cinzel), serif" } }}>
              <Descriptions.Item label="Username">{users?.username ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Member since">{users?.creationDate ? new Date(users.creationDate).toLocaleDateString() : "—"}</Descriptions.Item>
              <Descriptions.Item label="Bio">{users?.bio ?? "—"}</Descriptions.Item>
            </Descriptions>
          </div>

          {/* logout */}
          <Button
            onClick={handleLogout}
            style={{ ["--btn-bg" as string]: "#c0392b", width: 110, height: 50, padding: 0, fontSize: "20px", alignSelf: "flex-start" } as React.CSSProperties}
          >
            Logout
          </Button>

        </div>
      </div>
    </>
  );
}

export default Login;