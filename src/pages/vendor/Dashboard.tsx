import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';

export function VendorDashboard() {
  const { user } = useAuth();
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // form states
  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sPrice, setSPrice] = useState('');
  const [sImage, setSImage] = useState('');
  
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPass, setMPass] = useState('');

  // Bill Generation States
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedBookingForBill, setSelectedBookingForBill] = useState<any>(null);
  const [billBasePrice, setBillBasePrice] = useState<number>(0);
  const [billItems, setBillItems] = useState<{name: string, price: number}[]>([]);
  const [billLaborCost, setBillLaborCost] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Fetch vendor profile
    getDoc(doc(db, 'vendors', user._id)).then(docSnap => {
       if (docSnap.exists()) {
          setVendorProfile(docSnap.data());
       }
    }).catch(err => handleFirestoreError(err, OperationType.GET, 'vendors'));

    // Services
    const sQuery = query(collection(db, 'services'), where('vendorId', '==', user._id));
    const uS = onSnapshot(sQuery, 
      (snap) => setServices(snap.docs.map(d => ({ _id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'services')
    );

    // Mechanics
    const mQuery = query(collection(db, 'mechanics'), where('vendorId', '==', user._id));
    const uM = onSnapshot(mQuery,
      (snap) => setMechanics(snap.docs.map(d => ({ _id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'mechanics')
    );

    // Bookings
    const bQuery = query(collection(db, 'bookings'), where('vendorId', '==', user._id));
    const uB = onSnapshot(bQuery,
      (snap) => setBookings(snap.docs.map(d => ({ _id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'bookings')
    );

    return () => { uS(); uM(); uB(); };
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Image size should be less than 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addOrUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const serviceData: any = {
        vendorId: user._id,
        title: sTitle,
        description: sDesc,
        price: Number(sPrice)
      };
      if (sImage) serviceData.images = [sImage];

      if (editingServiceId) {
         await updateDoc(doc(db, 'services', editingServiceId), serviceData);
      } else {
         await addDoc(collection(db, 'services'), serviceData);
      }
      setSTitle(''); setSDesc(''); setSPrice(''); setSImage(''); setEditingServiceId(null);
    } catch(err) {
      handleFirestoreError(err, editingServiceId ? OperationType.UPDATE : OperationType.CREATE, 'services');
    }
  };

  const startEditService = (service: any) => {
     setEditingServiceId(service._id);
     setSTitle(service.title || '');
     setSDesc(service.description || '');
     setSPrice(String(service.price || ''));
     setSImage(service.images && service.images.length > 0 ? service.images[0] : '');
  };

  const cancelEditService = () => {
     setEditingServiceId(null);
     setSTitle(''); setSDesc(''); setSPrice(''); setSImage('');
  };

  const addMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { getApp, initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { setDoc, doc } = await import('firebase/firestore');

      let tempApp;
      try {
        tempApp = getApp("tempApp");
      } catch (e) {
        tempApp = initializeApp(getApp().options, "tempApp");
      }
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, mEmail, mPass);
      const uid = userCredential.user.uid;
      
      await signOut(tempAuth);

      await setDoc(doc(db, 'users', uid), {
        name: mName,
        email: mEmail,
        role: 'mechanic'
      });
      await setDoc(doc(db, 'mechanics', uid), {
        vendorId: user._id,
        earnings: 0,
        userIdEmail: mEmail,
        userIdName: mName
      });

      setMName(''); setMEmail(''); setMPass('');
    } catch(err: any) {
      console.error(err);
      alert(err.message || 'Failed to create mechanic');
    }
  };

  const assignMechanic = async (bookingId: string, mechanicId: string, time: string) => {
    try {
       const mechanic = mechanics.find(m => m._id === mechanicId);
       
       await updateDoc(doc(db, 'bookings', bookingId), {
         mechanicId,
         time,
         mechanicName: mechanic?.userIdName || 'Mechanic',
         status: 'assigned'
       });
    } catch(err) {
       handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const openBillingModal = (booking: any) => {
    setSelectedBookingForBill(booking);
    setBillBasePrice(booking.servicePrice || 0);
    setBillItems([]);
    setBillLaborCost(0);
    setIsBillingModalOpen(true);
  };

  const addItemToBill = () => {
    setBillItems([...billItems, { name: '', price: 0 }]);
  };

  const removeBillItem = (index: number) => {
    const newItems = [...billItems];
    newItems.splice(index, 1);
    setBillItems(newItems);
  };

  const updateBillItem = (index: number, field: string, value: any) => {
    const newItems = [...billItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBillItems(newItems);
  };

  const generateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForBill) return;
    try {
       const itemsTotal = billItems.reduce((acc, item) => acc + Number(item.price), 0);
       const totalAmount = Number(billBasePrice) + itemsTotal + Number(billLaborCost);
       await updateDoc(doc(db, 'bookings', selectedBookingForBill._id), {
          status: 'payment_pending',
          finalServicePrice: Number(billBasePrice),
          billDetails: billItems,
          laborCost: Number(billLaborCost),
          totalAmount
       });
       setIsBillingModalOpen(false);
    } catch(err) {
       handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const markCashPaid = async (booking: any) => {
    try {
       await updateDoc(doc(db, 'bookings', booking._id), {
          status: 'completed'
       });
    } catch(err) {
       handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const earnings = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.servicePrice || 0), 0);

  return (
    <>
      <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full min-h-[calc(100vh-80px)] space-y-8">
      <div className="flex justify-between items-center bg-white border-2 border-black rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F8F9FA] rounded-full translate-x-1/2 -translate-y-1/2 -z-0 blur-2xl"></div>
        <div className="relative z-10">
           <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B00]">Vendor Platform</span>
           <h1 className="text-3xl font-black tracking-tighter mt-1">{vendorProfile?.businessName || 'Your Business'} Dashboard</h1>
        </div>
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl px-6 py-4 flex flex-col items-end relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B00]">Total Earnings</span>
          <div className="text-3xl font-black italic tracking-tighter">₹{earnings}</div>
        </div>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList className="bg-white border-2 border-black h-14 rounded-2xl p-1 gap-2">
          <TabsTrigger value="bookings" className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white font-bold tracking-tight rounded-xl uppercase text-xs h-full">Bookings</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-black data-[state=active]:text-white font-bold tracking-tight rounded-xl uppercase text-xs h-full">Services</TabsTrigger>
          <TabsTrigger value="mechanics" className="data-[state=active]:bg-black data-[state=active]:text-white font-bold tracking-tight rounded-xl uppercase text-xs h-full">Mechanics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings" className="space-y-4 mt-8">
          <div className="bg-white border-2 border-black rounded-3xl p-8">
            <h2 className="text-xl font-black uppercase tracking-widest mb-6">Customer Bookings</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-black">
                    <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Customer</TableHead>
                    <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Service & Mechanics</TableHead>
                    <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Status</TableHead>
                    <TableHead className="font-bold text-black uppercase tracking-widest text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map(b => (
                    <TableRow key={b._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <TableCell className="font-bold border-r border-gray-100">
                        <div>{b.customerName}</div>
                        <div className="text-[10px] text-gray-500 font-normal uppercase tracking-widest mt-1">{b.phone || 'No Phone'}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{b.serviceTitle}</div>
                        {b.mechanicName && <div className="text-xs text-[#FF6B00] font-bold mt-1">Mech: {b.mechanicName}</div>}
                        {b.additionalDetails && <div className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded inline-block mt-1">Mech Note: {b.additionalDetails}</div>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-black ${['completed', 'mechanic_completed', 'payment_pending', 'awaiting_cash'].includes(b.status) ? 'bg-green-400 text-black' : 'bg-yellow-100 text-black'}`}>{b.status.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell className="space-x-2">
                        {b.status === 'pending' && (
                           <Dialog>
                             <DialogTrigger asChild><button className="px-4 py-2 border-2 border-black rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-colors">ASSIGN</button></DialogTrigger>
                             <DialogContent className="border-2 border-black rounded-3xl p-6">
                               <DialogHeader><DialogTitle className="font-black text-xl tracking-tighter">Assign Mechanic</DialogTitle></DialogHeader>
                               <div className="space-y-4 pt-4">
                                 <div>
                                    <Label className="uppercase text-[10px] font-bold tracking-widest">Mechanic</Label>
                                    <select className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none" id={`mech_${b._id}`}>
                                      {mechanics.map(m => <option key={m._id} value={m._id}>{m.userIdName}</option>)}
                                    </select>
                                 </div>
                                 <div>
                                   <Label className="uppercase text-[10px] font-bold tracking-widest">Scheduled Time</Label>
                                   <Input className="border-2 border-black rounded-xl p-3 mt-1 outline-none" id={`time_${b._id}`} defaultValue="10:00 AM" />
                                 </div>
                                 <button className="w-full bg-[#FF6B00] text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-orange-500 transition-colors" onClick={() => {
                                   const mid = (document.getElementById(`mech_${b._id}`) as HTMLSelectElement).value;
                                   const t = (document.getElementById(`time_${b._id}`) as HTMLInputElement).value;
                                   assignMechanic(b._id, mid, t);
                                 }}>Assign</button>
                               </div>
                             </DialogContent>
                           </Dialog>
                        )}
                        {b.status === 'mechanic_completed' && (
                          <button onClick={() => openBillingModal(b)} className="px-4 py-2 border-2 border-transparent bg-green-500 text-black rounded-xl text-xs font-bold hover:bg-green-600 transition-colors shadow">GENERATE BILL</button>
                        )}
                        {b.status === 'awaiting_cash' && (
                          <button onClick={() => markCashPaid(b)} className="px-4 py-2 border-2 border-black rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-orange-500 transition-colors">MARK PAID</button>
                        )}
                        {['accepted', 'assigned', 'in-progress'].includes(b.status) && <span className="text-[10px] font-bold text-gray-400">WAITING ON MECHANIC</span>}
                        {b.status === 'payment_pending' && <span className="text-[10px] font-bold text-gray-400">WAITING ON PAYMENT</span>}
                        {b.status === 'completed' && <span className="text-[10px] font-bold text-green-600">PAID & COMPLETED</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {bookings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500 italic text-sm">No bookings yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4 mt-8">
           <div className="bg-white border-2 border-black rounded-3xl p-8">
             <div className="mb-8">
               <h2 className="text-xl font-black uppercase tracking-widest">Manage Services</h2>
               <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Add new services customers can book</p>
             </div>
             
             <div className="grid md:grid-cols-12 gap-8">
               <div className="md:col-span-5 bg-[#F8F9FA] border border-gray-200 rounded-3xl p-6">
                 <h3 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-[#FF6B00]">{editingServiceId ? 'Edit Service' : 'Create New Service'}</h3>
                 <form onSubmit={addOrUpdateService} className="space-y-4">
                   <div>
                     <Label className="uppercase text-[10px] font-bold tracking-widest">Title</Label>
                     <Input className="border-2 border-black rounded-xl mt-1 outline-none bg-white" value={sTitle} onChange={e=>setSTitle(e.target.value)} required />
                   </div>
                   <div>
                     <Label className="uppercase text-[10px] font-bold tracking-widest">Description</Label>
                     <Input className="border-2 border-black rounded-xl mt-1 outline-none bg-white" value={sDesc} onChange={e=>setSDesc(e.target.value)} />
                   </div>
                   <div>
                     <Label className="uppercase text-[10px] font-bold tracking-widest">Price (₹)</Label>
                     <Input className="border-2 border-black rounded-xl mt-1 outline-none bg-white" type="number" value={sPrice} onChange={e=>setSPrice(e.target.value)} required />
                   </div>
                   <div>
                     <Label className="uppercase text-[10px] font-bold tracking-widest">Image</Label>
                     <Input className="border-2 border-black rounded-xl mt-1 outline-none bg-white p-2 text-xs" type="file" accept="image/*" onChange={handleImageChange} />
                     {sImage && <div className="mt-2 h-20 w-20 rounded-xl overflow-hidden border-2 border-black"><img src={sImage} alt="preview" className="w-full h-full object-cover" /></div>}
                   </div>
                   <div className="flex gap-2 mt-4">
                     {editingServiceId && <button type="button" onClick={cancelEditService} className="flex-1 border-2 border-black text-black font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-gray-100 transition-colors text-xs">Cancel</button>}
                     <button type="submit" className="flex-1 bg-black text-white font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-gray-800 transition-colors text-xs">{editingServiceId ? 'Update Service' : 'Add Service'}</button>
                   </div>
                 </form>
               </div>
               
               <div className="md:col-span-7 space-y-4 h-[500px] overflow-y-auto pr-2">
                 {services.map(s => (
                   <div key={s._id} className="border-2 border-black rounded-2xl p-6 relative overflow-hidden group flex gap-4">
                      {s.images && s.images.length > 0 && (
                        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 border-black">
                          <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-lg leading-tight">{s.title}</h4>
                           <span className="text-xl font-black italic tracking-tighter">₹{s.price}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{s.description}</p>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEditService(s)} className="text-xs font-bold uppercase tracking-widest text-[#FF6B00] hover:text-black">Edit</button>
                        </div>
                      </div>
                   </div>
                 ))}
                 {services.length === 0 && <p className="text-gray-500 italic text-sm text-center py-8">No services added.</p>}
               </div>
             </div>
           </div>
        </TabsContent>

        <TabsContent value="mechanics" className="space-y-4 mt-8">
           <div className="grid md:grid-cols-12 gap-8">
             <div className="md:col-span-8 bg-white border-2 border-black rounded-3xl p-8">
               <div className="mb-8">
                 <h2 className="text-xl font-black uppercase tracking-widest">Manage Mechanics</h2>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Create accounts for your mechanics to login</p>
               </div>
               
               <div className="grid md:grid-cols-2 gap-4">
                 {mechanics.map(m => (
                   <div key={m._id} className="bg-[#141414] border-2 border-black rounded-2xl p-6 text-white flex flex-col justify-between min-h-[160px]">
                       <div>
                         <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-green-400"></div>
                           <h4 className="font-bold text-sm leading-tight">{m.userIdName}</h4>
                         </div>
                         <p className="text-[10px] text-gray-500 font-medium">{m.userIdEmail}</p>
                      </div>
                      <div className="pt-4 border-t border-white/10 mt-4 flex items-end justify-between">
                         <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF6B00]">Earnings</span>
                         <span className="font-black italic tracking-tighter text-lg">₹{m.earnings}</span>
                      </div>
                   </div>
                 ))}
                 {mechanics.length === 0 && <p className="text-gray-500 italic text-sm col-span-2">No mechanics created.</p>}
               </div>
             </div>
             
             <div className="md:col-span-4 bg-[#FF6B00] border-2 border-black rounded-3xl p-8 text-black flex flex-col">
               <h3 className="font-black mb-6 uppercase text-xl leading-tight tracking-tighter">Add <br/>Mechanic</h3>
               <form onSubmit={addMechanic} className="space-y-4 flex-1 flex flex-col">
                 <div>
                   <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">Name</Label>
                   <Input className="border-2 border-black rounded-xl mt-1 outline-none bg-white text-black placeholder:text-gray-400" value={mName} onChange={e=>setMName(e.target.value)} required />
                 </div>
                 <div>
                   <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">Email (Login)</Label>
                   <Input className="border-2 border-black rounded-xl mt-1 outline-none bg-white text-black placeholder:text-gray-400" type="email" value={mEmail} onChange={e=>setMEmail(e.target.value)} required />
                 </div>
                 <div>
                   <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">Password</Label>
                   <Input className="border-2 border-black rounded-xl mt-1 outline-none bg-white text-black placeholder:text-gray-400" type="password" value={mPass} onChange={e=>setMPass(e.target.value)} required />
                 </div>
                 <button type="submit" className="w-full bg-black text-white font-bold uppercase tracking-widest py-4 rounded-xl mt-auto hover:bg-gray-800 transition-colors text-xs">Create Mechanic</button>
               </form>
             </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
      <Dialog open={isBillingModalOpen} onOpenChange={setIsBillingModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto border-2 border-black rounded-3xl bg-white p-6 md:p-8 shadow-[8px_8px_0_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter mb-2">Generate Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={generateBill} className="space-y-6">
             <div className="bg-[#F8F9FA] p-5 rounded-2xl border-2 border-black">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-lg">{selectedBookingForBill?.serviceTitle}</h4>
                    {selectedBookingForBill?.additionalDetails && <p className="text-sm font-bold text-[#FF6B00] mt-1">Mech Note: {selectedBookingForBill?.additionalDetails}</p>}
                  </div>
                </div>
                <div>
                   <Label className="uppercase text-[10px] font-bold tracking-widest text-[#FF6B00]">Base Service Price (₹) - Editable</Label>
                   <Input type="number" required className="border-2 border-black rounded-xl p-4 mt-2 font-black text-xl bg-white" value={billBasePrice} onChange={e => setBillBasePrice(Number(e.target.value))} />
                </div>
             </div>
             
             <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <Label className="uppercase text-[10px] font-bold tracking-widest">Additional Parts/Works (Items)</Label>
                  <button type="button" onClick={addItemToBill} className="text-[#FF6B00] border-2 border-[#FF6B00] bg-orange-50 hover:bg-[#FF6B00] hover:text-black transition-colors rounded-lg px-3 py-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                    <Plus className="w-3 h-3" /> Add Slot
                  </button>
                </div>
                
                {billItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center bg-white border-2 border-gray-200 p-3 rounded-xl focus-within:border-black transition-colors">
                     <div className="flex-1">
                       <Input type="text" required placeholder="Item description..." className="border-0 bg-transparent text-sm font-bold p-0 focus-visible:ring-0 shadow-none h-auto rounded-none" value={item.name} onChange={e => updateBillItem(index, 'name', e.target.value)} />
                     </div>
                     <div className="w-24">
                       <Input type="number" required placeholder="Price" className="border-0 border-l-2 border-gray-200 bg-transparent text-sm font-bold p-0 pl-3 focus-visible:ring-0 shadow-none h-auto rounded-none text-right" value={item.price} onChange={e => updateBillItem(index, 'price', Number(e.target.value))} />
                     </div>
                     <button type="button" onClick={() => removeBillItem(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-1">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
                
                {billItems.length === 0 && <p className="text-xs text-gray-500 font-medium italic">No additional parts or services added.</p>}
             </div>

             <div className="pt-4 border-t-2 border-dashed border-gray-200">
                <Label className="uppercase text-[10px] font-bold tracking-widest text-[#FF6B00]">Labor Cost (₹) - Earned by Mechanic</Label>
                <Input type="number" className="border-2 border-black rounded-xl p-4 mt-2 font-black text-xl bg-[#F8F9FA]" value={billLaborCost} onChange={e => setBillLaborCost(Number(e.target.value))} />
             </div>

             <div className="bg-[#141414] p-5 rounded-2xl flex justify-between items-center text-white mt-4 border-2 border-black shadow-[4px_4px_0_0_#FF6B00]">
                <span className="uppercase text-[10px] font-bold tracking-widest">Total Amount</span>
                <span className="text-3xl font-black italic">₹{Number(billBasePrice) + billItems.reduce((sum, item) => sum + Number(item.price), 0) + Number(billLaborCost)}</span>
             </div>

             <button type="submit" className="w-full bg-[#FF6B00] text-black font-black uppercase tracking-widest py-4 rounded-xl mt-6 hover:bg-orange-500 transition-colors border-2 border-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1">Finalize & Issue Bill to Customer</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
