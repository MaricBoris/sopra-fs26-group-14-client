"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering


import { useRouter, useParams, } from "next/navigation"; // use NextJS router for navigation
import HomeButton from "@/components/HomeButton";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Story } from "@/types/story";
import { Button, Input, Table, Modal, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useEffect, useState } from "react";
import styles from "@/styles/page.module.css";



interface FormFieldProps {
  label: string;
  value: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const viewedUserId = params?.id;
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

  const [stories, setStories] = useState<Story[]>([]); // 📝 past matches for the viewed user

  //state variables for bio changes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const { TextArea } = Input;

  //state variables for password changes and profile deletion
  const [passwordModal, setPasswordModal] = useState({open: false, loading: false, current: "", next: "", confirm: ""});
  const [deleteModal, setDeleteModal] = useState({open: false, loading: false, password: ""});

  const isOwnProfile = String(users?.id) === String(id)

  useEffect(() => {
        
        if (token !="") {
  
          const validateToken = async () => {
  
            try {
              //setId(Number(params.id))
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
        if (!token || !id) return;
        const fetchUser = async () => {
          try {

            const response = await apiService.get<User>(`/users/${params.id}`, token);
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
      }, [apiService, params.id, token]);

  // 📝 fetch all stories the viewed user participated in; 401 → force logout
  useEffect(() => {
    if (!token || !viewedUserId) return;
    const fetchStories = async () => {
      try {
        const response = await apiService.get<Story[]>(`/results/user/${viewedUserId}`, token);
        setStories(response ?? []);
      } catch (error: unknown) {
        if (typeof error === "object" && error !== null && (error as { status?: number }).status === 401) {
          clearId();
          clearToken();
          router.push("/login");
        }
      }
    };
    fetchStories();
  }, [viewedUserId, token, apiService, clearId, clearToken, router]);

  // 📝 stats derived from stories relative to the viewed user's username
  const wins = stories.filter(s => s.winnerUsername === users?.username).length;
  const totalGames = stories.length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  // 📝 table columns — opponent/genre/outcome resolved relative to viewed user
  const headerCell = () => ({ style: { fontSize: 11, whiteSpace: "nowrap" as const } });

  const storyColumns: ColumnsType<Story> = [
    {
      title: "Date",
      dataIndex: "creationDate",
      key: "creationDate",
      width: "25%",
      align: "center",
      onHeaderCell: headerCell,
      render: (v: string | null) => v ? new Date(v).toLocaleDateString() : "—",
    },
    {
      title: "Opponent",
      key: "opponent",
      width: "25%",
      align: "center",
      onHeaderCell: headerCell,
      render: (_: unknown, s: Story) =>
        s.winnerUsername === users?.username ? (s.loserUsername ?? "—") : (s.winnerUsername ?? "—"),
    },
    {
      title: "Genre",
      key: "genre",
      width: "25%",
      align: "center",
      onHeaderCell: headerCell,
      render: (_: unknown, s: Story) =>
        s.winnerUsername === users?.username ? (s.winGenre ?? "—") : (s.loseGenre ?? "—"),
    },
    {
      title: "Outcome",
      key: "outcome",
      width: "25%",
      align: "center",
      onHeaderCell: headerCell,
      render: (_: unknown, s: Story) => {
        if (!s.hasWinner) return <span style={{ color: "#aaaaaa" }}>Tie</span>;
        if (s.winnerUsername === users?.username) return <span style={{ color: "#4caf50" }}>Win</span>;
        return <span style={{ color: "#c0392b" }}>Loss</span>;
      },
    },
  ];

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

  const handleDeleteAccount = async () => {
    if (!deleteModal.password) {
      message.error("Please enter your password.");
      return;
    }

    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await apiService.delete(`/users/${id}`, { password: deleteModal.password }, token);
      message.success("Your account has successfully been deleted.");
      clearId();
      clearToken();
      router.push("/login");
    } catch (error) {
      console.error("Error:", error);
      message.error("Incorrect password.");
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false, open: false, password: "" }));
    }
  };

  const handleOpenDeleteModal = () => {
    setDeleteModal({ open: true, loading: false, password: "" });
  };


  return (
    <div style={{ minHeight: "100vh", backgroundImage: "url('/profile_02.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }}>

      {/* 📝 Home navigation button */}
      <HomeButton />

      {/* 📝 Delete Account button — fixed bottom right, own profile only */}
      {isOwnProfile && (
        <Button
          className="profile-red-btn"
          onClick={handleOpenDeleteModal}
          style={{ position: "fixed", bottom: 16, right: 16, width: 80, height: 38, fontSize: 12, padding: 0, zIndex: 100 } as React.CSSProperties}
        >
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}><span>Delete</span><span>Account</span></span>
        </Button>
      )}

      {/* 📝 Users nav button */}
      <Button
        className="profile-btn"
        onClick={() => router.push("/users")}
        style={{ position: "fixed", top: 16, right: 16, width: 80, height: 38, fontSize: 14, zIndex: 100 } as React.CSSProperties}
      >
        Users
      </Button>

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, paddingBottom: 40 }}>

        {/* 📝 Page title */}
        <h1 className="profile-title" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 4 }}>
          USER PROFILE
        </h1>
        <div className="profile-title-divider" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: -15 }}>◆</div>

        {/* 📝 Profile frame — height-driven so it reaches near bottom of screen */}
        <div style={{ position: "relative", height: "92vh", aspectRatio: "1145 / 1374", maxWidth: "95vw" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile_frame_final.png" alt="Profile frame" style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none", userSelect: "none" }} />

          {/* 📝 All content inside frame */}
          <div style={{ position: "absolute", top: "17%", left: "20%", right: "20%", bottom: "16%", display: "flex", flexDirection: "column", fontFamily: "var(--font-cinzel), serif", overflow: "hidden" }}>

            {/* 📝 Profile info rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
              {[
                { label: "USERNAME", value: users?.username ?? "—" },
                { label: "MEMBER SINCE", value: users?.creationDate ? new Date(users.creationDate).toLocaleDateString() : "—" },
                { label: "BIO", value: users?.bio ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ borderBottom: "1px solid rgba(212, 175, 93, 0.5)", paddingBottom: 4 }}>
                  <div style={{ fontSize: 13, letterSpacing: 2, color: "#f5e97a", textAlign: "center" }}>◆ {label} ◆</div>
                  <div style={{ fontSize: 13, color: "#fff8c5", marginTop: 1, wordBreak: "break-word", whiteSpace: "normal", textAlign: "center" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* 📝 Match history heading */}
            <div className="profile-heading" style={{ marginBottom: 6, fontSize: 13 }}>MATCH HISTORY</div>

            {/* 📝 Stats row */}
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              {[
                { label: "Games", value: totalGames },
                { label: "Wins", value: wins },
                { label: "Win Rate", value: `${winRate}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ flex: 1, textAlign: "center", background: "rgba(40,35,90,0.4)", border: "1px solid rgba(212,175,93,0.3)", borderRadius: 2, padding: "3px 4px" }}>
                  <div style={{ fontSize: 11, fontWeight: "bold", color: "#e8d896" }}>{value}</div>
                  <div style={{ fontSize: 9, color: "#d4c98a" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* 📝 Match table — flex-grows to fill remaining space */}
            <div className="profile-table" style={{ flex: 1, overflow: "hidden" }}>
              <Table<Story>
                dataSource={stories}
                columns={storyColumns}
                rowKey="id"
                pagination={false}
                size="small"
                tableLayout="fixed"
                style={{ width: "100%" }}
                scroll={{ y: 120 }}
                locale={{ emptyText: <span style={{ color: "#6b6480", fontFamily: "var(--font-cinzel), serif" }}>No matches yet</span> }}
                onRow={(record) => ({ onClick: () => router.push(`/results/${record.id}`), style: { cursor: "pointer" } })}
              />
            </div>

            {/* 📝 Action buttons — own profile only */}
            {isOwnProfile && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
                <Button className="profile-red-btn" onClick={handleLogout} style={{ width: 80, height: 34, fontSize: 11, padding: 0 }}>Logout</Button>
                <Button className="profile-btn" onClick={handleEditBio} style={{ width: 80, height: 34, fontSize: 11, padding: 0 }}>Edit Bio</Button>
                <Button className="profile-btn" onClick={handleEditPassword} style={{ width: 80, height: 34, fontSize: 11, padding: 0 }}>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}><span>Edit</span><span>Password</span></span>
                </Button>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* 📝 Modals */}
      <Modal title="Edit Bio" open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveBio}
        okText="Save" okButtonProps={{ style: { fontFamily: "var(--font-cinzel), serif" } }}
        confirmLoading={loading}
      >
        <TextArea rows={4} value={bio} onChange={(e) => setBio(e.target.value)}
          placeholder="A few words about yourself..."
          style={{ background: "white", color: "black", border: "1px solid #d9d9d9", borderRadius: 4 }}
        />
      </Modal>

      <Modal title="Edit Password" open={passwordModal.open}
        onCancel={() => setPasswordModal(p => ({ ...p, open: false }))}
        onOk={handlePasswordEdit}
        okText="Save" okButtonProps={{ style: { fontFamily: "var(--font-cinzel), serif" } }}
        confirmLoading={passwordModal.loading}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(["current", "next", "confirm"] as const).map((field) => (
            <Input.Password key={field}
              placeholder={{ current: "Current password", next: "New password", confirm: "Confirm new password" }[field]}
              value={passwordModal[field]}
              onChange={(e) => setPasswordModal(p => ({ ...p, [field]: e.target.value }))}
              style={{ background: "white", color: "black", border: "1px solid #d9d9d9", borderRadius: 4 }}
            />
          ))}
        </div>
      </Modal>

      <Modal title="Delete Account" open={deleteModal.open}
        onCancel={() => setDeleteModal(p => ({ ...p, open: false, password: "" }))}
        onOk={handleDeleteAccount} confirmLoading={deleteModal.loading}
        okText="Delete" okButtonProps={{ style: { backgroundColor: "#c0392b", color: "white", fontFamily: "var(--font-cinzel), serif", border: "1px solid #c0392b" } }}
        styles={{ header: { background: "white" }, body: { background: "white" }, footer: { background: "white" } }}
      >
        <Input.Password placeholder="Enter password to confirm" value={deleteModal.password}
          onChange={(e) => setDeleteModal(p => ({ ...p, password: e.target.value }))}
          style={{ background: "white", border: "1px solid #d9d9d9", color: "black" }}
        />
      </Modal>

    </div>
  );
}

export default Login;