import { Outlet, useNavigate } from "react-router-dom";
import "./dashboardLayout.css";
import { useEffect } from "react";
import ChatList from "../../components/chatList/ChatList";

const DashboardLayout = () => {
  const navigate = useNavigate();

  // Assuming the user is already authenticated for simplicity
  useEffect(() => {
    // Simulate checking user authentication (replace with actual logic as needed)
    const userAuthenticated = true; // Set this to true or replace with your authentication logic

    if (!userAuthenticated) {
      navigate("/sign-in"); // Redirect to sign-in if not authenticated
    }
  }, [navigate]);

  return (
    <div className="dashboardLayout">
      <div className="menu">
        <ChatList />
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
