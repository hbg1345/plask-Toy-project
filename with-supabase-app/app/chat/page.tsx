"use client";
import { Suspense } from "react";
import ChatComponent from "./ChatComponent";

export default function Page() {
  return (
    <Suspense>
      <ChatComponent />
    </Suspense>
  );
}
