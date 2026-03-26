// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";



const Redirect: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();

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
              const response = await apiService.get<User>(`/users/${id}`, token); //It will function when API is configured with id and authorization
  
  
              //If token/id mismatch or invalid go to login
              if (!response) {
                router.push(`/login`);
              }
              
      
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

  return null;
  
};

export default Redirect;
