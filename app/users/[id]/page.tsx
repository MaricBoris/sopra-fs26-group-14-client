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
    <div style={{ minHeight: "100vh", backgroundImage: "url('/profile_wp.webp')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }}>
      <HomeButton />

      {/* 📝 Delete Account button — fixed bottom right, own profile only */}
      {isOwnProfile && (
        <Button
          className="profile-red-btn"
          onClick={handleOpenDeleteModal}
          style={{ position: "fixed", bottom: 16, right: 16, width: 104, height: 50, fontSize: 16, padding: 0, zIndex: 100 } as React.CSSProperties}
        >
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}><span>Delete</span><span>Account</span></span>
        </Button>
      )}

      {/* 📝 Users nav button */}
      <Button
        className="profile-btn"
        onClick={() => router.push("/users")}
        style={{ position: "fixed", top: 16, right: 16, width: 104, height: 50, fontSize: 18, zIndex: 100 } as React.CSSProperties}
      >
        Users
      </Button>

      {/* Achievements button */}
      <Button
        className="profile-btn"
        onClick={() => router.push(`/users/${viewedUserId}/achievements`)}
        style={{ position: "fixed", top: 76, right: 16, width: 104, height: 50, fontSize: 18, zIndex: 100 } as React.CSSProperties}
      >
        Trophies
      </Button>

      {/* 📝 Logout button */}
      <Button
        className="users-logout-btn"
        onClick={handleLogout}
        style={{ position: "fixed", top: 136, right: 16, width: 104, height: 50, fontSize: 18, padding: 0, zIndex: 100 } as React.CSSProperties}
      >
        Logout
      </Button>


      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, paddingBottom: 40 }}>

        {/* 📝 Page title */}
        <h1 className="profile-title" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 4 }}>
          USER PROFILE
        </h1>
        <div className="profile-title-divider" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: -15 }}>✦</div>

        {/* 📝 Profile frame — height-driven so it reaches near bottom of screen */}
        <div style={{ position: "relative", height: "92vh", aspectRatio: "1145 / 1374", maxWidth: "95vw" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile_frame.webp" alt="Profile frame" style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none", userSelect: "none" }} />

          {/* 📝 All content inside frame */}
          <div style={{ position: "absolute", top: "15%", left: "17%", right: "18%", bottom: "14.5%", display: "flex", flexDirection: "column", fontFamily: "var(--font-cinzel), serif", overflow: "hidden" }}>

            {/* 📝 Profile info rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 6 }}>
              {[
                { label: "USERNAME", value: users?.username ?? "—" },
                { label: "MEMBER SINCE", value: users?.creationDate ? new Date(users.creationDate).toLocaleDateString() : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ borderBottom: "1px solid #d4af5d80", paddingBottom: 4 }}>
                  <div className="profile-info-label" style={{ fontSize: "clamp(11px, 1.5vh, 15px)", letterSpacing: 2, color: "#d1bc6f", textAlign: "center" }}>{label}</div>
                  <div style={{ fontSize: "clamp(11px, 1.5vh, 15px)", color: "#f0e0b0", marginTop: 1, wordBreak: "break-word", whiteSpace: "normal", textAlign: "center" }}>{value}</div>
                </div>
              ))}
              {/* 📝 Bio row scrollable */}
              <div style={{ borderBottom: "1px solid #d4af5d80", paddingBottom: 4 }}>
                <div className="profile-info-label" style={{ fontSize: "clamp(11px, 1.5vh, 15px)", letterSpacing: 2, color: "#d1bc6f", textAlign: "center" }}>BIO</div>
                <div style={{ fontSize: "clamp(11px, 1.5vh, 15px)", color: "#f0e0b0", marginTop: 1, wordBreak: "break-word", whiteSpace: "normal", textAlign: "center", maxHeight: "clamp(65px, 10vh, 110px)", overflowY: "auto" }}>{users?.bio ?? "—"}</div>
              </div>
            </div>

            {/* 📝 Match history heading */}
            <div className="profile-heading" style={{ marginBottom: 8, fontSize: "clamp(11px, 1.5vh, 15px)" }}>MATCH HISTORY</div>

            {/* 📝 Stats row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {[
                { label: "Games", value: totalGames },
                { label: "Wins", value: wins },
                { label: "Win Rate", value: `${winRate}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ flex: 1, textAlign: "center", background: "rgba(40,35,90,0.4)", border: "1px solid rgba(212,175,93,0.3)", borderRadius: 2, padding: "3px 4px" }}>
                  <div style={{ fontSize: "clamp(9px, 1.3vh, 13px)", fontWeight: "bold", color: "#e8d896" }}>{value}</div>
                  <div style={{ fontSize: "clamp(8px, 1.1vh, 11px)", color: "#d4c98a" }}>{label}</div>
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
              <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center" }}>
<Button className="profile-btn" onClick={handleEditBio} style={{ width: "clamp(78px, 10.7vh, 104px)", height: "clamp(32px, 4.5vh, 46px)", fontSize: "clamp(10px, 1.5vh, 15px)", padding: 0 }}>Edit Bio</Button>
                <Button className="profile-btn" onClick={handleEditPassword} style={{ width: "clamp(78px, 10.7vh, 104px)", height: "clamp(32px, 4.5vh, 46px)", fontSize: "clamp(10px, 1.5vh, 15px)", padding: 0 }}>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}><span>Edit</span><span>Password</span></span>
                </Button>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* 📝 Modals */}
      <Modal
        title={<span style={{ color: "var(--gold)", fontFamily: "var(--font-cinzel), serif", letterSpacing: 2 }}>✦ EDIT BIO ✦</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        centered
        footer={
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <Button className="goldButton" onClick={() => setIsModalOpen(false)}>CANCEL</Button>
            <Button className="goldButton" onClick={handleSaveBio} loading={loading}>SAVE</Button>
          </div>
        }
        styles={{
          body: { background: "linear-gradient(135deg, #0f1430 0%, #1a2042 100%)", border: "1px solid rgba(212,168,87,0.5)", fontFamily: "var(--font-cinzel), serif" },
          header: { background: "transparent", borderBottom: "1px solid rgba(212,168,87,0.2)" },
          footer: { background: "transparent", borderTop: "1px solid rgba(212,168,87,0.2)", paddingTop: 16 },
        }}
      >
        <TextArea rows={4} value={bio} onChange={(e) => setBio(e.target.value)}
          placeholder="A few words about yourself..."
          style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(212,168,87,0.5)", fontFamily: "var(--font-cinzel), serif", marginTop: 16, marginBottom: 8 }}
        />
      </Modal>

      <Modal
        title={<span style={{ color: "var(--gold)", fontFamily: "var(--font-cinzel), serif", letterSpacing: 2 }}>✦ EDIT PASSWORD ✦</span>}
        open={passwordModal.open}
        onCancel={() => setPasswordModal(p => ({ ...p, open: false }))}
        confirmLoading={passwordModal.loading}
        centered
        footer={
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <Button className="goldButton" onClick={() => setPasswordModal(p => ({ ...p, open: false }))}>CANCEL</Button>
            <Button className="goldButton" onClick={handlePasswordEdit} loading={passwordModal.loading}>SAVE</Button>
          </div>
        }
        styles={{
          body: { background: "linear-gradient(135deg, #0f1430 0%, #1a2042 100%)", border: "1px solid rgba(212,168,87,0.5)", fontFamily: "var(--font-cinzel), serif" },
          header: { background: "transparent", borderBottom: "1px solid rgba(212,168,87,0.2)" },
          footer: { background: "transparent", borderTop: "1px solid rgba(212,168,87,0.2)", paddingTop: 16 },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16, marginBottom: 8 }}>
          {(["current", "next", "confirm"] as const).map((field) => (
            <Input.Password key={field}
              placeholder={{ current: "Current password", next: "New password", confirm: "Confirm new password" }[field]}
              value={passwordModal[field]}
              onChange={(e) => setPasswordModal(p => ({ ...p, [field]: e.target.value }))}
              style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(212,168,87,0.5)", fontFamily: "var(--font-cinzel), serif" }}
            />
          ))}
        </div>
      </Modal>

      <Modal
        title={<span style={{ color: "#e74c3c", fontFamily: "var(--font-cinzel), serif", letterSpacing: 2 }}>✦ DELETE ACCOUNT ✦</span>}
        open={deleteModal.open}
        onCancel={() => setDeleteModal(p => ({ ...p, open: false, password: "" }))}
        confirmLoading={deleteModal.loading}
        centered
        footer={
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            <Button className="goldButton" onClick={() => setDeleteModal(p => ({ ...p, open: false, password: "" }))}>CANCEL</Button>
            <Button
              className= "delete-btn"
              onClick={handleDeleteAccount}
              loading={deleteModal.loading}
              style={{ border: "1px solid #e74c3c", color: "#e74c3c", background: "transparent", fontFamily: "var(--font-cinzel), serif" }}
            >
              DELETE
            </Button>
          </div>
        }
        styles={{
          body: { background: "linear-gradient(135deg, #0f1430 0%, #1a2042 100%)", border: "1px solid rgba(231,76,60,0.5)", fontFamily: "var(--font-cinzel), serif" },
          header: { background: "transparent", borderBottom: "1px solid rgba(231,76,60,0.2)" },
          footer: { background: "transparent", borderTop: "1px solid rgba(231,76,60,0.2)", paddingTop: 16 },
        }}
      >
        <p style={{ color: "rgba(245,230,200,0.7)", fontFamily: "var(--font-cinzel), serif", fontSize: 13, textAlign: "center", marginBottom: 16 }}>
          This action is permanent and cannot be undone.
        </p>
        <Input.Password
          placeholder="Enter password to confirm"
          value={deleteModal.password}
          onChange={(e) => setDeleteModal(p => ({ ...p, password: e.target.value }))}
          style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(231,76,60,0.5)", fontFamily: "var(--font-cinzel), serif", marginBottom: 8 }}
        />
      </Modal>

    </div>
  );
}

export default Login;