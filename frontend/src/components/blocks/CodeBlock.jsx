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
        onUpdate({ content: e.target.value });
    };

    return (
        <div className="relative group rounded-md overflow-hidden bg-[#2d2d2d] my-2 text-sm font-mono border border-gray-700">
            <div className="absolute top-2 right-2 text-xs text-gray-500 select-none z-20">
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
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word'
                }}
            />
            <style>{`
                .code-editor-textarea::selection {
                    background-color: rgba(255, 255, 255, 0.2);
                    color: transparent;
                }
            `}</style>
            {/* Syntax Highlight Overlay */}
            <pre
                className="absolute top-0 left-0 w-full h-full p-4 pointer-events-none m-0 overflow-hidden leading-normal"
                aria-hidden="true"
                style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word'
                }}
            >
                <code ref={codeRef} className="language-javascript" style={{
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word'
                }}>
                    {block.content || ' '}
                </code>
            </pre>
        </div>
    );
}
