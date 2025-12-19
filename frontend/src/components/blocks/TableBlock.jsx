import React from 'react';

export default function TableBlock({ block, onUpdate }) {
    const data = block.data || { headers: ['Column 1', 'Column 2'], rows: [['', '']] };

    const updateCell = (rowIndex, colIndex, value) => {
        const newRows = [...data.rows];
        newRows[rowIndex][colIndex] = value;
        onUpdate({ data: { ...data, rows: newRows } });
    };

    const updateHeader = (colIndex, value) => {
        const newHeaders = [...data.headers];
        newHeaders[colIndex] = value;
        onUpdate({ data: { ...data, headers: newHeaders } });
    };

    const addRow = () => {
        const newRow = new Array(data.headers.length).fill('');
        onUpdate({ data: { ...data, rows: [...data.rows, newRow] } });
    };

    const addColumn = () => {
        const newHeaders = [...data.headers, 'New Column'];
        const newRows = data.rows.map(row => [...row, '']);
        onUpdate({ data: { headers: newHeaders, rows: newRows } });
    };

    return (
        <div className="overflow-x-auto my-4 select-none">
            <div className="inline-block min-w-full align-middle">
                <table className="min-w-full border-collapse border border-gray-200">
                    <thead>
                        <tr>
                            {data.headers.map((h, i) => (
                                <th key={i} className="border border-gray-200 bg-gray-50 p-0 text-left text-sm font-semibold text-gray-600">
                                    <input
                                        className="w-full bg-transparent p-2 outline-none font-semibold"
                                        value={h}
                                        onChange={(e) => updateHeader(i, e.target.value)}
                                    />
                                </th>
                            ))}
                            <th className="border border-gray-200 bg-gray-50 w-8 text-center cursor-pointer hover:bg-gray-100" onClick={addColumn}>+</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row, rIndex) => (
                            <tr key={rIndex}>
                                {row.map((cell, cIndex) => (
                                    <td key={cIndex} className="border border-gray-200 p-0">
                                        <input
                                            className="w-full h-full p-2 outline-none text-sm text-gray-800"
                                            value={cell}
                                            onChange={(e) => updateCell(rIndex, cIndex, e.target.value)}
                                        />
                                    </td>
                                ))}
                                <td className="border border-gray-200 bg-gray-50"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={addRow} className="mt-2 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <span>+ New Row</span>
                </button>
            </div>
        </div>
    );
}
