import { Home, FileText, Database, Settings, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: Home, path: "/" },
  { label: "Aanbestedingen", icon: FileText, path: "/aanbestedingen" },
  { label: "Kennisbank", icon: Database, path: "/kennisbank" },
  { label: "Instellingen", icon: Settings, path: "/instellingen" },
];

const AppSidebar = () => {
  return (
    <aside className="w-64 min-h-screen bg-primary flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">Anjer</h1>
        <p className="text-sm italic text-primary-foreground/70 mt-0.5">Maakt het beter schoon</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-primary-foreground/15">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-foreground">Tenderschrijver</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
