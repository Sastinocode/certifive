import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  IdCard, 
  Building, 
  BarChart, 
  Settings, 
  Leaf, 
  User,
  LogOut
} from "lucide-react";

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ selectedTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "certificates", label: "Certificados", icon: IdCard, path: "/certificados" },
    { id: "properties", label: "Propiedades", icon: Building, path: "/propiedades" },
    { id: "reports", label: "Informes", icon: BarChart, path: "/informes" },
    { id: "settings", label: "Configuración", icon: Settings, path: "/configuracion" },
  ];

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">CertificoEnergia</h1>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || selectedTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setLocation(item.path);
                  onTabChange(item.id);
                }}
                className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "Usuario"
                }
              </p>
              <p className="text-xs text-gray-500">Certificador</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
