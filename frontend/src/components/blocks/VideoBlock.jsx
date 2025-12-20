import React from 'react';

export default function VideoBlock({ block, onUpdate }) {
    if (!block.content) {
        return <div className="p-4 bg-gray-50 border border-dashed rounded text-gray-400">Empty Video</div>;
    }

    return (
        <div className="my-4">
            <video
                src={block.content}
                controls
                className="w-full max-h-[600px] bg-black rounded-lg"
                preload="metadata"
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
}
