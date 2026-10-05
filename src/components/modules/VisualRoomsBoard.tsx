import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Brush, 
  Wrench, 
  User, 
  Plus,
  Clock
} from 'lucide-react';
import type { Room, RoomStatus } from '../../types/hotel';

interface VisualRoomsBoardProps {
  rooms: Room[];
  onRoomStatusChange: (roomId: string, newStatus: RoomStatus) => void;
  onBookRoom: (room: Room) => void;
  onOpenCheckOut: (room: Room) => void;
}

export const VisualRoomsBoard: React.FC<VisualRoomsBoardProps> = ({
  rooms,
  onRoomStatusChange,
  onBookRoom,
  onOpenCheckOut
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');

  const filteredRooms = rooms.filter(room => {
    if (filterStatus !== 'all' && room.status !== filterStatus) return false;
    if (filterFloor !== 'all' && room.floor.toString() !== filterFloor) return false;
    return true;
  });

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'occupied':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/40">Occupied</span>;
      case 'cleaning':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">Cleaning</span>;
      case 'vacant':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Vacant / Ready</span>;
      case 'maintenance':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-700 text-zinc-300 border border-zinc-600">Maintenance</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            Visual Room Board
            <span className="text-xs font-mono font-normal text-stone-500">({rooms.length} Total Rooms)</span>
          </h2>
          <p className="text-xs text-stone-600">No data tables. Immediate status of every single room in the hotel.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E5DFD3] text-xs">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filterStatus === 'all' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
            >
              All ({rooms.length})
            </button>
            <button 
              onClick={() => setFilterStatus('vacant')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filterStatus === 'vacant' ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'text-stone-600 hover:text-emerald-700'}`}
            >
              Vacant ({rooms.filter(r => r.status === 'vacant').length})
            </button>
            <button 
              onClick={() => setFilterStatus('occupied')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filterStatus === 'occupied' ? 'bg-red-50 text-red-800 font-bold border border-red-200' : 'text-stone-600 hover:text-red-700'}`}
            >
              Occupied ({rooms.filter(r => r.status === 'occupied').length})
            </button>
            <button 
              onClick={() => setFilterStatus('cleaning')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${filterStatus === 'cleaning' ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200' : 'text-stone-600 hover:text-amber-700'}`}
            >
              Cleaning ({rooms.filter(r => r.status === 'cleaning').length})
            </button>
          </div>

          <select 
            value={filterFloor} 
            onChange={(e) => setFilterFloor(e.target.value)}
            className="bg-[#FAF8F5] text-xs text-stone-800 px-3 py-1.5 rounded-xl border border-stone-300 focus:outline-none focus:bg-white"
          >
            <option value="all">All Floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'occupied';
          const isCleaning = room.status === 'cleaning';
          const isVacant = room.status === 'vacant';
          const isMaintenance = room.status === 'maintenance';

          return (
            <div 
              key={room.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                isOccupied ? 'room-card-occupied' :
                isCleaning ? 'room-card-cleaning' :
                isVacant ? 'room-card-vacant' :
                'room-card-maintenance'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-2xl font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                    {room.number}
                    <span className="text-[10px] font-sans font-normal text-stone-500">Fl {room.floor}</span>
                  </span>
                  {getStatusBadge(room.status)}
                </div>
                <div className="text-xs font-semibold text-stone-800">{room.type}</div>
                <div className="text-[11px] font-mono text-stone-500">₹{room.pricePerNight} / night</div>
              </div>

              <div className="py-2 border-y border-[#E5DFD3] min-h-[70px] flex flex-col justify-center">
                {isOccupied && room.currentGuest && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      {room.currentGuest.name}
                    </div>
                    <div className="text-[10px] text-stone-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-600" />
                      Out: {room.checkOutTime}
                    </div>
                    {room.currentGuest.isVIP && (
                      <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                        VIP Guest
                      </span>
                    )}
                  </div>
                )}

                {isCleaning && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                      <span className="flex items-center gap-1">
                        <Brush className="w-3.5 h-3.5" />
                        Cleaning
                      </span>
                      <span className="font-mono text-[10px]">Ready {room.readyInMinutes || 15} min</span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${room.cleaningProgress || 60}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-stone-500">Cleaner: {room.housekeeperAssigned || 'Staff'}</div>
                  </div>
                )}

                {isVacant && (
                  <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Clean & Ready for Immediate Walk-in
                  </div>
                )}

                {isMaintenance && (
                  <div className="text-xs text-stone-600 flex items-start gap-1.5">
                    <Wrench className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                    <span>{room.maintenanceNote || 'Maintenance check in progress'}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {isVacant && (
                  <button 
                    onClick={() => onBookRoom(room)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Book Room 100%
                  </button>
                )}

                {isOccupied && (
                  <button 
                    onClick={() => onOpenCheckOut(room)}
                    className="w-full py-2 bg-white hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 shadow-2xs flex items-center justify-center gap-1 transition-all"
                  >
                    Check Out & Bill
                  </button>
                )}

                {isCleaning && (
                  <button 
                    onClick={() => onRoomStatusChange(room.id, 'vacant')}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-2xs"
                  >
                    Mark Ready
                  </button>
                )}

                {isMaintenance && (
                  <button 
                    onClick={() => onRoomStatusChange(room.id, 'cleaning')}
                    className="w-full py-2 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium border border-stone-300 shadow-2xs flex items-center justify-center gap-1 transition-all"
                  >
                    Send to Cleaning
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
