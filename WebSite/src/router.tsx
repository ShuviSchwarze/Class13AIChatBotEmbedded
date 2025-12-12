import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, redirect } from "react-router";
import App from "./App";
import ErrorPage from "./pages/error/ErrorPage";
import InnerErrorPage from "./pages/error/InnerErrorPage";

const ChatLayout = lazy(() => import("./pages/chat/ChatLayout"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const PdfViewerPage = lazy(() => import("./pages/pdf-viewer/PdfViewerPage"));
const DocumentManager = lazy(() => import("./pages/documents/DocumentManager"));

export const Screen = {
  chat: "/chat",
  documents: "/documents",
  pdfViewer: "/pdf-viewer"
};

export default createBrowserRouter([
  {
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        loader: ({ request }) => {
          const url = new URL(request.url);
          if (url.search) {
            return null;
          }
          return redirect(Screen.chat);
        },
        element: <PdfViewerPage />,
        errorElement: <InnerErrorPage />
      },
      {
        path: Screen.chat,
        element: <ChatLayout />,
        children: [
          {
            index: true,
            element: <ChatPage />,
            errorElement: <InnerErrorPage />
          }
        ]
      },
      {
        path: Screen.pdfViewer,
        element: <PdfViewerPage />
      },
      {
        path: Screen.documents,
        element: <DocumentManager />
      }
    ]
  }
]);
