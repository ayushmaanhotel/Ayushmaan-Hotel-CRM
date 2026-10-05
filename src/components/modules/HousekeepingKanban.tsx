import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Smartphone, 
  ArrowRight
} from 'lucide-react';
import type { HousekeepingTask } from '../../types/hotel';

interface HousekeepingKanbanProps {
  tasks: HousekeepingTask[];
  onTaskStageChange: (taskId: string, newStage: 'dirty' | 'cleaning' | 'inspection' | 'ready') => void;
}

export const HousekeepingKanban: React.FC<HousekeepingKanbanProps> = ({
  tasks,
  onTaskStageChange
}) => {
  const stages: { id: 'dirty' | 'cleaning' | 'inspection' | 'ready'; title: string; color: string }[] = [
    { id: 'dirty', title: 'Dirty / To Clean', color: 'border-red-200 text-red-700 bg-red-50' },
    { id: 'cleaning', title: 'Cleaning in Progress', color: 'border-amber-200 text-amber-800 bg-amber-50' },
    { id: 'inspection', title: 'Quality Inspection', color: 'border-sky-200 text-sky-700 bg-sky-50' },
    { id: 'ready', title: 'Clean & Ready', color: 'border-emerald-200 text-emerald-800 bg-emerald-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            Housekeeping Live Kanban
          </h2>
          <p className="text-xs text-stone-500">Cleaner updates status live from smartphone → Manager watches room readiness in real-time.</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-600 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E5DFD3]">
          <Smartphone className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Mobile Staff Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map(stage => {
          const stageTasks = tasks.filter(t => t.stage === stage.id);
          return (
            <div key={stage.id} className="bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-sm flex flex-col space-y-3 min-h-[420px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD3]">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border font-mono ${stage.color}`}>
                  {stage.title}
                </span>
                <span className="text-xs font-mono font-bold text-stone-500">{stageTasks.length}</span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {stageTasks.map(task => (
                  <div 
                    key={task.id}
                    className="p-3.5 bg-[#FAF8F5] hover:bg-[#F5EFEB] border border-[#E5DFD3] rounded-xl space-y-2 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-lg font-black text-stone-900">Room {task.roomNumber}</span>
                      {task.priority === 'VIP Urgent' ? (
                        <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono border border-red-200">VIP Urgent</span>
                      ) : (
                        <span className="text-[9px] bg-[#E5DFD3] text-stone-700 px-1.5 py-0.5 rounded font-mono">Normal</span>
                      )}
                    </div>

                    <div className="text-xs text-stone-600 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                      Cleaner: <span className="font-semibold text-stone-900">{task.housekeeperName}</span>
                    </div>

                    <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1 border-t border-[#E5DFD3]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-stone-400" /> {task.updatedAt}</span>
                    </div>

                    <div className="pt-1">
                      {stage.id === 'dirty' && (
                        <button 
                          onClick={() => onTaskStageChange(task.id, 'cleaning')}
                          className="w-full py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          Start Cleaning <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {stage.id === 'cleaning' && (
                        <button 
                          onClick={() => onTaskStageChange(task.id, 'inspection')}
                          className="w-full py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                        >
                          Send for Inspection <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {stage.id === 'inspection' && (
                        <button 
                          onClick={() => onTaskStageChange(task.id, 'ready')}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors"
                        >
                          Approve & Mark Ready <CheckCircle2 className="w-3 h-3" />
                        </button>
                      )}
                      {stage.id === 'ready' && (
                        <div className="text-[10px] text-emerald-700 font-mono text-center flex items-center justify-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Ready for Walk-in
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
