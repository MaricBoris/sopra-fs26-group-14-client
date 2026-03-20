"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { BookOutlined, CodeOutlined, GlobalOutlined } from "@ant-design/icons";
import styles from "@/styles/page.module.css";

export default function Home() {
  return (
      <div className={styles.page} style={{ backgroundColor: "#4169e1" }} >
      <main className={styles.main}>
        <h1>SoPra FS26 Group 14</h1>
      </main>
    </div>
  );
}


