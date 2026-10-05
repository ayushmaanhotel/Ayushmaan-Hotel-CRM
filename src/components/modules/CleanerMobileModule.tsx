import React from 'react';
import { Brush, CheckCircle2, Clock } from 'lucide-react';
import type { HousekeepingTask } from '../../types/hotel';

interface CleanerMobileModuleProps {
  tasks: HousekeepingTask[];
  onTaskStageChange: (taskId: string, newStage: 'dirty' | 'cleaning' | 'inspection' | 'ready') => void;
}

export const CleanerMobileModule: React.FC<CleanerMobileModuleProps> = ({
  tasks,
  onTaskStageChange
}) => {
  const dirtyTasks = tasks.filter(t => t.stage === 'dirty');
  const cleaningTasks = tasks.filter(t => t.stage === 'cleaning');
  const readyTasks = tasks.filter(t => t.stage === 'ready');

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center">
            <Brush className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Housekeeping Mobile Sync</h2>
            <p className="text-[11px] text-emerald-800">Suresh K. (Floor 1 & 2 Staff)</p>
          </div>
        </div>

        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
          Mobile Mode
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Rooms Needing Action ({dirtyTasks.length + cleaningTasks.length})</h3>

        {dirtyTasks.map(task => (
          <div key={task.id} className="p-4 bg-white border border-red-200 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-extrabold text-stone-900">Room {task.roomNumber}</span>
              <span className="text-[10px] font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200 font-semibold">
                Dirty / Checkout
              </span>
            </div>

            <div className="text-xs text-stone-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Checkout time: {task.updatedAt}</span>
            </div>

            <button 
              onClick={() => onTaskStageChange(task.id, 'cleaning')}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-colors"
            >
              <Brush className="w-4 h-4" /> Start Cleaning Room {task.roomNumber}
            </button>
          </div>
        ))}

        {cleaningTasks.map(task => (
          <div key={task.id} className="p-4 bg-white border border-amber-200 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-extrabold text-stone-900">Room {task.roomNumber}</span>
              <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                Cleaning in Progress
              </span>
            </div>

            <button 
              onClick={() => onTaskStageChange(task.id, 'ready')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark Room {task.roomNumber} Clean & Ready!
            </button>
          </div>
        ))}

        {readyTasks.length > 0 && (
          <div className="pt-3">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Completed Today ({readyTasks.length})</h4>
            {readyTasks.map(task => (
              <div key={task.id} className="p-3 bg-white rounded-xl border border-[#E5DFD3] flex items-center justify-between text-xs text-stone-700 mb-2 shadow-sm">
                <span className="font-semibold">Room {task.roomNumber}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Clean</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
