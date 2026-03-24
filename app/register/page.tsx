"use client";

import React, { useEffect, useState } from "react"; // 📝 redirect logic and mount gate
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input } from "antd";
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
    const { value: userId, set: setUserId, clear: clearUserId } = useLocalStorage<string>("userId", ""); // 📝 store id so /login and /register can redirect to profile
    
    // 📝 mount gate -> don't redirect before localStorage values are available (prevents redirect loops)
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    // 📝 if user is already logged in (token exists), redirect away from /register
    useEffect(() => {
    if (!isMounted) return;

    // 📝 redirect logged-in users to their own profile page
    if (token && userId) router.replace(`/users/${userId}`);
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
        "/login",
        {
        username: values.username,
        password: values.password,
        },
    );
    //📝 store token and navigate to user 
    setToken(loginRes.token);
    setUserId(String(loginRes.id));
    router.replace(`/users/${loginRes.id}`); // 📝replace vs push to prevent going back to /register after successful registration and login
    } catch (e) {
    alert(
        `Registration failed: ${e instanceof Error ? e.message : String(e)}`,
    );
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
// The form layout and fields can be further customized as needed:
return (
        <>
        <HomeButton />
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
    <h2>Register</h2>

    <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
        name="username"
        label="Username"
        rules={[{ required: true }]}
        >
        <Input />
        </Form.Item>

        <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true }]}
        >
        <Input.Password />
        </Form.Item>

        <Form.Item name="bio" label="Bio" rules={[{ required: true }]}>
        <Input.TextArea rows={3} maxLength={500} />
        </Form.Item>

        <Button
        type="primary"
        htmlType="submit">
        Create account
        </Button>

        <Button
        type="primary"
        style={{ marginLeft: 15, backgroundColor: "#003983", borderColor: "#ffffff" }}
        onClick={() => router.push("/login")}
>
        Back to login
        </Button>
    </Form>
    </div>
    </>
);
}