import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { motion } from 'motion/react';

export function VendorServices() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [vendorData, setVendorData] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState('');
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carReg, setCarReg] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!id) return;
    
    getDoc(doc(db, 'vendors', id)).then(docSnap => {
      if(docSnap.exists()) {
        setVendorData({ _id: docSnap.id, ...docSnap.data() });
      }
    }).catch(e => handleFirestoreError(e, OperationType.GET, 'vendors'));

    const sQuery = query(collection(db, 'services'), where('vendorId', '==', id));
    getDocs(sQuery).then(snapshot => {
      setServices(snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() })));
    }).catch(e => handleFirestoreError(e, OperationType.LIST, 'services'));
  }, [id]);

  const openBookingModal = (service: any) => {
     setSelectedService(service);
     setIsBookingModalOpen(true);
  };

  const confirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !vendorData || !selectedService) return;
    
    try {
      await addDoc(collection(db, 'bookings'), {
        customerId: user._id,
        vendorId: vendorData._id,
        serviceId: selectedService._id,
        status: 'pending',
        customerName: user.name,
        vendorBusinessName: vendorData.businessName,
        serviceTitle: selectedService.title,
        servicePrice: selectedService.price,
        carMake,
        carModel,
        carReg,
        phone
      });
      setIsBookingModalOpen(false);
      setBookingSuccess('Booking request sent successfully! Please check My Bookings for updates.');
      setCarMake(''); setCarModel(''); setCarReg(''); setPhone('');
      setTimeout(() => setBookingSuccess(''), 4000);
    } catch(e) {
      handleFirestoreError(e, OperationType.CREATE, 'bookings');
    }
  };

  return (
    <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full min-h-[calc(100vh-80px)] space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter">{vendorData?.businessName || 'Workshop'}</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Available Services</p>
        </div>
      </div>

      {bookingSuccess && (
        <div className="bg-[#141414] border-2 border-black text-white px-6 py-4 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400"/> 
          <span className="font-medium text-sm">{bookingSuccess}</span>
        </div>
      )}

      <motion.div layout className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {services.map((s, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={s._id} 
            className="col-span-1 md:col-span-4 bg-white border-2 border-black rounded-3xl p-6 flex flex-col justify-between min-h-[220px] hover:-translate-y-2 hover:shadow-[8px_8px_0_0_#000] focus:translate-y-0 transition-all duration-300 group"
          >
            {s.images && s.images.length > 0 && (
               <div className="w-full h-40 mb-4 rounded-xl overflow-hidden border-2 border-black">
                 <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
            )}
            <div>
               <div className="flex justify-between items-start mb-4">
                 <h3 className="font-bold text-xl leading-tight group-hover:text-[#FF6B00] transition-colors">{s.title}</h3>
                 <div className="text-xs font-bold bg-[#F8F9FA] px-2 py-1 rounded border border-gray-200">SERVICE</div>
               </div>
               <p className="text-sm text-gray-500 mb-6">{s.description}</p>
            </div>
            <div className="flex items-center justify-between mt-auto">
               <div className="text-2xl font-black italic tracking-tighter">₹{s.price}</div>
               <button onClick={() => openBookingModal(s)} className="px-6 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#FF6B00] hover:-translate-y-1 hover:shadow-lg transition-all border-2 border-transparent hover:border-black">Book Now</button>
            </div>
          </motion.div>
        ))}
        {services.length === 0 && <p className="col-span-12 text-sm font-medium text-gray-500 italic bg-white p-8 rounded-3xl border-2 border-black text-center">This vendor has no services yet.</p>}
      </motion.div>

      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md border-2 border-black rounded-3xl bg-white p-6 shadow-[8px_8px_0_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter mb-2">Book Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={confirmBooking} className="space-y-4">
             <div className="bg-[#F8F9FA] p-4 rounded-xl border border-gray-200 mb-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Service</p>
                <div className="font-bold text-lg">{selectedService?.title}</div>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Car Make *</label>
                  <input type="text" required className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={carMake} onChange={e => setCarMake(e.target.value)} placeholder="e.g. Honda" />
               </div>
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Car Model *</label>
                  <input type="text" required className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={carModel} onChange={e => setCarModel(e.target.value)} placeholder="e.g. City" />
               </div>
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Registration Number *</label>
                  <input type="text" required className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={carReg} onChange={e => setCarReg(e.target.value)} placeholder="e.g. MH 12 AB 1234" />
               </div>
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Mobile Number *</label>
                  <input type="tel" required className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your 10-digit number" />
               </div>
             </div>

             <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-xs font-medium mt-6">
                <strong>Notice:</strong> Price may vary according to the car and during the service period at the service station.
             </div>

             <button type="submit" className="w-full bg-[#FF6B00] text-black font-black uppercase tracking-widest py-4 rounded-xl mt-6 hover:bg-orange-500 transition-colors border-2 border-transparent hover:border-black">Confirm Booking</button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
