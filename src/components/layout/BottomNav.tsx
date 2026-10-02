import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

export const BottomNav: React.FC = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50 px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] select-none">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[11px] font-bold transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-blue-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110 text-blue-500' : 'text-gray-400'}`} />
                  <span>{item.label.replace(' 대시보드', '').replace(' 관리', '')}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
