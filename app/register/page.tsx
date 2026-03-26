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
  const [bioLength, setBioLength] = useState(0);
  const {
    value: token,
    set: setToken,
    clear: clearToken,
  } = useLocalStorage<string>("token", "");
  const {
    value: userId,
    set: setUserId,
    clear: clearUserId,
  } = useLocalStorage<string>("userId", ""); // 📝 store id so /login and /register can redirect to profile

  // 📝 mount gate -> don't redirect before localStorage values are available (prevents redirect loops)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // 📝 if user is already logged in (token exists), redirect away from /register
  useEffect(() => {
    if (!isMounted) return;

    // 📝 redirect logged-in users to their own profile page
    if (token && userId) router.replace("/");
    else if (token && !userId) {
      clearToken(); // 📝 if token exists but userId is missing, clear the token to prevent redirect loops to /login, which would happen because the app would keep trying to use the invalid token and getting 401 responses, thus clearing the token ensures that the app will redirect to /login and prompt the user to log in again, thus obtaining a new valid token with a userId.
      clearUserId(); // 📝 to clear userId if it exists without token, to prevent redirect loops to /login. This can happen if the token is manually removed from localStorage while the userId remains, which would cause the app to keep trying to redirect to /users/[userId] and getting 401 responses, thus clearing the userId ensures that the app will redirect to /login and prompt the user to log in again, thus obtaining a new valid token with a userId.
    }
  }, [isMounted, token, userId, router, clearToken, clearUserId]); // 📝 added clearToken and clearUserId to dependency array to prevent eslint warnings

  const onFinish = async (values: RegisterForm) => {
    try {
      // register
      const created = await api.post("/users", values); // created user info not used, but it is needed to create the user in the backend and set ONLINE (auto-login)
      // login
      const loginRes = await api.post<{ id: number; token: string }>(
        "/users/login",
        {
          username: values.username,
          password: values.password,
        },
      );
      //📝 store token and navigate to user
      setToken(loginRes.token);
      setUserId(String(loginRes.id));
      router.replace("/"); // 📝replace vs push to prevent going back to /register after successful registration and login
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
  // 📝 while redirecting (already logged in), do not render the register form
  if (!isMounted) {
    return (
      <>
        <HomeButton />
        <div style={{ maxWidth: 520, margin: "40px auto" }}>Loading...</div>
      </>
    );
  }
  if (token && userId) {
    return (
      <>
        <HomeButton />
        <div className="register-container">Redirecting...</div>
      </>
    );
  }
  return (
    <>
      <HomeButton />
      <div className="login-container">
        <div style={{
          width: 480,
          background: "rgba(255,255,255,0.09)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 1,
          padding: "12px 24px 16px",
          fontFamily: "var(--font-cinzel), serif",
          color: "#ffffff",
        }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: "bold" }}>Register</div>
            <div style={{ fontSize: 16, marginTop: 4 }}>Please choose a username and password:</div>
          </div>
        <Form
          form={form}
          name="register"
          size="large"
          variant="outlined"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            name="bio"
            rules={[{ required: false, message: "Please enter a short bio!" }]}
          >
            <div style={{ position: "relative" }}>
              <Input.TextArea
                rows={6}
                maxLength={500}
                placeholder="Enter a short bio"
                style={{ resize: "none", paddingBottom: 20 }}
                onChange={(e) => setBioLength(e.target.value.length)}
              />
              <span style={{ position: "absolute", bottom: 6, right: 10, fontSize: 12, color: "#aaa", pointerEvents: "none" }}>
                {bioLength} / 500
              </span>
            </div>
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                style={
                  {
                    ["--btn-bg" as string]: "#0cd244",
                    width: 130,
                    height: 50,
                    padding: 0,
                    fontSize: "17px",
                  } as React.CSSProperties
                }
                onClick={() => router.push("/login")}
              >
                Go to Login
              </Button>
              <Button
                htmlType="submit"
                style={
                  {
                    ["--btn-bg" as string]: "#4aa3d4",
                    width: 110,
                    height: 50,
                    padding: 0,
                    fontSize: "20px",
                  } as React.CSSProperties
                }
              >
                Register
              </Button>
            </div>
          </Form.Item>
        </Form>
        </div>
      </div>
    </>
  );
}
