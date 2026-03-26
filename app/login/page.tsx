"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react"; // useEffect/useState for redirect logic and mount gate
import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input } from "antd";
import HomeButton from "../components/HomeButton";

// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

type LoginForm = {
  username: string;
  password: string;
};

type LoginResponse = {
  id: number;
  token: string;
};

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    value: token, // if token exists, user is already logged in and should be redirected away from /login
    set: setToken, // we need this method to set the value of the token to the one we receive from the POST request to the backend server API
    clear: clearToken, // used to clear the token if it exists without a userId, to prevent redirect loops
  } = useLocalStorage<string>("token", ""); // note that the key we are selecting is "token" and the default value we are setting is an empty string
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  // store the logged-in user's id to redirect to /users/[id] even after refresh
  const {
    value: userId, // used for redirecting logged-in users to their own profile page
    set: setUserId, // store the id after successful login
    clear: clearUserId, // to clear userId on logout
  } = useLocalStorage<string>("userId", "");

  // mount gate -> don't redirect before localStorage value is available (prevents redirect loops)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // if user is already logged in (token exists), redirect away from /login
  useEffect(() => {
    if (!isMounted) return;

    if (token && userId) router.replace(`/users/${userId}`); // redirect logged-in users to their own profile page
    else if (token && !userId) {
      clearToken(); // if token exists but userId is missing, clear the token to prevent redirect loops to /login, which would happen because the app would keep trying to use the invalid token and getting 401 responses, thus clearing the token ensures that the app will redirect to /login and prompt the user to log in again, thus obtaining a new valid token with a userId.
      clearUserId(); // to clear userId if it exists without token, to prevent redirect loops to /login. This can happen if the token is manually removed from localStorage while the userId remains, which would cause the app to keep trying to redirect to /users/[userId] and getting 401 responses, thus clearing the userId ensures that the app will redirect to /login and prompt the user to log in again, thus obtaining a new valid token with a userId.
    }
  }, [isMounted, token, userId, router, clearToken, clearUserId]); // added clearToken and clearUserId to dependency array to prevent eslint warnings

  const handleLogin = async (values: LoginForm) => {
    try {
      // Call the API service and let it handle JSON serialization and error handling
      const response = await apiService.post<LoginResponse>("/users/login", values);

      // Use the useLocalStorage hook that returned a setter function (setToken) to store the token if available
      if (response.token) {
        setToken(response.token);
      }

      // store the user id so future visits to /login can redirect to /users/[id]
      setUserId(String(response.id));

      // Navigate to the user's profile page — use replace to avoid going back to /login after successful login
      router.replace(`/users/${response.id}`);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the login:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during login.");
      }
    }
  };

  // while redirecting (already logged in), do not render the empty login form
  if (!isMounted) {
    return (
      <>
        <HomeButton />
        <div className="login-container">Loading...</div>
      </>
    );
  }
  if (token && userId) {
    return (
      <>
        <HomeButton />
        <div className="login-container">Redirecting...</div>
      </>
    );
  }

  return (
    <>
      <HomeButton />
      <div className="login-container">
        <Form
          form={form}
          name="login"
          size="large"
          variant="outlined"
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username:"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password:"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              style={{ marginLeft: 0, backgroundColor: "#003983", borderColor: "#ffffff" }}
              htmlType="submit"
              className="login-button"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
};

export default Login; // default export for NextJS page, so it can be rendered when visiting /login
