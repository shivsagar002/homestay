import { useState } from 'react'

function TestComponent() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Tailwind CSS Test
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          If you can see this styled correctly, Tailwind is working!
        </p>
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={() => setCount(count - 1)}
            className="btn-primary px-4 py-2"
          >
            -
          </button>
          <span className="text-2xl font-bold text-gray-900 min-w-[60px] text-center">
            {count}
          </span>
          <button 
            onClick={() => setCount(count + 1)}
            className="btn-primary px-4 py-2"
          >
            +
          </button>
        </div>
        <div className="mt-6 p-4 bg-primary-50 rounded-lg">
          <p className="text-primary-700 text-center">
            This is a glass effect container
          </p>
        </div>
      </div>
    </div>
  )
}

export default TestComponent