import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

export const BottomNav: React.FC = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel text-slate-400 border-t border-slate-800/80 z-50 px-2 py-1.5 shadow-2xl shadow-slate-950 select-none">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition-all duration-150 active:scale-90 ${
                  isActive
                    ? 'text-blue-400 bg-blue-500/10 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span>{item.label.replace(' 대시보드', '').replace(' 관리', '')}</span>
                  {isActive && (
                    <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
