import React from 'react';
import { 
  UserCheck, 
  UserMinus, 
  Footprints, 
  Clock, 
  Crown, 
  AlertCircle, 
  Plus, 
  IndianRupee, 
  ArrowUpRight,
  Building,
  Brush,
  Wrench
} from 'lucide-react';
import type { Room, Guest } from '../../types/hotel';

interface FrontDeskModuleProps {
  rooms: Room[];
  guests: Guest[];
  onOpenQuickBooking: () => void;
  onOpenCheckIn: (room: Room) => void;
  onOpenCheckOut: (room: Room) => void;
  onOpenPayment: (guest: Guest) => void;
  onSelectTab: (tab: any) => void;
}

export const FrontDeskModule: React.FC<FrontDeskModuleProps> = ({
  rooms,
  guests,
  onOpenQuickBooking,
  onOpenCheckOut,
  onOpenPayment,
  onSelectTab
}) => {
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  const cleaningRooms = rooms.filter(r => r.status === 'cleaning');
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance');

  const vipGuests = guests.filter(g => g.isVIP);
  const pendingPaymentGuests = guests.filter(g => g.pendingBalance > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5DFD3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              FRONT DESK LIVE
            </span>
            <span className="text-xs text-stone-500">Shift Manager: Aman V.</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-1">Operational Workspace</h2>
          <p className="text-xs text-stone-600 mt-0.5">Everything needed to run check-ins, guest billing & room allocation without switching screens.</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenQuickBooking}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all duration-150 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + 30s Quick Walk-in / Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white border border-[#E5DFD3] shadow-xs p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">Check Ins</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-stone-900">4</div>
          <span className="text-[10px] text-emerald-700 font-medium">2 Processed</span>
        </div>

        <div className="bg-white border border-[#E5DFD3] shadow-xs p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">Check Outs</span>
            <UserMinus className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-stone-900">3</div>
          <span className="text-[10px] text-amber-700 font-medium">1 Due in 30m</span>
        </div>

        <div className="bg-white border border-[#E5DFD3] shadow-xs p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">Walk-Ins</span>
            <Footprints className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-bold font-mono text-stone-900">2</div>
          <span className="text-[10px] text-indigo-700 font-medium">Today</span>
        </div>

        <div className="bg-white border border-[#E5DFD3] shadow-xs p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">Pending Pay</span>
            <IndianRupee className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-700">₹{pendingPaymentGuests.reduce((acc, g) => acc + g.pendingBalance, 0).toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-rose-700 font-medium">{pendingPaymentGuests.length} Guest</span>
        </div>

        <div className="bg-white border border-[#E5DFD3] shadow-xs p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">Arrivals</span>
            <Clock className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-lg font-bold font-mono text-stone-900">5</div>
          <span className="text-[10px] text-sky-700 font-medium">Upcoming</span>
        </div>

        <div className="bg-white border border-[#E5DFD3] shadow-xs p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">VIP Guests</span>
            <Crown className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-800">{vipGuests.length}</div>
          <span className="text-[10px] text-amber-700 font-medium">Priority Stay</span>
        </div>

        <div className="bg-white border border-[#E5DFD3] shadow-xs p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">Cleaning</span>
            <Brush className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-stone-900">{cleaningRooms.length}</div>
          <span className="text-[10px] text-stone-500">Rooms</span>
        </div>

        <div className="bg-white border border-[#E5DFD3] shadow-xs p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">Maintenance</span>
            <Wrench className="w-3.5 h-3.5 text-stone-500" />
          </div>
          <div className="text-lg font-bold font-mono text-stone-900">{maintenanceRooms.length}</div>
          <span className="text-[10px] text-stone-500">Blocked</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Quick Actions (3 Clicks Maximum)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button 
            onClick={onOpenQuickBooking}
            className="p-3 bg-[#FAF8F5] hover:bg-white border border-[#E5DFD3] hover:border-indigo-400 rounded-xl text-left transition-all group shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-stone-900">+ New Booking</div>
            <div className="text-[10px] text-stone-500">Advance or direct</div>
          </button>

          <button 
            onClick={onOpenQuickBooking}
            className="p-3 bg-[#FAF8F5] hover:bg-white border border-[#E5DFD3] hover:border-emerald-400 rounded-xl text-left transition-all group shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Footprints className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-stone-900">+ Walk In</div>
            <div className="text-[10px] text-stone-500">Instant check-in</div>
          </button>

          <button 
            onClick={() => onSelectTab('rooms')}
            className="p-3 bg-[#FAF8F5] hover:bg-white border border-[#E5DFD3] hover:border-sky-400 rounded-xl text-left transition-all group shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-stone-900">Check In Guest</div>
            <div className="text-[10px] text-stone-500">Scan Aadhaar / Phone</div>
          </button>

          <button 
            onClick={() => onSelectTab('rooms')}
            className="p-3 bg-[#FAF8F5] hover:bg-white border border-[#E5DFD3] hover:border-amber-400 rounded-xl text-left transition-all group shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <UserMinus className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-stone-900">Check Out</div>
            <div className="text-[10px] text-stone-500">Generate GST Bill</div>
          </button>

          <button 
            onClick={() => onSelectTab('rooms')}
            className="p-3 bg-[#FAF8F5] hover:bg-white border border-[#E5DFD3] hover:border-indigo-400 rounded-xl text-left transition-all group shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Building className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-stone-900">Assign Room</div>
            <div className="text-[10px] text-stone-500">Visual drag & select</div>
          </button>

          <button 
            onClick={() => onSelectTab('finance')}
            className="p-3 bg-[#FAF8F5] hover:bg-white border border-[#E5DFD3] hover:border-emerald-400 rounded-xl text-left transition-all group shadow-2xs"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-stone-900">Receive Payment</div>
            <div className="text-[10px] text-stone-500">Instant UPI Dynamic QR</div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#E5DFD3] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Currently Occupied Rooms ({occupiedRooms.length})
            </h3>
            <button onClick={() => onSelectTab('rooms')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
              Visual Board <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {occupiedRooms.map(room => (
              <div 
                key={room.id}
                className="p-3 bg-[#FAF8F5] border border-[#E5DFD3] hover:border-stone-300 rounded-xl flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 font-mono text-sm font-bold text-red-600 flex items-center justify-center">
                    {room.number}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                      {room.currentGuest?.name}
                      {room.currentGuest?.isVIP && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-300">VIP</span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2">
                      <span>{room.type}</span>
                      <span>•</span>
                      <span>Out: {room.checkOutTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onOpenCheckOut(room)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 border border-stone-300 shadow-2xs transition-colors"
                  >
                    Check Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5DFD3] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Pending Payment & Alerts
            </h3>
            <span className="text-xs text-stone-500 font-mono font-medium">Action Required</span>
          </div>

          <div className="space-y-2.5">
            {pendingPaymentGuests.map(guest => (
              <div key={guest.id} className="p-3 bg-red-50/70 border border-red-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-stone-900">{guest.name}</div>
                  <div className="text-[11px] text-red-700 font-medium">Pending Balance: ₹{guest.pendingBalance.toLocaleString('en-IN')}</div>
                </div>
                <button 
                  onClick={() => onOpenPayment(guest)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs text-white font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  Collect UPI
                </button>
              </div>
            ))}

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-stone-900">Room 102 Cleaning in Progress</div>
                <div className="text-[11px] text-amber-800">Assigned housekeeper Suresh K. • Ready in 15 mins</div>
              </div>
              <button 
                onClick={() => onSelectTab('operations')}
                className="px-2.5 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs rounded-lg border border-amber-300 font-semibold"
              >
                Kanban
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
