import React from 'react';
import BlockList from '../BlockList';

export default function SlideBlock({ block, onUpdate }) {

    const handleChildrenChange = (newChildren) => {
        onUpdate({ children: newChildren });
    };

    const ratioStyle = block.ratio ? block.ratio.replace('/', ' / ') : '16 / 9';

    return (
        <div className="my-8 select-none">
            <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shadow-sm transition-shadow hover:shadow-md">
                {/* Slide Header */}
                <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                    <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        placeholder="Slide"
                        className="text-xs font-semibold text-gray-600 uppercase tracking-wider bg-transparent border-none outline-none placeholder-gray-400 w-full mr-2"
                    />
                    <div className="flex gap-2 flex-shrink-0">
                        <select
                            value={block.ratio || '16/9'}
                            onChange={e => onUpdate({ ratio: e.target.value })}
                            className="text-xs bg-transparent border border-gray-300 rounded px-1 py-0.5 text-gray-600 focus:outline-none focus:border-blue-400"
                        >
                            <option value="16/9">16:9</option>
                            <option value="4/3">4:3</option>
                            <option value="1/1">1:1</option>
                            <option value="9/16">9:16 (Story)</option>
                        </select>
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="p-6 bg-gray-200/50 flex justify-center items-center overflow-hidden">
                     <div
                        id={`slide-content-${block.id}`}
                        className="bg-white shadow-lg w-full max-w-3xl flex flex-col relative transition-all duration-300"
                        style={{ aspectRatio: ratioStyle }}
                     >
                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                            <BlockList blocks={block.children || []} onChange={handleChildrenChange} listId={block.id} />
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}
