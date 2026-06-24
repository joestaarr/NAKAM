import { motion } from "motion/react";
import { Home, UtensilsCrossed, Calendar, User } from "lucide-react";

type TabId = "home" | "restaurants" | "history" | "profile";

interface BottomNavBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNavBar({ activeTab, onChange }: BottomNavBarProps) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
    { id: "history", label: "History", icon: Calendar },
    { id: "profile", label: "Profile", icon: User },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] px-6 py-2 pb-safe md:max-w-md md:mx-auto">
      <div className="flex justify-between items-center h-14">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-16 h-full gap-1"
            >
              <div className="relative">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors duration-300 ${
                    isActive ? "text-[#FF6B1A]" : "text-gray-400"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] transition-colors duration-300 ${
                  isActive ? "text-[#FF6B1A] font-bold" : "text-gray-400 font-medium"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
