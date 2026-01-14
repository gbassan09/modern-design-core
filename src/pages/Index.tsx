import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import DashboardScreen from "@/components/screens/DashboardScreen";
import InvoicesScreen from "@/components/screens/InvoicesScreen";
import NewExpenseScreen from "@/components/screens/NewExpenseScreen";
import HistoryScreen from "@/components/screens/HistoryScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <DashboardScreen />;
      case "invoices":
        return <InvoicesScreen />;
      case "new":
        return <NewExpenseScreen />;
      case "history":
        return <HistoryScreen />;
      case "profile":
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-md">
        {renderScreen()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
