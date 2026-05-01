'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TAGS = [
  { id: 'minecraft', label: 'Minecraft', emoji: '⛏️', cat: '游戏' },
  { id: 'roblox', label: 'Roblox', emoji: '🎮', cat: '游戏' },
  { id: 'mario', label: '马里奥', emoji: '🍄', cat: '游戏' },
  { id: 'pokemon', label: '宝可梦', emoji: '⚡', cat: '游戏' },
  { id: 'basketball', label: '篮球', emoji: '🏀', cat: '运动' },
  { id: 'football', label: '足球', emoji: '⚽', cat: '运动' },
  { id: 'skateboard', label: '滑板', emoji: '🛹', cat: '运动' },
  { id: 'swimming', label: '游泳', emoji: '🏊', cat: '运动' },
  { id: 'dinosaur', label: '恐龙', emoji: '🦕', cat: '自然' },
  { id: 'space', label: '太空', emoji: '🚀', cat: '自然' },
  { id: 'ocean', label: '海洋', emoji: '🌊', cat: '自然' },
  { id: 'animals', label: '动物', emoji: '🐾', cat: '自然' },
  { id: 'food', label: '美食', emoji: '🍜', cat: '生活' },
  { id: 'pets', label: '宠物', emoji: '🐱', cat: '生活' },
  { id: 'travel', label: '旅行', emoji: '✈️', cat: '生活' },
  { id: 'music', label: '音乐', emoji: '🎵', cat: '生活' },
  { id: 'newyear', label: '春节', emoji: '🧧', cat: '文化' },
  { id: 'wukong', label: '西游记', emoji: '🐵', cat: '文化' },
  { id: 'kungfu', label: '功夫', emoji: '🥋', cat: '文化' },
  { id: 'anime', label: '动漫', emoji: '📺', cat: '文化' },
]

export default function InterestsPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(s => s !== id))
    } else if (selected.length < 3) {
      setSelected(prev => [...prev, id])
    }
  }

  const handleNext = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ccda_interests', JSON.stringify(selected))
      localStorage.setItem('ccda_custom_interest', custom)
    }
    router.push('/daily')
  }

  const categories = [...new Set(TAGS.map(t => t.cat))] as string[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">你喜欢什么？</h1>
          <p className="text-gray-500">选3个你最喜欢的，AI给你编故事</p>
          <p className="text-sm text-gray-400 mt-1">已选 {selected.length}/3</p>
        </div>

        {categories.map(cat => (
          <div key={cat} className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2 px-1">{cat}</h3>
            <div className="grid grid-cols-4 gap-2">
              {TAGS.filter(t => t.cat === cat).map(tag => {
                const isSelected = selected.includes(tag.id)
                const isFull = selected.length >= 3 && !isSelected
                return (
                  <button key={tag.id} onClick={() => toggle(tag.id)}
                    disabled={isFull}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      isSelected ? 'border-[#FF6B6C] bg-[#FF6B6C]/10' : isFull ? 'border-gray-100 opacity-40 cursor-not-allowed' : 'border-gray-100 hover:border-[#4ECDC4] bg-white'
                    }`}
                  >
                    <span className="text-2xl mb-1">{tag.emoji}</span>
                    <span className="text-xs font-medium text-gray-700">{tag.label}</span>
                    {isSelected && <span className="text-[#FF6B6C] text-xs mt-1">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl p-4 mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">还喜欢别的？告诉妈妈帮你写下来</label>
          <input
            type="text" value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="例如：Taylor Swift, Ender Dragon..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#4ECDC4] outline-none text-sm"
          />
        </div>

        <button onClick={handleNext} disabled={selected.length === 0}
          className="w-full py-3 rounded-xl font-semibold text-white bg-[#FF6B6C] hover:bg-[#ff5252] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >准备好了！开始阅读 →</button>
      </div>
    </div>
  )
}
