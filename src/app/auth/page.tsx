'use client'
import { useState } from 'react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 1500))
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✉️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">检查你的邮箱</h1>
          <p className="text-gray-600">我们已发送登录链接到<br/><strong>{email}</strong></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📖</div>
          <h1 className="text-3xl font-bold text-[#FF6B6C] mb-2">汉字伙伴</h1>
          <p className="text-gray-500 text-lg">每天5分钟，在故事里认识汉字</p>
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">家长邮箱</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4ECDC4] focus:ring-2 focus:ring-[#4ECDC4]/20 outline-none mb-4"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !email}
            className="w-full py-3 rounded-xl font-semibold text-white bg-[#FF6B6C] hover:bg-[#ff5252] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '⏳ 发送中...' : '发送登录链接'}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">无需注册，输入邮箱即可开始</p>
      </div>
    </div>
  )
}
