import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Edit2, Eye, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

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
            {isEditing ? (
                <>
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-1 bg-white border border-gray-200 shadow-sm rounded hover:bg-gray-50 text-gray-600"
                            title="Preview"
                        >
                            <Eye size={16} />
                        </button>
                    </div>
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
                </>
            ) : (
                <div className="relative w-full h-full min-h-[300px] bg-gray-50 overflow-hidden rounded border border-gray-100 flex flex-col">
                    {error ? (
                         <div className="flex items-center gap-2 text-red-500 text-sm p-4 justify-center h-full">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="ml-4 text-blue-500 underline text-xs"
                            >
                                Edit Code
                            </button>
                        </div>
                    ) : (
                        <TransformWrapper
                            initialScale={1}
                            minScale={0.5}
                            maxScale={4}
                            centerOnInit
                        >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    <div className="absolute top-2 right-2 flex gap-1 z-20">
                                         <button onClick={() => zoomIn()} className="p-1.5 bg-white shadow rounded text-gray-600 hover:text-black" title="Zoom In"><ZoomIn size={16}/></button>
                                         <button onClick={() => zoomOut()} className="p-1.5 bg-white shadow rounded text-gray-600 hover:text-black" title="Zoom Out"><ZoomOut size={16}/></button>
                                         <button onClick={() => resetTransform()} className="p-1.5 bg-white shadow rounded text-gray-600 hover:text-black" title="Reset Zoom"><RotateCcw size={16}/></button>
                                         <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                         <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 bg-white shadow rounded text-gray-600 hover:text-black"
                                            title="Edit Code"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    <TransformComponent
                                        wrapperStyle={{ width: "100%", height: "100%", minHeight: "300px" }}
                                        contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        <div
                                            ref={containerRef}
                                            dangerouslySetInnerHTML={{ __html: svgContent }}
                                            className="mermaid-output w-full h-full"
                                            style={{ pointerEvents: 'none' }} // Ensure panning works over the SVG
                                        />
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    )}
                </div>
            )}
        </div>
    );
}
