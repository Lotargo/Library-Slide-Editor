import React from 'react';

export default function CalendarBlock({ block, onUpdate }) {
    const data = block.data || { events: [] };
    const days = Array.from({ length: 35 }, (_, i) => i + 1); // 5 weeks

    const addEvent = (day) => {
        const title = prompt("Event title:");
        if (title) {
            const newEvent = { id: Date.now(), day, title };
            onUpdate({ data: { events: [...data.events, newEvent] } });
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden my-4 select-none shadow-sm">
             <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold flex justify-between items-center">
                 <span>Calendar</span>
                 <span className="text-gray-400 text-sm font-normal">Month View</span>
             </div>
             <div className="grid grid-cols-7 text-xs bg-white">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                     <div key={d} className="py-2 border-b border-r border-gray-100 text-gray-400 font-medium text-center bg-gray-50/50">{d}</div>
                 ))}
                 {days.map(d => {
                     const dayEvents = data.events.filter(e => e.day === d);
                     return (
                         <div
                            key={d}
                            className="h-24 border-b border-r border-gray-100 p-1 hover:bg-gray-50 cursor-pointer transition-colors relative"
                            onClick={() => addEvent(d)}
                         >
                             <div className="text-gray-400 mb-1 text-right px-1">{d <= 31 ? d : ''}</div>
                             {d <= 31 && (
                                 <div className="flex flex-col gap-1">
                                     {dayEvents.map(ev => (
                                         <div key={ev.id} className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] truncate border border-blue-200">
                                             {ev.title}
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     );
                 })}
             </div>
        </div>
    )
}
