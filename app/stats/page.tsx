"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useActiveSessionCheck } from "@/hooks/useActiveSessionCheck";
import ActiveSessionModal from "@/components/ActiveSessionModal";


export default function Page() {
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [isMounted, setIsMounted] = useState(false);
  const { modalVisible, sessionType, handleRejoin } = useActiveSessionCheck();

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMounted) return;
    if (!token || !userId) { router.push("/login"); return; }
  }, [isMounted, token, userId, router]);

  if (!isMounted) return null;

  return (
    <div>
      <ActiveSessionModal
          modalVisible={modalVisible}
          sessionType={sessionType}
          handleRejoin={handleRejoin}
      />

    </div>
  );
}