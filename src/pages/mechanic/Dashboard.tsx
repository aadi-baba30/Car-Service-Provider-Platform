import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function MechanicDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);

  const [isAddExtraOpen, setIsAddExtraOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch earnings
    getDoc(doc(db, 'mechanics', user._id)).then(docSnap => {
       if (docSnap.exists()) {
          setEarnings(docSnap.data().earnings || 0);
       }
    }).catch(e => handleFirestoreError(e, OperationType.GET, 'mechanics'));

    // Listen to assigned bookings
    const bQuery = query(collection(db, 'bookings'), where('mechanicId', '==', user._id));
    const unsubscribe = onSnapshot(bQuery, 
      (snap) => setBookings(snap.docs.map(d => ({ _id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
    );

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch(err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const openAddExtra = (booking: any) => {
    setSelectedBooking(booking);
    setAdditionalDetails('');
    setIsAddExtraOpen(true);
  };

  const addExtraAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
       await updateDoc(doc(db, 'bookings', selectedBooking._id), {
          status: 'mechanic_completed',
          additionalDetails: additionalDetails || ''
       });
       setIsAddExtraOpen(false);
    } catch(err) {
       handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  return (
    <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full min-h-[calc(100vh-80px)] space-y-8">
      <div className="flex justify-between items-center bg-[#141414] border-2 border-black rounded-3xl p-6 text-white">
        <div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B00]">Mechanic Portal</span>
           <h1 className="text-3xl font-black tracking-tighter mt-1">Dashboard</h1>
        </div>
        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Earnings</span>
          <div className="text-3xl font-black italic tracking-tighter text-[#FF6B00]">₹{earnings}</div>
        </div>
      </div>

      <div className="bg-white border-2 border-black rounded-3xl p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest">My Tasks</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Service requests assigned to you</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-black">
                <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Time</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Customer</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Service</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(b => (
                <TableRow key={b._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <TableCell className="font-black italic text-lg tracking-tighter">{b.time}</TableCell>
                  <TableCell className="font-bold">{b.customerName}</TableCell>
                  <TableCell className="font-medium text-gray-500">{b.serviceTitle}</TableCell>
                  <TableCell>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-black ${['completed', 'mechanic_completed', 'payment_pending', 'awaiting_cash'].includes(b.status) ? 'bg-green-400 text-black' : b.status === 'in-progress' ? 'bg-black text-white' : 'bg-[#F8F9FA] text-black'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <button className="px-3 py-2 border-2 border-transparent hover:border-black rounded-xl text-xs font-bold text-gray-500 transition-colors" onClick={() => alert(`Contact: ${b.phone || 'No phone provided'}`)}>CONTACT</button>
                    {['assigned', 'accepted'].includes(b.status) && <button className="px-4 py-2 border-2 border-black rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-colors" onClick={() => updateStatus(b._id, 'in-progress')}>START JOB</button>}
                    {b.status === 'in-progress' && <button className="px-4 py-2 bg-[#FF6B00] border-2 border-black rounded-xl text-xs font-bold text-black hover:bg-orange-500 transition-colors" onClick={() => openAddExtra(b)}>COMPLETE & BILL</button>}
                    {['completed', 'mechanic_completed', 'payment_pending', 'awaiting_cash'].includes(b.status) && <button disabled className="px-4 py-2 bg-gray-100 border-2 border-transparent rounded-xl text-xs font-bold text-gray-400 cursor-not-allowed">DONE</button>}
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500 italic text-sm">No tasks assigned.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddExtraOpen} onOpenChange={setIsAddExtraOpen}>
        <DialogContent className="sm:max-w-md border-2 border-black rounded-3xl bg-white p-6 shadow-[8px_8px_0_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter mb-2">Complete Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={addExtraAndComplete} className="space-y-4">
             <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200 mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Service & Extra Charges</p>
                <div className="font-bold text-sm">Base Service: {selectedBooking?.serviceTitle}</div>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Additional Details / Extra Works Done (Optional)</label>
                  <Input type="text" className="border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={additionalDetails} onChange={e => setAdditionalDetails(e.target.value)} placeholder="e.g. Engine oil changed, new filters... (Vendor will decide pricing)" />
               </div>
             </div>

             <button type="submit" className="w-full bg-[#141414] text-white font-black uppercase tracking-widest py-4 rounded-xl mt-6 hover:bg-black transition-colors border-2 border-transparent">Submit to Vendor for Billing</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
