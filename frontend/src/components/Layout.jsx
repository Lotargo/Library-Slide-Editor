import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ChevronRight } from 'lucide-react';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen overflow-hidden bg-white relative">
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 relative border-r border-gray-200 ${sidebarOpen ? 'w-64' : 'w-0 border-none'}`}
            >
                 <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {!sidebarOpen && (
                 <div
                    className="absolute left-0 top-0 bottom-0 w-6 z-50 group flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSidebarOpen(true)}
                    title="Show Sidebar"
                 >
                      <div className="opacity-0 group-hover:opacity-100 p-1.5 bg-white border border-gray-200 shadow-md rounded-full text-gray-500 transform translate-x-2 transition-opacity">
                          <ChevronRight size={16} />
                      </div>
                 </div>
            )}

            <main className="flex-1 overflow-hidden relative flex flex-col">
                <Outlet />
            </main>
        </div>
    );
}
