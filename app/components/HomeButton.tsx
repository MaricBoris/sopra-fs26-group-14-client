// Use components folder to store reusable elements to import on other pages.

"use client";

import { Button } from "antd";
import { useRouter } from "next/navigation";

// simple button that is fixed at the top left corner of the page, and when clicked, it navigates the user to the home page ("/") using the Next.js router.
export default function HomeButton() {
    const router = useRouter();

    return (
    <div style={{ position: "fixed", top: 16, left: 16, zIndex: 1000 }}>
        <Button onClick={() => router.push("/")} style={{ width: 110, height: 50, padding: 0, fontSize: "20px" }}>Home</Button>
    </div>
    );
}


