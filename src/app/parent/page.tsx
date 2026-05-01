'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ParentReportContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId') || 'guest'
  const childName = searchParams.get('name') || '小明'

  const weakChars = [
    { char: '旅', mastery: 45, count: 3 },
    { char: '馆', mastery: 52, count: 2 },
    { char: '礼', mastery: 58, count: 2 },
    { char: '物', mastery: 61, count: 2 },
    { char: '远', mastery: 63, count: 1 },
  ]

  const weeklyData = [
    { day: '周一', rate: 75 }, { day: '周二', rate: 60 },
    { day: '周三', rate: 80 }, { day: '周四', rate: 45 },
    { day: '周五', rate: 90 }, { day: '周六', rate: 70 },
    { day: '周日', rate: 0 },
  ]

  const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF6B6C] to-[#4ECDC4] text-white p-6 pt-10">
        <p className="text-sm opacity-80 mb-1">{today}</p>
        <h1 className="text-2xl font-bold">{childName} 的中文阅读报告</h1>
        <p className="text-sm opacity-80 mt-1">Day 3 🔥</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* HSK Progress */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">📈 HSK 进度</h2>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#FF6B6C]">HSK 2</span>
            <span className="text-sm text-gray-400">37% → 目标：3级</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-[#FF6B6C] to-[#4ECDC4] h-3 rounded-full" style={{ width: '37%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">已认识 87 个汉字 👏 距离3级还需 213 字</p>
        </div>

        {/* Today's Article */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">✅ 今日完成</h2>
          <p className="font-bold text-gray-800">Steve的第一次旅行</p>
          <p className="text-sm text-gray-400">HSK 2 级 · 145 字 · 阅读 4 分钟</p>
          <div className="flex gap-1 mt-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">今日新增：旅、行、餐</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '已掌握', value: '87 字', color: 'text-[#4ECDC4]' },
            { label: '本周新增', value: '+12 字', color: 'text-[#FF6B6C]' },
            { label: '连续阅读', value: '3 天', color: 'text-orange-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Weak Chars */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">🔍 薄弱字 TOP5</h2>
          <div className="space-y-3">
            {weakChars.map((w, i) => (
              <div key={w.char}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {i + 1}. &ldquo;{w.char}&rdquo;
                    <span className="text-xs text-gray-400 ml-2">出现 {w.count} 次</span>
                  </span>
                  <span className="text-xs font-medium text-gray-500">{w.mastery}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-[#FF6B6C] h-2 rounded-full transition-all" style={{ width: `${w.mastery}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">💡 明日计划：AI 将在新故事中自然复现这些字</p>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">📊 阅读完成率（本周）</h2>
          <div className="flex items-end justify-between gap-2 h-28">
            {weeklyData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#4ECDC4]/10 rounded-t-md relative" style={{ height: `${Math.max(d.rate || 5, 5)}%` }}>
                  <div className="absolute bottom-0 w-full bg-[#4ECDC4] rounded-t-md transition-all" style={{ height: `${d.rate}%` }} />
                </div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">🏆 连续阅读徽章</h2>
          <div className="flex justify-around">
            {[
              { icon: '🔥', name: '小火苗', active: true },
              { icon: '📚', name: '小书虫', active: false },
              { icon: '🚀', name: '探险家', active: false },
              { icon: '🏆', name: '大师', active: false },
            ].map(b => (
              <div key={b.name} className={`text-center ${b.active ? '' : 'opacity-30'}`}>
                <div className="text-3xl mb-1">{b.icon}</div>
                <p className="text-xs text-gray-500">{b.name}</p>
                <p className="text-xs text-gray-400">{b.active ? '✅' : `${['🔥','📚','🚀','🏆'].indexOf(b.icon) === 0 ? 3 : [3,7,14,30][['🔥','📚','🚀','🏆'].indexOf(b.icon)]}天`}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 py-4">
          汉字伙伴 · 为海外华裔少儿打造 · {today}
        </p>
      </div>
    </div>
  )
}

export default function ParentReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">加载中...</p>
      </div>
    }>
      <ParentReportContent />
    </Suspense>
  )
}
