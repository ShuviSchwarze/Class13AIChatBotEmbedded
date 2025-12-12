import React, { Suspense } from "react";
import LoadingPage from "./pages/loading/LoadingPage";
import { Outlet } from "react-router";
import { ChatProvider } from "./pages/chat/contexts";

export default function App() {
  return (
    <ChatProvider>
      <Suspense fallback={<LoadingPage />}>
        <Outlet />
      </Suspense>
    </ChatProvider>
  );
}
