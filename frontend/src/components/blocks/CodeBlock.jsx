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
                className="w-full bg-transparent text-gray-200 p-4 min-h-[100px] resize-y outline-none font-mono z-10 relative"
                value={block.content || ''}
                onChange={handleChange}
                spellCheck="false"
                style={{
                    caretColor: 'white',
                    // Mix blend mode or absolute positioning to overlay?
                    // Actually, overlays are complex.
                    // For MVP, just a styled Textarea is fine. Syntax highlighting in *editing* requires complex libs (Monaco/CodeMirror).
                    // The user asked for "Syntax Highlighting".
                    // If I use a simple textarea, I don't get highlighting WHILE typing easily.
                    // Let's use the "Overlay" trick: Textarea transparent on top of Pre/Code.
                }}
            />
            {/* Syntax Highlight Overlay */}
            <pre
                className="absolute top-0 left-0 w-full h-full p-4 pointer-events-none m-0 overflow-hidden"
                aria-hidden="true"
            >
                <code ref={codeRef} className="language-javascript">
                    {block.content || ' '}
                </code>
            </pre>
        </div>
    );
}
