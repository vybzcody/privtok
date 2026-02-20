import "./App.css";
import React from "react";
import { App, ConfigProvider, Layout, theme } from "antd";
import { Outlet } from "react-router-dom";
import { ContentViewer } from "./components/viewer/ContentViewer.jsx";
import Header from "./components/layout/Header.jsx";

const { Content } = Layout;

function Main() {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: "#FF0000",
                    fontFamily: "'Space Grotesk', sans-serif",
                },
            }}
        >
            <App>
                <Layout style={{ minHeight: "100vh", background: "#121212" }}>
                    <Header />

                    <Content style={{
                        padding: "120px 40px 40px", // Top padding to clear fixed header
                        margin: "0 auto",
                        width: '100%',
                        maxWidth: "1300px"
                    }}>
                        <Outlet />
                    </Content>

                    {/* Content Viewer Modal */}
                    <ContentViewer />
                </Layout>
            </App>
        </ConfigProvider>
    );
}

export default Main;