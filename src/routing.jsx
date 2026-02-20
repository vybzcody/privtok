import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Main from "./main.jsx";
import Landing from "./pages/Landing.jsx";
import { ErrorPage } from "./pages/ErrorPage.jsx";
import { CreatorStudio } from "./components/CreatorStudio.jsx";
import { ContentHub } from "./components/ContentHub.jsx";
// import { Library } from "./components/Library.jsx";
import { Upload } from "./pages/Upload.jsx";
import { CreatorProfile } from "./pages/CreatorProfile.jsx";
import Messages from "./pages/Messages.jsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Landing />,
        errorElement: <ErrorPage />,
    },
    {
        element: <Main />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/studio",
                element: <CreatorStudio />,
            },
            {
                path: "/upload",
                element: <Upload />,
            },
            {
                path: "/hub",
                element: <ContentHub />,
            },
            {
                path: "/creator/:creatorId",
                element: <CreatorProfile />,
            },
            {
                path: "/messages",
                element: <Messages />,
            },

        ],
    },
]);
