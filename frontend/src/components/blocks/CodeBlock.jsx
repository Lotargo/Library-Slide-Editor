import React, { useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';

export default function CodeBlock({ block, onUpdate }) {
    const codeRef = useRef(null);

    useEffect(() => {
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [block.content]);

    const handleChange = (e) => {
        // Simple textarea for editing code is more robust than contentEditable with Prism
        // But to make it look like a block, we can use a textarea that styles itself?
        // Or separate View/Edit?
        // Let's use a textarea for editing to avoid cursor jumping with syntax highlighting re-renders.
        onUpdate({ content: e.target.value });
    };

    return (
        <div className="relative group rounded-md overflow-hidden bg-[#2d2d2d] my-2 text-sm font-mono border border-gray-700">
            <div className="absolute top-2 right-2 text-xs text-gray-500 select-none">
                Code
            </div>
            <textarea
                className="w-full bg-transparent p-4 min-h-[100px] resize-y outline-none font-mono z-10 relative leading-normal code-editor-textarea"
                value={block.content || ''}
                onChange={handleChange}
                spellCheck="false"
                style={{
                    color: 'transparent',
                    caretColor: 'white',
                    fontFamily: 'monospace', // Ensure matches Prism
                    fontSize: '0.875rem',    // text-sm
                }}
            />
            <style>{`
                .code-editor-textarea::selection {
                    background-color: rgba(255, 255, 255, 0.2);
                    color: transparent; /* Keep text transparent so underlying syntax highlight shows? No, selection makes text visible usually. */
                }
                /* Actually, if text is transparent, we can't see it in selection.
                   If we make it white in selection, we lose syntax highlighting.
                   VS Code handles this by drawing selection BEHIND text.
                   Since textarea is ON TOP, its selection background covers the Pre underneath?
                   Yes, standard selection background is opaque-ish.
                   Ideally we want transparent background for selection?
                   Or we rely on the caret.
                   Let's set text color to white on selection?
                */
                .code-editor-textarea::selection {
                     background: rgba(255, 255, 255, 0.2);
                     color: white; /* Fallback to white text on selection */
                }
            `}</style>
            {/* Syntax Highlight Overlay */}
            <pre
                className="absolute top-0 left-0 w-full h-full p-4 pointer-events-none m-0 overflow-hidden leading-normal"
                aria-hidden="true"
            >
                <code ref={codeRef} className="language-javascript" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {block.content || ' '}
                </code>
            </pre>
        </div>
    );
}
