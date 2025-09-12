import React from 'react';
import { Outlet } from 'react-router-dom';
import { SettingsSidebar } from '../../widgets/settings-sidebar';

export const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex">
            <SettingsSidebar />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};