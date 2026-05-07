import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot } from 'firebase/firestore';

export function AdminDashboard() {
  const [stats, setStats] = useState({ totalSales: 0, activeBookings: 0, totalVendors: 0 });
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);

  useEffect(() => {
    // 1. Listen to pending vendors
    const vendorQuery = query(collection(db, 'vendors'), where('approved', '==', false));
    const unsubscribeVendors = onSnapshot(vendorQuery, (snap) => {
      setPendingVendors(snap.docs.map(d => ({ _id: d.id, ...d.data() })));
    }, err => handleFirestoreError(err, OperationType.LIST, 'vendors(pending)'));

    // 2. Fetch stats manually or via snapshot
    const fetchStats = async () => {
       try {
          const vendorsSnap = await getDocs(query(collection(db, 'vendors'), where('approved', '==', true)));
          const totalVendors = vendorsSnap.docs.length;

          const bookingsSnap = await getDocs(collection(db, 'bookings'));
          let activeBookings = 0;
          let totalSales = 0;
          
          bookingsSnap.docs.forEach(d => {
             const data = d.data();
             if (data.status !== 'completed' && data.status !== 'rejected') {
                activeBookings++;
             }
             if (data.status === 'completed') {
                totalSales++;
             }
          });

          setStats({ totalSales, activeBookings, totalVendors });
       } catch(err) {
          handleFirestoreError(err, OperationType.LIST, 'stats');
       }
    };
    
    fetchStats();
    
    return () => unsubscribeVendors();
  }, []);

  const approveVendor = async (id: string) => {
    try {
       await updateDoc(doc(db, 'vendors', id), { approved: true });
       // Total vendors stat should ideally update, but we'll let a full refresh do it or live listeners
    } catch(err) {
       handleFirestoreError(err, OperationType.UPDATE, 'vendors');
    }
  };

  return (
    <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 max-w-[1400px] mx-auto w-full">
      {/* Stat Card: Revenue */}
      <div className="col-span-1 md:col-span-3 md:row-span-2 bg-white border-2 border-black rounded-3xl p-6 flex flex-col justify-between min-h-[160px]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Completed Sales</span>
        <div className="text-4xl font-bold italic tracking-tighter">{stats.totalSales}</div>
        <div className="flex items-center gap-2 text-xs text-green-600 font-bold mt-2">
          <span>+ Updated just now</span>
        </div>
      </div>

      {/* Stat Card: Bookings */}
      <div className="col-span-1 md:col-span-3 md:row-span-2 bg-[#FF6B00] border-2 border-black rounded-3xl p-6 text-white flex flex-col justify-between min-h-[160px]">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Active Bookings</span>
        <div className="text-5xl font-black">{stats.activeBookings}</div>
        <div className="text-xs font-medium opacity-90 mt-2">Total active tickets</div>
      </div>

      {/* Stat Card: Vendors */}
      <div className="col-span-1 md:col-span-3 md:row-span-2 bg-[#141414] border-2 border-black rounded-3xl p-6 text-white flex flex-col justify-between min-h-[160px]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B00]">Total Approved Vendors</span>
        <div className="text-5xl font-black">{stats.totalVendors}</div>
        <div className="text-xs font-medium text-gray-400 mt-2">Active partners</div>
      </div>
      
      {/* Admin Panel: Vendor Approval Queue */}
      <div className="col-span-1 md:col-span-9 md:row-span-4 bg-white border-2 border-black rounded-3xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Vendor Approval Queue</h2>
          {pendingVendors.length > 0 && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded font-bold uppercase">{pendingVendors.length} Pending</span>}
        </div>
        <div className="space-y-4 overflow-y-auto pr-2">
          {pendingVendors.length === 0 ? (
            <div className="text-center text-gray-500 py-8 italic text-sm">No pending approvals.</div>
          ) : pendingVendors.map(v => (
            <div key={v._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-black">{v.businessName?.charAt(0)}</div>
                <div>
                  <div className="font-bold text-sm text-black">{v.businessName}</div>
                  <div className="text-[10px] text-gray-400">Owner: {v.userIdName} | {v.userIdEmail}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveVendor(v._id)} className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors">APPROVE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
