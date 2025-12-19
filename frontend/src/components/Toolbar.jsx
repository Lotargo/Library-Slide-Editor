import React, { useState } from 'react';
import { ChevronDown, EyeOff, Bold, Italic, Underline } from 'lucide-react';
import clsx from 'clsx';

export default function Toolbar() {
    const [hidden, setHidden] = useState(false);

    if (hidden) {
        return (
            <div className="absolute top-4 right-8 z-50 opacity-0 hover:opacity-100 transition-opacity">
                 <button
                    onClick={() => setHidden(false)}
                    className="p-2 bg-white shadow-md rounded-full text-gray-400 hover:text-gray-900 border border-gray-200 transition-all"
                    title="Show Toolbar"
                 >
                    <ChevronDown size={20} />
                 </button>
            </div>
        )
    }

    return (
        <div className="h-12 border-b border-gray-200 flex items-center px-4 bg-white justify-between z-40 sticky top-0">
            <div className="flex items-center gap-1">
                <ToolButton icon={<Bold size={16} />} title="Bold (Ctrl+B)" />
                <ToolButton icon={<Italic size={16} />} title="Italic (Ctrl+I)" />
                <ToolButton icon={<Underline size={16} />} title="Underline (Ctrl+U)" />
                <div className="w-px h-5 bg-gray-200 mx-2"></div>
                <select className="text-sm border-none bg-transparent hover:bg-gray-100 rounded px-2 py-1 outline-none">
                    <option>Inter</option>
                    <option>Serif</option>
                    <option>Mono</option>
                </select>
                <input type="number" defaultValue={16} className="w-12 text-sm border border-gray-200 rounded px-1 py-0.5 ml-2" />
            </div>

            <button
                onClick={() => setHidden(true)}
                className="text-gray-400 hover:text-gray-900 text-xs flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded"
            >
                <EyeOff size={14} />
                Hide Toolbar
            </button>
        </div>
    );
}

function ToolButton({ icon, title, onClick }) {
    return (
        <button
            onClick={onClick}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            title={title}
        >
            {icon}
        </button>
    )
}
