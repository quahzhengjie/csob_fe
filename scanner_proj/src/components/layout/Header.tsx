// =================================================================================
// FILE: src/components/layout/Header.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Moon, Sun, Home, Users, Settings, ClipboardList, UserPlus, Menu, X, ListTodo
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useHasPermission } from '@/features/rbac/usePermission';
import { useEnumStore } from '@/features/enums/useEnumStore';
import { UserInfoPopover } from '@/components/common/UserInfoPopover';

const useSessionManager = () => {
    const [currentUserRole, setCurrentUserRole] = useState('ROLE_MANAGER'); // Default to backend role name
    const roles = useEnumStore(s => s.roles);
    
    const setRole = (roleKey: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('currentUserRole', roleKey);
            window.location.reload();
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedRole = localStorage.getItem('currentUserRole');
            if (storedRole && roles[storedRole]) {
                setCurrentUserRole(storedRole);
            }
        }
    }, [roles]);

    return { currentUserRole, setRole };
};

export function Header() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { currentUserRole, setRole } = useSessionManager();
  const userRoles = useEnumStore(s => s.roles);
  const pathname = usePathname();
  const hasPermission = useHasPermission();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home, permission: null },
    { href: '/my-tasks', label: 'My Tasks', icon: ListTodo, permission: null },
    { href: '/cases', label: 'Cases', icon: Users, permission: 'case:read' },
    { href: '/review-queue', label: 'Review Queue', icon: ClipboardList, permission: 'case:approve' },
    { href: '/templates', label: 'Templates', icon: Settings, permission: 'admin:manage-templates' },
    { href: '/users', label: 'Users', icon: UserPlus, permission: 'admin:manage-users' },
  ];
  
  // Improvement: Filter links before rendering for better security
  const accessibleNavLinks = navLinks.filter(({ permission }) => 
    !permission || hasPermission(permission)
  );

  const renderNavLinks = (isMobile = false) => {
    return accessibleNavLinks.map(({ href, label, icon: Icon }) => {
      const isActive = pathname === href;
      
      return (
        <Link
          key={href}
          href={href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
              ? 'bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
          } ${isMobile ? 'text-base' : ''}`}
        >
          <Icon size={16} />
          {label}
        </Link>
      );
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 dark:bg-slate-900/80 border-gray-200 dark:border-slate-700 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            {/* === LOGO UPDATE START === */}
            <Link href="/" className="flex items-center">
              {darkMode ? (
                <img
                  src="https://www.bangkokbank.com/-/media/feature/identity/bbl-corporate/site-logos/logo.svg?iar=0&sc_lang=en&hash=C493D3DC5FBF94ED5448BFE881213ABE"
                  alt="Bangkok Bank Logo"
                  className="h-8 w-auto"
                />
              ) : (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Bangkok_Bank_2023_%28English_version%29.svg/2880px-Bangkok_Bank_2023_%28English_version%29.svg.png"
                  alt="Bangkok Bank Logo"
                  className="h-8 w-auto"
                />
              )}
            </Link>
            {/* === LOGO UPDATE END === */}
            <nav className="hidden md:flex items-center gap-1">
              {renderNavLinks()}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserInfoPopover 
              currentUserRole={currentUserRole} 
              userRoles={userRoles} 
            />
            
            <select
              value={currentUserRole}
              onChange={(e) => setRole(e.target.value)}
              className="h-9 text-sm rounded-md border-gray-300 dark:bg-slate-800 dark:border-slate-600 focus:ring-blue-500"
              aria-label="Select user role"
            >
                {Object.entries(userRoles).map(([key, role]) => (
                    <option key={key} value={key}>{role.label}</option>
                ))}
            </select>
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label={darkMode ? 'Activate light mode' : 'Activate dark mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="md:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                  className="p-2"
                  aria-label="Toggle mobile menu"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden">
            <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {renderNavLinks(true)}
            </nav>
        </div>
      )}
    </header>
  );
}