import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleTab, setRoleTab] = useState('customer');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let userCredential;
      
      // Auto-provision admin if needed
      if (email === 'admin@example.com' && password === '123456' && roleTab === 'admin') {
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (adminErr: any) {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          const { setDoc } = await import('firebase/firestore');
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: 'System Admin',
            email,
            role: 'admin'
          });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const userSnapshot = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userSnapshot.exists()) {
        throw new Error("User profile not found");
      }
      
      const role = userSnapshot.data().role;
      
      if (role !== roleTab) {
        // Enforce logging into the correct portal
        await auth.signOut();
        throw new Error(`Invalid credentials for ${roleTab} portal.`);
      }

      if (role === 'admin') navigate('/admin');
      else if (role === 'vendor') navigate('/vendor');
      else if (role === 'mechanic') navigate('/mechanic');
      else navigate('/home');
      
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(err.message || 'Failed to login');
      }
    }
  };

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative">
       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
       
       <div className="w-full max-w-md bg-white border-2 border-black rounded-3xl p-8 relative z-10 shadow-[8px_8px_0_0_#000]">
          <div className="mb-6 flex gap-2 flex-wrap">
             <button onClick={() => { setRoleTab('customer'); setError(''); }} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border-2 ${roleTab === 'customer' ? 'bg-black text-white border-black' : 'bg-transparent text-gray-500 border-transparent hover:border-gray-200'}`}>Customer</button>
             <button onClick={() => { setRoleTab('vendor'); setError(''); }} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border-2 ${roleTab === 'vendor' ? 'bg-[#FF6B00] text-black border-[#FF6B00]' : 'bg-transparent text-gray-500 border-transparent hover:border-gray-200'}`}>Vendor</button>
             <button onClick={() => { setRoleTab('mechanic'); setError(''); }} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border-2 ${roleTab === 'mechanic' ? 'bg-[#141414] text-white border-black' : 'bg-transparent text-gray-500 border-transparent hover:border-gray-200'}`}>Mechanic</button>
             <button onClick={() => { setRoleTab('admin'); setError(''); }} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border-2 ${roleTab === 'admin' ? 'bg-purple-600 text-white border-purple-600' : 'bg-transparent text-gray-500 border-transparent hover:border-gray-200'}`}>Admin</button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tighter">
              {roleTab === 'customer' && 'Login to STYKY'}
              {roleTab === 'vendor' && 'Vendor Portal'}
              {roleTab === 'mechanic' && 'Mechanic Login'}
              {roleTab === 'admin' && 'Admin Console'}
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Welcome back partner</p>
          </div>
          
          {error && <div className="p-4 mb-6 text-sm text-red-500 bg-red-50 border-2 border-red-200 rounded-xl font-bold">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">Email</Label>
              <Input className="border-2 border-black rounded-xl p-4 h-auto outline-none bg-[#F8F9FA] text-black" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-bold tracking-widest text-black/70">Password</Label>
              <Input className="border-2 border-black rounded-xl p-4 h-auto outline-none bg-[#F8F9FA] text-black" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className={`w-full text-black font-black uppercase tracking-widest py-4 rounded-xl transition-colors border-2 ${roleTab === 'customer' ? 'bg-[#FF6B00] border-transparent hover:border-black' : roleTab === 'admin' ? 'bg-purple-600 text-white border-black hover:bg-purple-700' : roleTab === 'mechanic' ? 'bg-[#141414] text-white border-black hover:bg-black' : 'bg-[#FF6B00] border-black hover:bg-orange-500'}`}>SIGN IN</button>
          </form>
          
          <div className="mt-8 text-center border-t-2 border-black/5 pt-6">
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Don't have an account? <Link to="/register" className="text-[#FF6B00] hover:text-black transition-colors ml-2">Register</Link></p>
          </div>
       </div>
    </div>
  );
}
