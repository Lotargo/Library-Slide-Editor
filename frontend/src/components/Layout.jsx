import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="flex h-screen overflow-hidden bg-white">
            <Sidebar />
            <main className="flex-1 overflow-hidden relative flex flex-col">
                <Outlet />
            </main>
        </div>
    );
}
