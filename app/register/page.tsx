"use client";

import React, { useEffect, useState } from "react"; // 📝 redirect logic and mount gate
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input, notification } from "antd";
import { ApplicationError } from "@/types/error";
import HomeButton from "../components/HomeButton";

type RegisterForm = {
  username: string;
  password: string;
  bio: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const api = useApi();
  const [form] = Form.useForm();
  const { value: token, set: setToken, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId, set: setUserId, clear: clearUserId } = useLocalStorage<string>("userId", "");

  // 📝 mount gate — don't redirect before localStorage values are available
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // 📝 tracks whether submit was attempted — drives placeholder-as-error behaviour
  const [showErrors, setShowErrors] = useState(false);
  const usernameVal = Form.useWatch("username", form);
  const passwordVal = Form.useWatch("password", form);

  // 📝 redirect logged-in users away from /register
  useEffect(() => {
    if (!isMounted) return;
    if (token && userId) router.replace("/");
    else if (token && !userId) { clearToken(); clearUserId(); }
  }, [isMounted, token, userId, router, clearToken, clearUserId]);

  const onFinish = async (values: RegisterForm) => {
    setShowErrors(false);
    try {
      await api.post("/users", values);
      const loginRes = await api.post<{ id: number; token: string }>("/users/login", {
        username: values.username,
        password: values.password,
      });
      setToken(loginRes.token);
      setUserId(String(loginRes.id));
      router.replace("/");
    } catch (e) {
      const err = e as ApplicationError;
      const status = err.status ?? "Error";
      const descriptions: Record<number, string> = {
        409: "This username is already taken.",
        400: "Username and password cannot be empty.",
      };
      notification.error({
        title: `Registration failed (${status})`,
        description: descriptions[err.status] ?? err.message ?? String(e),
        placement: "topRight",
      });
    }
  };

  if (!isMounted) return <><HomeButton /><div style={{ maxWidth: 520, margin: "40px auto" }}>Loading...</div></>;
  if (token && userId) return <><HomeButton /><div style={{ maxWidth: 520, margin: "40px auto" }}>Redirecting...</div></>;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url('/register_04.png')", backgroundSize: "cover", backgroundPosition: "center", zIndex: -1 }} />
      <HomeButton />

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, paddingBottom: 40 }}>

        {/* 📝 Page title */}
        <h1 className="register-title" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 4 }}>
          REGISTER
        </h1>
        <div className="register-title-divider" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: -15 }}>✦</div>

        {/* 📝 Frame — height-driven, landscape 1448×1086 */}
        <Form form={form} name="register" onFinish={onFinish} onFinishFailed={() => setShowErrors(true)} className="register-form" validateTrigger="onSubmit">
          <div style={{ position: "relative", height: "85vh", aspectRatio: "1448 / 1086", maxWidth: "95vw" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/register_03_transparent2.png" alt="Register frame" style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none", userSelect: "none" }} />

            {/* 📝 Username — pinned to its label position in the image */}
            <div style={{ position: "absolute", top: "8.5%", left: "43%", right: "26%" }}>
              <Form.Item name="username" rules={[{ required: true, message: "Please input your username!" }]}>
                <Input className={`register-input${showErrors && !usernameVal ? " register-input-error" : ""}`} placeholder={showErrors && !usernameVal ? "Please enter a username" : "Choose a username"} style={{ height: "clamp(28px, 3.8vh, 40px)", fontSize: "clamp(11px, 3vh, 18px)" }} />
              </Form.Item>
            </div>

            {/* 📝 Password*/}
            <div style={{ position: "absolute", top: "14.5%", left: "43%", right: "26%" }}>
              <Form.Item name="password" rules={[{ required: true, message: "Please input your password!" }]}>
                <Input.Password className={`register-input${showErrors && !passwordVal ? " register-input-error" : ""}`} placeholder={showErrors && !passwordVal ? "Please enter a password" : "Choose a password"} style={{ height: "clamp(28px, 3.8vh, 40px)", fontSize: "clamp(11px, 3vh, 18px)" }} />
              </Form.Item>
            </div>

            {/* 📝 Bio */}
            <div className="register-bio-wrap" style={{ position: "absolute", top: "20.5%", left: "43%", right: "26%", height: "50%", overflow: "visible" }}>
              <Form.Item name="bio">
                <Input.TextArea
                  className="register-input"
                  maxLength={255}
                  placeholder="A few words about yourself..."
                  style={{ resize: "none", height: "calc(85vh * 0.45)", fontSize: "clamp(11px, 3vh, 18px)" }}
                />
              </Form.Item>
            </div>

            {/* 📝 Action buttons */}
            <div style={{ position: "absolute", top: "28%", left: "30%", display: "flex", flexDirection: "column", gap: "clamp(8px, 1.2vh, 14px)", alignItems: "center" }}>
              <Button
                className="register-submit-btn"
                htmlType="submit"
                style={{ width: "clamp(90px, 12vh, 130px)", height: "clamp(32px, 4.5vh, 46px)", fontSize: "clamp(10px, 1.4vh, 15px)", padding: 0 }}
              >
                Register
              </Button>
              <Button
                className="register-secondary-btn"
                onClick={() => router.push("/login")}
                style={{ width: "clamp(90px, 12vh, 130px)", height: "clamp(32px, 4.5vh, 46px)", fontSize: "clamp(10px, 1.4vh, 15px)", padding: 0 }}
              >
                Go to Login
              </Button>
            </div>

          </div>
        </Form>

      </main>
    </div>
  );
}
