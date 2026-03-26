"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering


import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation
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
      } = useLocalStorage<number>("id", 0);
  
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
    router.push("/home");
  };

  

  return (
  
          <div className="profile-wrapper">
            <div className="profile-nav">
              <Button type="primary" onClick={() => router.push("/home")}>Home</Button>
              <Button type="primary" onClick={() => router.push("/users")}>Users</Button>
            </div>

            <div className="profile-card-container">
              <Card
                title="User Profile"
                loading={!users}
                className="profile-card"
              >
                {users && (
                  <Descriptions column={1}>
                    <Descriptions.Item label="Username">{users.username}</Descriptions.Item>
                    <Descriptions.Item label="Created">{users.date}</Descriptions.Item>
                    <Descriptions.Item label="Bio">{users.bio}</Descriptions.Item>
                  </Descriptions>
                )}
              </Card>
            </div>

            <div className="profile-actions">
              <Button danger onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        );
}

export default Login;