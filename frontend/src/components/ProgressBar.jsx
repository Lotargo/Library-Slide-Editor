import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ProgressBar({ current, total }) {
    return (
        <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-lg text-blue-700 flex items-center gap-3 animate-pulse my-2">
            <Loader2 className="animate-spin" size={20} />
            <div className="flex-1">
                <div className="flex justify-between text-sm font-medium mb-1">
                    <span>Uploading images...</span>
                    <span>{current} / {total}</span>
                </div>
                <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${(current / total) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
