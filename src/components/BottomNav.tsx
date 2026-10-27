import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Package, User } from 'lucide-react';

const items = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/ordenes', icon: ClipboardList, label: 'Órdenes' },
  { path: '/inventario', icon: Package, label: 'Inventario' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
