"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input, notification } from "antd";
import { ApplicationError } from "@/types/error";
import HomeButton from "../components/HomeButton";

type LoginForm = {
  username: string;
  password: string;
};

type LoginResponse = {
  id: number;
  token: string;
};

const LoginPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
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

  // 📝 redirect logged-in users away from /login
  useEffect(() => {
    if (!isMounted) return;
    if (token && userId) router.replace("/");
    else if (token && !userId) { clearToken(); clearUserId(); }
  }, [isMounted, token, userId, router, clearToken, clearUserId]);

  const handleLogin = async (values: LoginForm) => {
    setShowErrors(false);
    try {
      const response = await apiService.post<LoginResponse>("/users/login", values);
      if (response.token) setToken(response.token);
      setUserId(String(response.id));
      router.replace("/");
    } catch (error) {
      const err = error as ApplicationError;
      const status = err.status ?? "Error";
      const descriptions: Record<number, string> = {
        401: "Invalid username or password.",
        400: "Username and password cannot be empty.",
      };
      notification.error({
        title: `Login failed (${status})`,
        description: descriptions[err.status] ?? err.message ?? String(error),
        placement: "topRight",
      });
    }
  };

  if (!isMounted) return <><HomeButton /><div style={{ maxWidth: 520, margin: "40px auto" }}>Loading...</div></>;
  if (token && userId) return <><HomeButton /><div style={{ maxWidth: 520, margin: "40px auto" }}>Redirecting...</div></>;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* 📝 Fixed full-screen background */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url('/login_wp_jgl_04.png')", backgroundSize: "cover", backgroundPosition: "center", zIndex: -1 }} />
      <HomeButton />

      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, paddingBottom: 40 }}>

        {/* 📝 Page title */}
        <h1 className="login-title" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: 4 }}>
          LOGIN
        </h1>
        <div className="login-title-divider" style={{ position: "relative", transform: "none", left: "auto", top: "auto", marginBottom: -15 }}>✦</div>

        {/* 📝 Frame — height-driven, portrait 1086×1448 */}
        <Form form={form} name="login" onFinish={handleLogin} onFinishFailed={() => setShowErrors(true)} className="login-form" validateTrigger="onSubmit">
          <div style={{ position: "relative", height: "90vh", aspectRatio: "1086 / 1448", maxWidth: "95vw" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/login_finalv.png" alt="Login frame" style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none", userSelect: "none" }} />

            {/* 📝 Username */}
            <div style={{ position: "absolute", top: "53.5%", left: "10%", right: "10%" }}>
              <Form.Item name="username" rules={[{ required: true, message: "Input your username!" }]}>
                <Input className={`login-input${showErrors && !usernameVal ? " login-input-error" : ""}`} placeholder={showErrors && !usernameVal ? "Enter a username" : "Enter username"} style={{ height: "clamp(28px, 3.8vh, 40px)", fontSize: "clamp(18px, 3vh, 27px)" }} />
              </Form.Item>
            </div>

            {/* 📝 Password */}
            <div style={{ position: "absolute", top: "59.5%", left: "10%", right: "10%" }}>
              <Form.Item name="password" rules={[{ required: true, message: "Input your password!" }]}>
                <Input.Password className={`login-input${showErrors && !passwordVal ? " login-input-error" : ""}`} placeholder={showErrors && !passwordVal ? "Enter a password" : "Enter password"} style={{ height: "clamp(28px, 3.8vh, 40px)", fontSize: "clamp(18px, 3vh, 27px)" }} />
              </Form.Item>
            </div>

            {/* 📝 Action buttons */}
            <div style={{ position: "absolute", top: "82.9%", left: 0, right: 0, display: "flex", flexDirection: "row", gap: "clamp(8px, 1.2vh, 14px)", justifyContent: "center" }}>
              <Button
                className="login-secondary-btn"
                onClick={() => router.push("/register")}
                style={{ width: "clamp(90px, 11vh, 130px)", height: "clamp(32px, 4vh, 46px)", fontSize: "clamp(10px, 1.4vh, 15px)", padding: 0 }}
              >
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}><span>Go to</span><span>Register</span></span>
              </Button>
              <Button
                className="login-submit-btn"
                htmlType="submit"
                style={{ width: "clamp(90px, 11vh, 130px)", height: "clamp(32px, 4vh, 46px)", fontSize: "clamp(10px, 1.4vh, 15px)", padding: 0 }}
              >
                Login
              </Button>
            </div>

          </div>
        </Form>

      </main>
    </div>
  );
};

export default LoginPage;
