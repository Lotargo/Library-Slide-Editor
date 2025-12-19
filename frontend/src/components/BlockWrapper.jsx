import React, { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import TextBlock from './blocks/TextBlock';
import SlideBlock from './blocks/SlideBlock';
import TableBlock from './blocks/TableBlock';
import BoardBlock from './blocks/BoardBlock';
import CalendarBlock from './blocks/CalendarBlock';

export default function BlockWrapper({ block, onUpdate, onAddNext, onDelete }) {
    const [hover, setHover] = useState(false);

    const renderContent = () => {
        switch (block.type) {
            case 'slide_wrapper':
                return <SlideBlock block={block} onUpdate={onUpdate} />;
            case 'table':
                return <TableBlock block={block} onUpdate={onUpdate} />;
            case 'board':
                return <BoardBlock block={block} onUpdate={onUpdate} />;
            case 'calendar':
                return <CalendarBlock block={block} onUpdate={onUpdate} />;
            case 'text':
            default:
                return <TextBlock block={block} onUpdate={onUpdate} onAddNext={onAddNext} />;
        }
    }

    return (
        <div
            className="group flex items-start gap-2 -ml-10 pl-2 pr-2 relative"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Gutter / Controls */}
            <div
                className={`flex items-center pt-1.5 gap-0.5 absolute left-0 transition-opacity duration-200 ${hover ? 'opacity-100' : 'opacity-0'}`}
                contentEditable={false} // Make sure controls aren't editable
            >
                <button
                    onClick={onAddNext}
                    className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Add block below"
                >
                    <Plus size={16} />
                </button>
                <div
                    className="cursor-grab p-0.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Drag to move"
                >
                     <GripVertical size={16} />
                </div>
                <button
                    onClick={onDelete}
                    className="p-0.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Delete block"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Block Content */}
            <div className="flex-grow min-w-0 ml-10">
                {renderContent()}
            </div>
        </div>
    );
}
