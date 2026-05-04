'use client';

import React from 'react';
import TabBar from './TabBar';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Whether this page shows the TabBar. Default true for authenticated pages. */
  showTabBar?: boolean;
  /** Additional classes for the main container */
  className?: string;
  /** Custom gradient background, defaults to amber-to-orange */
  bgGradient?: string;
}

export default function AppLayout({
  children,
  showTabBar = true,
  className = '',
  bgGradient = 'from-amber-50 to-orange-50',
}: AppLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} ${className}`}>
      <div className={`max-w-lg mx-auto ${showTabBar ? 'pb-20' : ''}`}>
        {children}
      </div>
      {showTabBar && <TabBar />}
    </div>
  );
}
