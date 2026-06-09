import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar.jsx";
import ChatWindow from "../pages/ChatWindow.jsx";
import GroupChatWindow from "../pages/GroupChatWindow.jsx";
import WelcomeScreen from "../pages/WelcomeScreen.jsx";
import Settings from "../pages/Settings.jsx";

const ChatLayout = () => {
  return (
    // overflow-hidden sirf yahan — chat UI ke andar hi rehna chahiye
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/chat/:userId" element={<ChatWindow />} />
          <Route path="/group/:groupId" element={<GroupChatWindow />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
};

export default ChatLayout;
