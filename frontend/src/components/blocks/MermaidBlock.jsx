import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Edit2, Eye, AlertCircle } from 'lucide-react';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
});

export default function MermaidBlock({ block, onUpdate }) {
    const [isEditing, setIsEditing] = useState(!block.content); // Default to edit if empty
    const [svgContent, setSvgContent] = useState('');
    const [error, setError] = useState(null);
    const containerRef = useRef(null);
    const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

    const renderDiagram = async () => {
        if (!block.content) {
             setSvgContent('');
             return;
        }
        try {
            setError(null);
            // We must clear the container or render returns ID collision if we are not careful?
            // mermaid.render returns { svg }.
            // We use a unique ID for the container.
            const { svg } = await mermaid.render(idRef.current, block.content);
            setSvgContent(svg);
        } catch (err) {
            console.error("Mermaid render error:", err);
            setError(err.message || 'Syntax Error');
            // Mermaid often leaves error text in the DOM, cleaning it up might be needed but render usually handles it or throws.
        }
    };

    useEffect(() => {
        if (!isEditing) {
            renderDiagram();
        }
    }, [isEditing, block.content]);

    const handleBlur = () => {
        // Optional: auto-switch to view on blur if content exists?
        // User asked for explicit toggle, so let's stick to the button.
    };

    return (
        <div className="relative border border-gray-200 rounded-lg p-2 my-2 group bg-white">
            {/* Toolbar for the block */}
            <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 bg-white border border-gray-200 shadow-sm rounded hover:bg-gray-50 text-gray-600"
                    title={isEditing ? "Preview" : "Edit Code"}
                >
                    {isEditing ? <Eye size={16} /> : <Edit2 size={16} />}
                </button>
            </div>

            {isEditing ? (
                <div className="w-full">
                    <textarea
                        className="w-full h-48 p-2 font-mono text-sm bg-gray-50 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                        value={block.content || ''}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        placeholder="graph TD; A-->B;"
                        onBlur={handleBlur}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                        Enter Mermaid syntax. Click the eye icon to preview.
                    </div>
                </div>
            ) : (
                <div className="min-h-[100px] flex items-center justify-center overflow-x-auto">
                    {error ? (
                        <div className="flex items-center gap-2 text-red-500 text-sm p-4">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    ) : (
                        <div
                            ref={containerRef}
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                            className="mermaid-output"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
