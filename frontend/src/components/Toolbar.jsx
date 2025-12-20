import React, { useState } from 'react';
import { ChevronDown, EyeOff, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

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

    const handleFormat = (cmd) => {
        document.execCommand(cmd, false, null);
    };

    return (
        <div className="h-12 border-b border-gray-200 flex items-center px-4 bg-white justify-between z-40 sticky top-0">
            <div className="flex items-center gap-1">
                <ToolButton icon={<Bold size={16} />} title="Bold (Ctrl+B)" onClick={() => handleFormat('bold')} />
                <ToolButton icon={<Italic size={16} />} title="Italic (Ctrl+I)" onClick={() => handleFormat('italic')} />
                <ToolButton icon={<Underline size={16} />} title="Underline (Ctrl+U)" onClick={() => handleFormat('underline')} />
                <div className="w-px h-5 bg-gray-200 mx-2"></div>
                <ToolButton icon={<AlignLeft size={16} />} title="Align Left" onClick={() => handleFormat('justifyLeft')} />
                <ToolButton icon={<AlignCenter size={16} />} title="Align Center" onClick={() => handleFormat('justifyCenter')} />
                <ToolButton icon={<AlignRight size={16} />} title="Align Right" onClick={() => handleFormat('justifyRight')} />
                <ToolButton icon={<AlignJustify size={16} />} title="Justify" onClick={() => handleFormat('justifyFull')} />
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
            onMouseDown={(e) => e.preventDefault()}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900"
            title={title}
        >
            {icon}
        </button>
    )
}
