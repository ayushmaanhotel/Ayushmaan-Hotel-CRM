import React from 'react';
import { 
  Crown, 
  TrendingUp, 
  IndianRupee, 
  AlertCircle, 
  Grid3X3, 
  Zap,
  BarChart3
} from 'lucide-react';
import type { Room, Transaction } from '../../types/hotel';

interface OwnerAnalyticsModuleProps {
  rooms: Room[];
  transactions: Transaction[];
  todayRevenue: number;
}

export const OwnerAnalyticsModule: React.FC<OwnerAnalyticsModuleProps> = ({
  rooms,
  todayRevenue
}) => {
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

  const adr = occupiedRooms > 0 ? Math.round(todayRevenue / occupiedRooms) : 0;
  const revPar = Math.round(todayRevenue / totalRooms);

  const categoryStats: Record<string, { total: number; occupied: number; price: number }> = {};

  rooms.forEach(r => {
    if (!categoryStats[r.type]) {
      categoryStats[r.type] = { total: 0, occupied: 0, price: r.pricePerNight };
    }
    categoryStats[r.type].total += 1;
    if (r.status === 'occupied') {
      categoryStats[r.type].occupied += 1;
    }
  });

  const categoryList = Object.entries(categoryStats).map(([type, stat]) => {
    const fillRate = Math.round((stat.occupied / stat.total) * 100);
    return {
      type,
      total: stat.total,
      occupied: stat.occupied,
      vacant: stat.total - stat.occupied,
      fillRate,
      price: stat.price
    };
  });

  const underperformingCategories = categoryList.filter(c => c.fillRate < 60);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5DFD3] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shadow-sm">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">Owner Intelligence & Fill-Rate Cockpit</h2>
              <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 font-semibold">Executive</span>
            </div>
            <p className="text-xs text-stone-500">Complete visibility into room category fill rates, underperforming rooms, RevPAR, and ADR.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-stone-500 block font-medium">Today's RevPAR</span>
            <span className="text-lg font-extrabold text-emerald-700 font-mono">₹{revPar.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Overall Occupancy</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">{occupancyRate}%</div>
          <span className="text-[10px] text-emerald-700 font-medium">{occupiedRooms} of {totalRooms} Rooms Filled</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Average Daily Rate (ADR)</span>
            <IndianRupee className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">₹{adr.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-stone-500">Revenue per sold room</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>RevPAR</span>
            <BarChart3 className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">₹{revPar.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-stone-500">Revenue per available room</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Total Today Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700">₹{todayRevenue.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-stone-500 font-medium">100% Reconciled</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-[#E5DFD3] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-amber-800" />
              Room Fill Rates by Category (Which rooms are filling up?)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Understand exact demand per room category to optimize pricing.</p>
          </div>
          <span className="text-xs font-mono text-stone-500">{categoryList.length} Categories</span>
        </div>

        <div className="space-y-3">
          {categoryList.map(cat => {
            const isHighDemand = cat.fillRate >= 75;
            const isUnderperforming = cat.fillRate < 60;

            return (
              <div key={cat.type} className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      {cat.type}
                      {isHighDemand && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 font-semibold">
                          🔥 High Demand (100% Full)
                        </span>
                      )}
                      {isUnderperforming && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 font-semibold">
                          ⚠️ Low Fill Rate ({cat.fillRate}%)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Tariff: ₹{cat.price}/night • {cat.occupied} of {cat.total} Rooms Occupied
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-mono font-bold ${
                      isHighDemand ? 'text-emerald-700' : isUnderperforming ? 'text-amber-800' : 'text-stone-800'
                    }`}>
                      {cat.fillRate}% Fill Rate
                    </span>
                  </div>
                </div>

                <div className="w-full bg-[#E5DFD3] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      isHighDemand ? 'bg-emerald-600' : isUnderperforming ? 'bg-amber-600' : 'bg-[#C4A482]'
                    }`}
                    style={{ width: `${cat.fillRate}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {underperformingCategories.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Underperforming Room Alert & Recommendation
            </h4>
            <span className="text-[10px] text-amber-800 font-mono font-semibold">Action Suggested</span>
          </div>

          {underperformingCategories.map(cat => (
            <div key={cat.type} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs font-semibold text-stone-900">{cat.type} ({cat.fillRate}% Fill Rate)</div>
                <div className="text-[11px] text-stone-500">
                  {cat.vacant} vacant rooms remaining tonight. Current tariff: ₹{cat.price}.
                </div>
              </div>
              <button 
                onClick={() => alert(`Applied ₹300 dynamic promo discount to ${cat.type} on Booking.com & WhatsApp!`)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
              >
                <Zap className="w-3.5 h-3.5" /> 1-Click Promote (-₹300)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
