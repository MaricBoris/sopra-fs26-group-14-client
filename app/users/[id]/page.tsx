"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering


import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation
import HomeButton from "../../components/HomeButton";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, Card, Table, Descriptions, Modal, message } from "antd";
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

  //state variables for bio changes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const { TextArea } = Input;

  //state variables for password changes
  const [passwordModal, setPasswordModal] = useState({
    open: false, loading: false,
    current: "", next: "", confirm: ""
  });

  const isOwnProfile = users?.id === Number(id)

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

  const handleEditBio = () => {
    setBio(users?.bio || "");
    setIsModalOpen(true);
  };

   const handleSaveBio = async () => {
      setLoading(true);
      try {
        await apiService.put(`/users/${id}`, { bio }, token);
        setUser(prev => prev ? { ...prev, bio } : prev);
        setIsModalOpen(false);
        message.success("Bio updated!");
      } catch (error) {
            console.error("PUT error:", error);
            message.error("Failed to update bio.");
      } finally {
        setLoading(false);
      }
    };

   const handleEditPassword = () => {
       setPasswordModal({ open: true, loading: false, current: "", next: "", confirm: "" })
   };

   const handlePasswordEdit = async () => {
     if (passwordModal.next !== passwordModal.confirm) {
       message.error("New passwords do not match."); return;
     }
     setPasswordModal(p => ({ ...p, loading: true }));
     try {
       await apiService.put(`/users/${id}/password`,
         { currentPassword: passwordModal.current, newPassword: passwordModal.next }, token);
       message.success("Password changed! Please log in again.");
       clearId(); clearToken();
       router.push("/login");
     } catch {
       message.error("Wrong current password.");
     } finally {
       setPasswordModal(p => ({ ...p, loading: false }));
     }

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

          {/* buttons */}
          {users?.id === Number(id) && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}>
            <Button
              onClick={handleLogout}
              style={{ ["--btn-bg" as string]: "#c0392b", width: 110, height: 50, padding: 0, fontSize: "20px" } as React.CSSProperties}
            >
              Logout
            </Button>
            <Button
              onClick={handleEditBio}
              style={{ ["--btn-bg" as string]: "#6253c6b3", width: 110, height: 50, padding: 0, fontSize: "20px" } as React.CSSProperties}
            >
              Edit Bio
            </Button>

            <Button
              onClick = {handleEditPassword}
              style={{ ["--btn-bg" as string]: "#6253c6b3", width: 180, height: 50, padding: 0, fontSize: "20px" } as React.CSSProperties}>
              Edit Password
            </Button>
            </div>
            )}


            {/* Edit Bio Modal */}
            <Modal title="Edit Bio" open={isModalOpen}

              onCancel={() => setIsModalOpen(false)}
              onOk={handleSaveBio}
              confirmLoading={loading}
            >
              <TextArea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A few words about yourself..."
                style={{background: "white", color: "black", border: "1px solid #d9d9d9", borderRadius: 4 }}
              />
            </Modal>

            {/* Edit Password Modal */}
            <Modal title="Edit Password" open={passwordModal.open}

              onCancel={() => setPasswordModal(p => ({ ...p, open: false }))}
              onOk={handlePasswordEdit}
              confirmLoading={passwordModal.loading}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {(["current", "next", "confirm"] as const).map((field) => (
                  <Input.Password key={field}
                    placeholder={{ current: "Current password", next: "New password", confirm: "Confirm new password" }[field]}
                    value={passwordModal[field]}
                    onChange={(e) => setPasswordModal(p => ({ ...p, [field]: e.target.value }))}
                    style={{background: "white", color: "black", border: "1px solid #d9d9d9", borderRadius: 4 }}
                  />
                ))}
                </div>
            </Modal>
            </div>

        </div>

    </>
  );
}

export default Login;