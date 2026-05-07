import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';

export function CustomerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    
    getDoc(doc(db, 'customer_profiles', user._id)).then(docSnap => {
       if (docSnap.exists()) {
          setProfile(docSnap.data());
       }
       setLoading(false);
    }).catch(e => {
       handleFirestoreError(e, OperationType.GET, 'customer_profiles');
       setLoading(false);
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await setDoc(doc(db, 'customer_profiles', user._id), profile, { merge: true });
      
      if (newPassword) {
        if (auth.currentUser) {
           await updatePassword(auth.currentUser, newPassword);
           setPasswordSuccess('Profile and password updated successfully!');
           setNewPassword('');
        } else {
           setPasswordError('Session expired. Please log in again to change password.');
        }
      } else {
        alert('Profile updated successfully!');
      }
    } catch(err: any) {
      if (err.code === 'auth/requires-recent-login') {
         setPasswordError('This operation requires recent authentication. Please log out and log in again.');
      } else {
         handleFirestoreError(err, OperationType.UPDATE, 'customer_profiles');
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center font-bold">Loading...</div>;

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto w-full min-h-[calc(100vh-80px)]">
      <div className="bg-white border-2 border-black rounded-3xl p-8">
        <h1 className="text-3xl font-black tracking-tighter mb-2">My Profile</h1>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-8">Manage your personal and vehicle details</p>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b-2 border-black pb-2">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Phone Number</label>
                 <input type="tel" className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="+91 9999999999" />
              </div>
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Address</label>
                 <input type="text" className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="House 123, Sector 4..." />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold border-b-2 border-black pb-2">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Car Make</label>
                 <input type="text" className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={profile.carMake || ''} onChange={e => setProfile({...profile, carMake: e.target.value})} placeholder="e.g. Hyundai" />
              </div>
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Car Model</label>
                 <input type="text" className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={profile.carModel || ''} onChange={e => setProfile({...profile, carModel: e.target.value})} placeholder="e.g. i20" />
              </div>
              <div className="md:col-span-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">Registration Number</label>
                 <input type="text" className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={profile.carReg || ''} onChange={e => setProfile({...profile, carReg: e.target.value})} placeholder="HR 26 AK 0000" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold border-b-2 border-black pb-2">Change Password</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                 <label className="text-[10px] font-bold uppercase tracking-widest text-black/70">New Password</label>
                 <input type="password" className="w-full border-2 border-black rounded-xl p-3 mt-1 outline-none text-sm font-medium focus:border-[#FF6B00] transition-colors" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" />
              </div>
            </div>
            {passwordError && <p className="text-xs text-red-500 font-bold">{passwordError}</p>}
            {passwordSuccess && <p className="text-xs text-green-600 font-bold">{passwordSuccess}</p>}
          </div>

          <button type="submit" disabled={saving} className="w-full bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl mt-8 hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
