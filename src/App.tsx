import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Printer, DoorOpen, Upload, Trash2, Download } from 'lucide-react';

export default function App() {
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [extraSeats, setExtraSeats] = useState({});
  const [examTitle1, setExamTitle1] = useState("UJIAN AKHIR SEMESTER");
  const [examTitle2, setExamTitle2] = useState("TAHUN AJARAN 2026/2027");
  const [teacherDeskPos, setTeacherDeskPos] = useState('center');
  const [doorPos, setDoorPos] = useState('left');
  const [rooms, setRooms] = useState([{ name: "Ruang 1", seatData: {} }]);
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const getOrderedSeats = () => {
    const order = [];
    for (let c = 0; c < cols; c++) {
      if (c % 2 === 0) {
        for (let r = rows - 1; r >= 0; r--) order.push({r, c});
      } else {
        for (let r = 0; r < rows; r++) order.push({r, c});
      }
    }
    for (let c = cols - 1; c >= 0; c--) {
        if (extraSeats[c]) order.push({r: -1, c});
    }
    return order;
  };

  const handleManualChange = (roomIdx, r, c, field, value) => {
    setRooms(prev => {
        const newRooms = [...prev];
        const newSeatData = { ...newRooms[roomIdx].seatData };
        if (!newSeatData[`${r}-${c}`]) newSeatData[`${r}-${c}`] = { name: '', id: '' };
        newSeatData[`${r}-${c}`][field] = value;
        newRooms[roomIdx].seatData = newSeatData;
        return newRooms;
    });
  };

  const handleReset = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data?")) {
        setRooms([{ name: "Ruang 1", seatData: {} }]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const participantData = data.slice(1).filter(row => row[0] !== undefined || row[1] !== undefined);
      const orderedSeats = getOrderedSeats();
      const capacity = orderedSeats.length;
      const newRooms = [];
      for (let i = 0; i < participantData.length; i += capacity) {
        const chunk = participantData.slice(i, i + capacity);
        const seatData = {};
        chunk.forEach((row, index) => {
          const { r, c } = orderedSeats[index];
          seatData[`${r}-${c}`] = { name: String(row[0] || ""), id: String(row[1] || "") };
        });
        newRooms.push({ name: `Ruang ${Math.floor(i / capacity) + 1}`, seatData });
      }
      setRooms(newRooms.length > 0 ? newRooms : [{ name: "Ruang 1", seatData: {} }]);
    };
    reader.readAsBinaryString(file);
  };

  const getSeatNumber = (r, c) => {
    const orderedSeats = getOrderedSeats();
    const index = orderedSeats.findIndex(s => s.r === r && s.c === c);
    return index !== -1 ? index + 1 : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
        `}
      </style>
      
      <header className="w-full mb-6 no-print">
        <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
            <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2"><LayoutGrid /> Exam Seat Planner</h1>
            <div className="flex flex-wrap gap-2">
                <button onClick={handleReset} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"><Trash2 size={16}/> Reset Data</button>
                <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"><Upload size={16}/> Import Excel</button>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"><Printer size={16} /> Cetak Semua</button>
            </div>
        </div>
      </header>

      {/* Main Content - Full width on screen, constrained on print */}
      <div className="w-full flex flex-col items-center">
        {rooms.map((room, roomIdx) => (
            <main key={roomIdx} className="w-full print:max-w-[210mm] print:mx-auto bg-white p-8 shadow-md border-4 border-gray-900 mb-12 page-break">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-black uppercase text-gray-900">{examTitle1}</h2>
                    <h2 className="text-lg font-bold uppercase text-gray-700">{examTitle2}</h2>
                    <h3 className="text-2xl font-black uppercase mt-4 border-t-2 border-b-2 border-gray-900 py-3">{room.name}</h3>
                </div>

                <div className="grid gap-2 mb-8" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                   {Array.from({length: cols}).map((_, c) => (
                      extraSeats[c] ? (
                        <div key={`extra-${c}`} className="h-20 border-2 border-gray-900 bg-yellow-50 rounded flex flex-col p-1 justify-center items-center gap-0.5">
                            <span className="font-bold text-[10px] underline">{getSeatNumber(-1, c)}</span>
                            <input value={room.seatData[`-1-${c}`]?.id || ''} onChange={(e) => handleManualChange(roomIdx, -1, c, 'id', e.target.value)} className="w-full bg-transparent text-[8px] text-center outline-none font-bold underline"/>
                            <textarea value={room.seatData[`-1-${c}`]?.name || ''} onChange={(e) => handleManualChange(roomIdx, -1, c, 'name', e.target.value)} className="w-full h-12 bg-transparent text-[8px] text-center outline-none resize-none"/>
                        </div>
                      ) : <div key={`extra-${c}`} className="h-20"/>
                   ))}

                   {Array.from({length: rows}).map((_, r) => (
                      Array.from({length: cols}).map((_, c) => {
                        const number = getSeatNumber(r, c);
                        return (
                            <div key={`${r}-${c}`} className={`h-20 border-2 border-gray-900 rounded flex flex-col p-1 justify-center items-center gap-0.5 ${number ? 'bg-white' : 'border-transparent'}`}>
                               {number && (
                                  <>
                                    <span className="font-bold text-[10px] underline">{number}</span>
                                    <input value={room.seatData[`${r}-${c}`]?.id || ''} onChange={(e) => handleManualChange(roomIdx, r, c, 'id', e.target.value)} className="w-full bg-transparent text-[8px] text-center outline-none font-bold underline"/>
                                    <textarea value={room.seatData[`${r}-${c}`]?.name || ''} onChange={(e) => handleManualChange(roomIdx, r, c, 'name', e.target.value)} className="w-full h-12 bg-transparent text-[8px] text-center outline-none resize-none"/>
                                  </>
                               )}
                            </div>
                        );
                      })
                   ))}
                </div>

                {}
                <div className="w-full mt-12 pt-4 relative">
                    <div className={`absolute -top-6 w-full flex ${doorPos === 'left' ? 'justify-start' : 'justify-end'}`}>
                        <div className="bg-white px-2 text-xs font-bold border-2 border-gray-900 rounded flex items-center gap-1"><DoorOpen size={14}/> Pintu</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className={`w-full flex ${teacherDeskPos === 'left' ? 'justify-start' : teacherDeskPos === 'right' ? 'justify-end' : 'justify-center'} mb-4`}>
                            <div className="bg-white px-8 py-4 border-2 border-gray-900 rounded text-xs font-bold text-center">Meja Pengawas</div>
                        </div>
                        <div className="w-full bg-gray-900 text-white py-2 rounded text-center text-xs font-bold tracking-widest uppercase">Papan Tulis</div>
                    </div>
                </div>
            </main>
        ))}
      </div>
      
      {/* Settings Panel */}
      <div className="w-full p-6 bg-white border rounded-lg shadow-sm no-print mb-8">
          <label className="text-sm font-bold block mb-4 border-b pb-2">Konfigurasi Ruangan</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
                <input className="p-2 border rounded" placeholder="Judul Baris 1" value={examTitle1} onChange={(e) => setExamTitle1(e.target.value)} />
                <input className="p-2 border rounded" placeholder="Judul Baris 2" value={examTitle2} onChange={(e) => setExamTitle2(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <input className="w-full p-2 border rounded" type="number" value={rows} onChange={(e) => setRows(Number(e.target.value))} placeholder="Baris" />
                    <input className="w-full p-2 border rounded" type="number" value={cols} onChange={(e) => setCols(Number(e.target.value))} placeholder="Kolom" />
                </div>
                <div className="flex gap-2">
                    {['left', 'center', 'right'].map(pos => <button key={pos} onClick={() => setTeacherDeskPos(pos)} className={`capitalize flex-1 px-3 py-1 border rounded text-xs ${teacherDeskPos === pos ? 'bg-blue-600 text-white' : ''}`}>{pos}</button>)}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    {['left', 'right'].map(pos => <button key={pos} onClick={() => setDoorPos(pos)} className={`capitalize flex-1 px-3 py-1 border rounded text-xs ${doorPos === pos ? 'bg-green-600 text-white' : ''}`}>Pintu {pos}</button>)}
                </div>
                <div className="flex gap-1 flex-wrap">
                    <span className="text-[10px] w-full font-bold">Extra Meja Kolom:</span>
                    {Array.from({length: cols}).map((_, i) => (
                        <button key={i} onClick={() => setExtraSeats(p => ({...p, [i]: !p[i]}))} className={`px-2 py-1 border rounded text-[10px] ${extraSeats[i] ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}>{i+1}</button>
                    ))}
                </div>
            </div>
          </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
    </div>
  );
}