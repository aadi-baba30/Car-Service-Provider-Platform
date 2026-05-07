import { Mail, Phone } from 'lucide-react';

export function Support() {
  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto w-full min-h-[calc(100vh-80px)]">
      <div className="bg-white border-2 border-black rounded-3xl p-8 text-center">
        <h1 className="text-3xl font-black tracking-tighter mb-2">Customer Support</h1>
        <p className="text-sm text-gray-500 font-medium mb-8">We're here to help you</p>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 border-2 border-black rounded-2xl justify-center bg-[#F8F9FA]">
            <Phone className="w-5 h-5 text-[#FF6B00]" />
            <span className="font-bold">+91 9835529813</span>
          </div>
          <div className="flex items-center gap-4 p-4 border-2 border-black rounded-2xl justify-center bg-[#F8F9FA]">
            <Mail className="w-5 h-5 text-[#FF6B00]" />
            <span className="font-bold">aman9555530916@gmail.com</span>
          </div>
        </div>
        
        <div className="mt-8 text-left">
           <h3 className="font-black tracking-tight text-lg mb-4">Send us a message</h3>
           <textarea className="w-full border-2 border-black rounded-xl p-4 outline-none text-sm focus:border-[#FF6B00] transition-colors" rows={4} placeholder="How can we help?"></textarea>
           <button className="w-full bg-black text-white font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-gray-800 transition-colors">Send Message</button>
        </div>
      </div>
    </div>
  );
}
