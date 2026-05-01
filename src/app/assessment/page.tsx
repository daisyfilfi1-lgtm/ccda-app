'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const QUESTIONS = [
  { q: '🍎 这是什么？', options: ['水', '火', '苹果', '山'], answer: 2, chars: ['苹', '果'] },
  { q: '☀️ 天上有什么？', options: ['鱼', '太阳', '书', '猫'], answer: 1, chars: ['太', '阳'] },
  { q: '💧 这是什么？', options: ['水', '火', '土', '木'], answer: 0, chars: ['水'] },
  { q: '🐱 这是什么动物？', options: ['狗', '鸟', '猫', '鱼'], answer: 2, chars: ['猫'] },
  { q: '📖 这是什么？', options: ['书', '笔', '纸', '桌'], answer: 0, chars: ['书'] },
  { q: '✈️ 这是什么？', options: ['船', '车', '飞机', '火箭'], answer: 2, chars: ['飞', '机'] },
  { q: '🏠 这是什么？', options: ['学校', '医院', '公园', '家'], answer: 3, chars: ['家'] },
  { q: '🐕 这是什么？', options: ['猫', '狗', '兔', '鸟'], answer: 1, chars: ['狗'] },
  { q: '🌍 这是什么？', options: ['世界', '国家', '地球', '宇宙'], answer: 2, chars: ['地', '球'] },
  { q: '🎵 我喜欢听什么？', options: ['电视', '音乐', '电影', '故事'], answer: 1, chars: ['音', '乐'] },
]

export default function AssessmentPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [mastered, setMastered] = useState<string[]>([])
  const [weak, setWeak] = useState<string[]>([])
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false })
  const [done, setDone] = useState(false)

  const handleAnswer = (idx: number) => {
    const q = QUESTIONS[current]
    const correct = idx === q.answer
    if (correct) {
      setMastered(prev => [...prev, ...q.chars])
    } else {
      setWeak(prev => [...prev, ...q.chars])
    }
    setFeedback({ show: true, correct })
    setTimeout(() => {
      setFeedback({ show: false, correct: false })
      if (current < QUESTIONS.length - 1) setCurrent(prev => prev + 1)
      else setDone(true)
    }, 1200)
  }

  if (feedback.show) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="text-center">
          <div className="text-6xl mb-4">{feedback.correct ? '🎉' : '💪'}</div>
          <p className="text-xl font-medium text-gray-700">{feedback.correct ? '太棒了！' : '没关系，明天我们再见它！'}</p>
        </div>
      </div>
    )
  }

  if (done) {
    const masteredWords = mastered.join('、')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 p-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">你认识了 {mastered.length} 个汉字朋友！</h2>
          {masteredWords && <p className="text-gray-500 mb-6">已掌握：{masteredWords}</p>}
          <button
            onClick={() => router.push('/interests')}
            className="w-full py-3 rounded-xl font-semibold text-white bg-[#4ECDC4] hover:bg-[#3dbdb5] transition-all"
          >
            告诉我你喜欢什么 →
          </button>
        </div>
      </div>
    )
  }

  const q = QUESTIONS[current]
  const progress = (current / QUESTIONS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
            <div className="bg-[#4ECDC4] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-gray-400 mb-2">第 {current + 1}/{QUESTIONS.length} 题</p>
          <p className="text-3xl font-bold text-gray-800 mb-6">{q.q}</p>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(i)}
                className="p-4 rounded-xl border-2 border-gray-100 hover:border-[#4ECDC4] hover:bg-teal-50 transition-all text-lg font-medium"
              >{opt}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
