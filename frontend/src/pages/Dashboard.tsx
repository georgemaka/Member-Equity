export default function Dashboard() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sukut Construction Member Equity Dashboard
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Welcome to your equity management system
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Members</h3>
              <p className="text-3xl font-bold text-sukut-600">--</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Equity Allocated</h3>
              <p className="text-3xl font-bold text-sukut-600">--%</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Distribution</h3>
              <p className="text-3xl font-bold text-sukut-600">--</p>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            System is ready for development. Install dependencies and start the servers!
          </div>
        </div>
      </div>
    </div>
  )
}