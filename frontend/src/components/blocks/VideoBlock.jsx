import React from 'react';
import { Repeat, Maximize2, Minimize2, Monitor } from 'lucide-react';

export default function VideoBlock({ block, onUpdate }) {
    if (!block.content) {
        return <div className="p-4 bg-gray-50 border border-dashed rounded text-gray-400">Empty Video</div>;
    }

    const loop = block.loop || false;
    const size = block.size || 'full';

    const toggleLoop = () => {
        onUpdate({ loop: !loop });
    };

    const setSize = (newSize) => {
        onUpdate({ size: newSize });
    };

    const getSizeClass = () => {
        switch (size) {
            case 'small': return 'max-w-sm';
            case 'medium': return 'max-w-2xl';
            case 'full': default: return 'w-full';
        }
    };

    return (
        <div className={`my-4 relative group ${getSizeClass()} mx-auto transition-all duration-300`}>
            {/* Toolbar */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1 border border-white/10 shadow-lg">
                <button
                    onClick={toggleLoop}
                    className={`p-1.5 rounded hover:bg-white/20 transition-colors ${loop ? 'text-blue-400' : 'text-white/70'}`}
                    title={loop ? "Loop: ON" : "Loop: OFF"}
                >
                    <Repeat size={16} />
                </button>

                <div className="w-px bg-white/20 mx-1 self-center h-4" />

                <button
                    onClick={() => setSize('small')}
                    className={`p-1.5 rounded hover:bg-white/20 transition-colors ${size === 'small' ? 'text-white bg-white/20' : 'text-white/70'}`}
                    title="Small Width"
                >
                    <Minimize2 size={16} />
                </button>
                <button
                    onClick={() => setSize('medium')}
                    className={`p-1.5 rounded hover:bg-white/20 transition-colors ${size === 'medium' ? 'text-white bg-white/20' : 'text-white/70'}`}
                    title="Medium Width"
                >
                    <Monitor size={16} />
                </button>
                <button
                    onClick={() => setSize('full')}
                    className={`p-1.5 rounded hover:bg-white/20 transition-colors ${size === 'full' ? 'text-white bg-white/20' : 'text-white/70'}`}
                    title="Full Width"
                >
                    <Maximize2 size={16} />
                </button>
            </div>

            <video
                src={block.content}
                controls
                loop={loop}
                className="w-full rounded-lg shadow-sm bg-black aspect-video"
                preload="metadata"
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
