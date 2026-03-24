"use client";

import { useEffect, useState } from "react"; // 📝 mount gate to prevent reading localStorage before it's available
import { Button } from "antd";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";

export default function ProfileButton() {
    const router = useRouter();
    const { value: token } = useLocalStorage<string>("token", "");
    const { value: userId } = useLocalStorage<string>("userId", "");

    // 📝 mount gate -> don't read localStorage before it's available (prevents hydration mismatch)
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    const handleClick = () => {
        if (token && userId) {
            router.push(`/users/${userId}`);
        } else {
            router.push("/login");
        }
    };

    // 📝 don't render until mounted to avoid hydration mismatch with localStorage
    if (!isMounted) return null;

    return (
        <div style={{ position: "fixed", top: 16, right: 60, zIndex: 1000 }}>
            <Button
                onClick={handleClick}
                style={{ padding: "8px 28px", fontSize: "20px", height: "auto" }}
            >Profile</Button>
        </div>
    );
}
