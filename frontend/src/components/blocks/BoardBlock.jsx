import React from 'react';
import { Plus } from 'lucide-react';

export default function BoardBlock({ block, onUpdate }) {
    const data = block.data || {
        columns: [
            { id: 'c1', title: 'To Do', cards: [{ id: 'cd1', content: 'Task 1' }] },
            { id: 'c2', title: 'In Progress', cards: [] },
            { id: 'c3', title: 'Done', cards: [] }
        ]
    };

    const updateColumnTitle = (colIndex, title) => {
        const newCols = [...data.columns];
        newCols[colIndex].title = title;
        onUpdate({ data: { ...data, columns: newCols } });
    };

    const addCard = (colIndex) => {
        const newCols = [...data.columns];
        newCols[colIndex].cards.push({ id: Date.now().toString(), content: 'New Card' });
        onUpdate({ data: { ...data, columns: newCols } });
    };

    const updateCard = (colIndex, cardIndex, content) => {
        const newCols = [...data.columns];
        newCols[colIndex].cards[cardIndex].content = content;
        onUpdate({ data: { ...data, columns: newCols } });
    };

    return (
        <div className="flex gap-4 overflow-x-auto my-4 pb-4 select-none">
            {data.columns.map((col, colIndex) => (
                <div key={col.id} className="min-w-[240px] w-64 bg-gray-100 rounded-md p-3 flex flex-col gap-2 flex-shrink-0">
                    <div className="flex justify-between items-center mb-1">
                        <input
                            className="bg-transparent font-semibold text-gray-700 outline-none text-sm w-full"
                            value={col.title}
                            onChange={(e) => updateColumnTitle(colIndex, e.target.value)}
                        />
                        <span className="text-xs text-gray-400">{col.cards.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
                        {col.cards.map((card, cardIndex) => (
                            <div key={card.id} className="bg-white p-3 rounded shadow-sm border border-gray-200 group">
                                <textarea
                                    className="w-full resize-none outline-none text-sm bg-transparent"
                                    rows={2} // Auto-grow would be better
                                    value={card.content}
                                    onChange={(e) => updateCard(colIndex, cardIndex, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => addCard(colIndex)} className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1 mt-1 hover:bg-gray-200 rounded p-1 transition-colors">
                        <Plus size={14} /> New
                    </button>
                </div>
            ))}
            <button className="min-w-[240px] h-10 border border-dashed border-gray-300 rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-600 flex items-center justify-center transition-colors">
                + Add Group
            </button>
        </div>
    )
}
