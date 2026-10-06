import React, { useState } from 'react';
import { Database, Search, Filter, Download, MapPin, CheckCircle } from 'lucide-react';

export const DatasetExplorerTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');

  const sampleData = [
    { id: 1, station: 'Bhavani River at Bhavanisagar', district: 'Erode', pH: 7.4, do: 6.8, tds: 280, chloride: 85, wqi: 18.5, status: 'Excellent' },
    { id: 2, station: 'Cauvery River at Erode Discharge', district: 'Erode', pH: 7.8, do: 5.4, tds: 520, chloride: 180, wqi: 42.1, status: 'Good' },
    { id: 3, station: 'Noyyal River at Tiruppur Drain', district: 'Tiruppur', pH: 8.6, do: 2.1, tds: 1850, chloride: 580, wqi: 112.4, status: 'Unsuitable' },
    { id: 4, station: 'Thamirabarani at Tirunelveli', district: 'Tirunelveli', pH: 7.2, do: 7.4, tds: 210, chloride: 65, wqi: 21.3, status: 'Excellent' },
    { id: 5, station: 'Palar River at Ranipet', district: 'Vellore', pH: 8.2, do: 3.8, tds: 1120, chloride: 390, wqi: 78.6, status: 'Poor' },
    { id: 6, station: 'Vaigai River at Madurai Urban', district: 'Madurai', pH: 7.9, do: 4.5, tds: 640, chloride: 220, wqi: 48.9, status: 'Good' },
    { id: 7, station: 'Kalingarayan Canal Inlet', district: 'Erode', pH: 7.6, do: 5.9, tds: 410, chloride: 110, wqi: 31.0, status: 'Good' },
    { id: 8, station: 'Amaravathi River at Karur', district: 'Karur', pH: 8.1, do: 4.1, tds: 890, chloride: 290, wqi: 64.2, status: 'Poor' }
  ];

  const filteredData = sampleData.filter(item => {
    const matchesSearch = item.station.toLowerCase().includes(searchTerm.toLowerCase()) || item.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = districtFilter === 'All' || item.district === districtFilter;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Water Quality Dataset & Station Directory</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            2,260 groundwater & river monitoring records across Tamil Nadu surface water observation posts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
            2,260 Cleaned Samples
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stations or districts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="All">All Districts</option>
            <option value="Erode">Erode</option>
            <option value="Tiruppur">Tiruppur</option>
            <option value="Tirunelveli">Tirunelveli</option>
            <option value="Vellore">Vellore</option>
            <option value="Madurai">Madurai</option>
            <option value="Karur">Karur</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Station Name</th>
                <th className="py-3.5 px-4">District</th>
                <th className="py-3.5 px-4 font-mono">pH</th>
                <th className="py-3.5 px-4 font-mono">DO (mg/L)</th>
                <th className="py-3.5 px-4 font-mono">TDS (mg/L)</th>
                <th className="py-3.5 px-4 font-mono">Chloride</th>
                <th className="py-3.5 px-4 font-mono">WQI Value</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {row.station}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{row.district}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{row.pH}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{row.do}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{row.tds}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{row.chloride}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{row.wqi}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.wqi <= 25 ? 'bg-emerald-100 text-emerald-800' :
                      row.wqi <= 50 ? 'bg-blue-100 text-blue-800' :
                      row.wqi <= 75 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
