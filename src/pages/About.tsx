export function About() {
  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full min-h-[calc(100vh-80px)]">
      <div className="bg-white border-2 border-black rounded-3xl p-8">
        <h1 className="text-3xl font-black tracking-tighter mb-4">About STYKY</h1>
        <p className="text-gray-600 font-medium mb-6">
          STYKY is your go-to destination for all your vehicle servicing needs. We connect you with verified, trusted mechanics and service vendors in your area, providing a seamless and transparent booking experience.
        </p>
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-gray-200">
             <h3 className="font-bold text-lg mb-2">Verified Vendors</h3>
             <p className="text-sm text-gray-500">Every service station is thoroughly verified to ensure the highest quality of service.</p>
          </div>
          <div className="p-6 bg-[#F8F9FA] rounded-2xl border border-gray-200">
             <h3 className="font-bold text-lg mb-2">Transparent Pricing</h3>
             <p className="text-sm text-gray-500">No hidden costs. See exactly what you'll pay before you commit to a service.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
