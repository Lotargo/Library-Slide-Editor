import React from 'react';

export default function DividerBlock({ block, onUpdate }) {
    return (
        <div className="py-4 cursor-default select-none" contentEditable={false}>
            <hr className="border-t border-gray-200" />
        </div>
    );
}
