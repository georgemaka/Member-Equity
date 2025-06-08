export default function SimpleDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Member Equity Dashboard
      </h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome to Sukut Construction</h2>
        <p className="text-gray-600">
          This is a simplified dashboard to test that the application is working correctly.
        </p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">Total Members</h3>
            <p className="text-2xl font-bold text-blue-600">45</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">Total Capital</h3>
            <p className="text-2xl font-bold text-green-600">$12.5M</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900">Active Members</h3>
            <p className="text-2xl font-bold text-purple-600">42</p>
          </div>
        </div>
      </div>
    </div>
  )
}