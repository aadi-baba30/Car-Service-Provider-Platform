import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      await setDoc(doc(db, 'users', uid), {
        name,
        email,
        role
      });
      
      if (role === 'vendor') {
        await setDoc(doc(db, 'vendors', uid), {
          businessName,
          approved: false,
          userIdEmail: email,
          userIdName: name
        });
        setSuccess('Registration successful! Please wait for admin approval.');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use' 
        ? 'Email is already taken.' 
        : (err.message || 'Failed to register');
      setError(msg);
    }
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative">
       {/* Background gradient pattern */}
       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

       <div className="w-full max-w-md bg-white border-2 border-black rounded-3xl p-8 relative z-10 shadow-[8px_8px_0_0_#000] my-8 overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tighter">Join STYKY</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Get your cars fixed fast</p>
          </div>

          {error && <div className="p-4 mb-6 text-sm text-red-500 bg-red-50 border-2 border-red-200 rounded-xl font-bold">{error}</div>}
          {success && <div className="p-4 mb-6 text-sm text-green-700 bg-green-50 border-2 border-green-200 rounded-xl font-bold">{success}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">Name</Label>
              <Input className="border-2 border-black rounded-xl p-4 h-auto outline-none bg-[#F8F9FA] text-black" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">Email</Label>
              <Input className="border-2 border-black rounded-xl p-4 h-auto outline-none bg-[#F8F9FA] text-black" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">Password</Label>
              <Input className="border-2 border-black rounded-xl p-4 h-auto outline-none bg-[#F8F9FA] text-black" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            
            <div className="space-y-1 pt-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">I want to join as</Label>
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => setRole('customer')} className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] border-2 transition-colors ${role === 'customer' ? 'bg-black border-black text-white' : 'bg-white border-black text-black hover:bg-gray-100'}`}>Customer</button>
                <button type="button" onClick={() => setRole('vendor')} className={`flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] border-2 transition-colors ${role === 'vendor' ? 'bg-[#FF6B00] border-black text-black' : 'bg-white border-black text-black hover:bg-gray-100'}`}>Vendor</button>
              </div>
            </div>
            
            {role === 'vendor' && (
              <div className="space-y-1 pt-2">
                <Label className="uppercase text-[10px] font-bold tracking-widest text-[#FF6B00]">Business Name</Label>
                <Input className="border-2 border-black rounded-xl p-4 h-auto outline-none bg-orange-50 text-black border-orange-200 focus:border-black" value={businessName} onChange={e => setBusinessName(e.target.value)} required={role === 'vendor'} />
              </div>
            )}
            
            <button type="submit" className="w-full bg-[#FF6B00] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-orange-500 transition-colors border-2 border-transparent hover:border-black mt-4">REGISTER NOW</button>
          </form>

          <div className="mt-8 text-center border-t-2 border-black/5 pt-6">
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Already have an account? <Link to="/login" className="text-[#FF6B00] hover:text-black transition-colors ml-2">Login</Link></p>
          </div>
        </div>
    </div>
  );
}
