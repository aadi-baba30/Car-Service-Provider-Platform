import React, { useEffect, useState } from 'react';
import { MapPin, ArrowRight, Search, CreditCard, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { motion } from 'motion/react';

export function CustomerHome() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePayment = async (mode: 'online' | 'cash') => {
    if (!selectedBookingForPayment) return;
    try {
      if (mode === 'online') {
        alert('Redirecting to payment gateway...');
        // Simulate successful payment
        await updateDoc(doc(db, 'bookings', selectedBookingForPayment._id), {
           status: 'completed',
           paymentMode: 'online'
        });
        alert('Payment successful!');
      } else {
        await updateDoc(doc(db, 'bookings', selectedBookingForPayment._id), {
           status: 'awaiting_cash',
           paymentMode: 'cash'
        });
        alert('Please pay cash at the service station.');
      }
      setIsPaymentModalOpen(false);
    } catch(err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Fetch approved vendors
    const vendorQuery = query(collection(db, 'vendors'), where('approved', '==', true));
    getDocs(vendorQuery).then(snapshot => {
      const v = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      setVendors(v);
    }).catch(e => handleFirestoreError(e, OperationType.LIST, 'vendors'));

    // Fetch all services
    const servicesQuery = query(collection(db, 'services'));
    getDocs(servicesQuery).then(snapshot => {
      const s = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      setServices(s);
    }).catch(e => handleFirestoreError(e, OperationType.LIST, 'services'));

    // Fetch customer bookings
    const bookingsQuery = query(collection(db, 'bookings'), where('customerId', '==', user._id));
    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const b = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      setBookings(b);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bookings'));
    
    return () => unsubscribe();
  }, [user]);

  const filteredServices = services.filter(s => {
    const q = searchQuery.toLowerCase();
    return (s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 max-w-[1400px] mx-auto w-full min-h-[calc(100vh-80px)]">
      
      {/* Service Map Context (Nearby Vendors) */}
      <div className="col-span-1 md:col-span-4 md:row-span-6 bg-[#E2E8F0] border-2 border-black rounded-3xl relative overflow-hidden flex flex-col min-h-[400px]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
        <div className="relative p-6 z-10 flex-1 flex flex-col">
          <div>
            <h2 className="text-sm font-bold text-black uppercase tracking-widest">Nearby Vendors</h2>
            <p className="text-[10px] text-gray-600 font-medium">Sector 4, Gurugram</p>
          </div>
          <div className="mt-auto space-y-3 pt-6">
            {vendors.map((v, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={v._id} 
                onClick={() => navigate(`/vendor/${v._id}`)} 
                className="bg-white p-4 border-2 border-black rounded-2xl cursor-pointer hover:-translate-y-1 transition-transform group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-black italic text-[#FF6B00]">VIEW VENDOR</div>
                    <div className="text-sm font-bold">{v.businessName}</div>
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center"><MapPin className="w-3 h-3 mr-1 inline"/> Verified Partner</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white group-hover:bg-[#FF6B00] transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
            {vendors.length === 0 && <p className="text-xs font-bold text-gray-500 italic bg-white/50 p-4 rounded-xl border border-black/10">No vendors found yet.</p>}
          </div>
        </div>
      </div>

      {/* Main Column */}
      <div className="col-span-1 md:col-span-8 md:row-span-6 flex flex-col gap-4 overflow-hidden">
        
        {/* Search Services */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 flex-shrink-0">
          <div className="flex items-center gap-4 border-2 border-black rounded-xl px-4 py-3 bg-[#F8F9FA] focus-within:bg-white transition-colors">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
               type="text" 
               placeholder="Search for car wash, oil change, denting..." 
               className="bg-transparent flex-1 outline-none text-sm font-medium"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Suggested Services */}
        <div className="bg-white border-2 border-black rounded-3xl p-8 flex-1 overflow-y-auto">
          <h2 className="text-xl font-black uppercase tracking-widest mb-6">{searchQuery ? 'Search Results' : 'Suggested Services'}</h2>
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((s, i) => {
              const vendor = vendors.find(v => v._id === s.vendorId);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={s._id} 
                  className="border-2 border-black rounded-2xl p-4 flex gap-4 hover:-translate-y-1 transition-transform cursor-pointer group" 
                  onClick={() => navigate(`/vendor/${s.vendorId}`)}
                >
                  {s.images && s.images[0] ? (
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-black">
                       <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center px-2">No Image</div>
                  )}
                  <div className="flex-1 flex flex-col">
                     <h4 className="font-bold text-sm leading-tight text-black group-hover:text-[#FF6B00] transition-colors">{s.title}</h4>
                     <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 flex-1">{s.description}</p>
                     <div className="flex justify-between items-end mt-2">
                       <span className="text-xs font-black italic tracking-tighter">₹{s.price}</span>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{vendor?.businessName || 'Vendor'}</span>
                     </div>
                  </div>
                </motion.div>
              )
            })}
            {filteredServices.length === 0 && <p className="text-sm font-medium text-gray-500 col-span-2">No services found matching your search.</p>}
          </motion.div>

          <h2 className="text-xl font-black uppercase tracking-widest mb-6 mt-12">My Bookings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={b._id} 
                className="border-2 border-black rounded-2xl p-6 bg-[#F8F9FA] flex flex-col justify-between hover:shadow-[4px_4px_0_0_#000] focus:shadow-[4px_4px_0_0_#000] transition-all"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg leading-tight">{b.serviceTitle || 'Service'}</h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-black ${['completed', 'payment_pending', 'awaiting_cash'].includes(b.status) ? 'bg-green-400 text-black' : 'bg-yellow-100 text-black'}`}>{b.status.replace('_', ' ')}</span>
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{b.vendorBusinessName || 'Vendor'}</div>
                </div>
                <div className="pt-4 border-t border-black/10 flex flex-col gap-4">
                   <div className="flex justify-between items-end">
                     <div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase">Scheduled Time</div>
                       <div className="text-sm font-black">{b.time || 'Pending assignment'}</div>
                     </div>
                     {b.mechanicId && (
                       <div className="text-right">
                         <div className="text-[10px] text-gray-400 font-bold uppercase">Mechanic</div>
                         <div className="text-sm font-bold text-[#FF6B00]">{b.mechanicName || 'Assigned'}</div>
                       </div>
                     )}
                   </div>
                   {b.status === 'payment_pending' && (
                     <button onClick={() => { setSelectedBookingForPayment(b); setIsPaymentModalOpen(true); }} className="w-full bg-[#FF6B00] text-black font-black uppercase tracking-widest py-3 rounded-lg text-xs hover:bg-orange-500 transition-colors border-2 border-transparent hover:border-black">Pay Now / View Bill</button>
                   )}
                </div>
              </motion.div>
            ))}
            {bookings.length === 0 && <p className="text-sm font-medium text-gray-500 col-span-2">You have no active bookings currently.</p>}
          </div>
        </div>

        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="sm:max-w-md border-2 border-black rounded-3xl bg-white p-6 shadow-[8px_8px_0_0_#000]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter mb-2">Service Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
               <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between mb-2 pb-2 border-b-2 border-gray-200 border-dashed">
                    <span className="text-sm font-bold">Base Service<br/><span className="text-[10px] text-gray-500">{selectedBookingForPayment?.serviceTitle}</span></span>
                    <span className="text-sm font-black">₹{selectedBookingForPayment?.finalServicePrice || selectedBookingForPayment?.servicePrice}</span>
                  </div>
                  
                  {selectedBookingForPayment?.billDetails?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between mb-2 pb-2 border-b-2 border-gray-200 border-dashed">
                       <span className="text-sm font-bold">{item.name}</span>
                       <span className="text-sm font-black">₹{item.price}</span>
                    </div>
                  ))}

                  {selectedBookingForPayment?.laborCost > 0 && (
                     <div className="flex justify-between mb-2">
                       <span className="text-sm font-bold">Labor Cost</span>
                       <span className="text-sm font-black">₹{selectedBookingForPayment?.laborCost}</span>
                     </div>
                  )}

                  <div className="border-t-2 border-black pt-3 mt-3 flex justify-between">
                     <span className="text-sm font-black uppercase tracking-widest text-[#FF6B00]">Total Amount</span>
                     <span className="text-2xl font-black italic">₹{selectedBookingForPayment?.totalAmount}</span>
                  </div>
               </div>
               
               <p className="text-[10px] text-center font-bold text-gray-500 uppercase tracking-widest mb-2 mt-6">Select Payment Method</p>
               <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handlePayment('online')} className="flex flex-col items-center justify-center p-4 border-2 border-black rounded-xl hover:bg-[#F8F9FA] transition-colors group">
                    <CreditCard className="w-6 h-6 mb-2 group-hover:text-[#FF6B00] transition-colors" />
                    <span className="text-xs font-bold uppercase tracking-widest">Pay Online</span>
                 </button>
                 <button onClick={() => handlePayment('cash')} className="flex flex-col items-center justify-center p-4 border-2 border-black rounded-xl hover:bg-[#F8F9FA] transition-colors group">
                    <Banknote className="w-6 h-6 mb-2 group-hover:text-green-600 transition-colors" />
                    <span className="text-xs font-bold uppercase tracking-widest">Pay Cash</span>
                 </button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

    </div>
  );
}
