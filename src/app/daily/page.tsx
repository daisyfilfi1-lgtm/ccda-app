'use client'
import { useState, useCallback } from 'react'
import { speakArticle, speakChar } from '@/lib/tts'
import { segmentForDisplay, annotatePinyin, getDefaultPinyinMode } from '@/lib/pinyin'
import type { PinyinMode } from '@/lib/pinyin'

const SAMPLE_ARTICLE = {
  title: "Steve的第一次旅行",
  body: "Steve是一个勇敢的冒险家。有一天，他决定去旅行。他走了很远的路，来到了一个小村庄。村庄里有一家小餐馆，老板是一只可爱的猫。Steve走进餐馆，说：你好，我饿了。猫老板笑着说：欢迎！我们有最好的鱼。Steve吃了三条鱼，他觉得这是最好的旅行。吃完以后，Steve想：下次旅行，我要带上我的小狗。",
  hskLevel: 2 as const,
  weakChars: ["旅", "行", "餐", "馆"],
  wordCount: 145,
}

const SAMPLE_KNOWN_CHARS = new Set(["我","你","他","她","的","了","是","一","个","有","好","不","去","来","在","吃","喝","说","看","走","大","小","上","下","天","人","水","火","山","猫","狗","鱼","鸟","家","书","这","那","很","也","就","和","都","要","会","能","让","到","里","着","吧","吗","的","地","得","了","过","把","被","比","从","对","给","让","叫","想","知","道","觉","得","开","心","快","乐","朋","友","老","师","学","校","生","日","星","期","点","分","块","只","条","路","门","车","飞","机","太","阳","月","亮","星","云","风","雨","雪","花","草","树","林","河","海","空","气","光","声","音","色","香","味","手","脚","头","脸","眼","耳","鼻","口","牙","舌","发","身","体","爸","妈","爷","奶","哥","姐","弟","妹","男","女","孩","子","东","西","南","北","前","后","左","右","里","外","今","昨","明","早","晚","午","夜","春","夏","秋","冬","年","月","日","时","间","新","旧","多","少","长","短","高","矮","胖","瘦","远","近","快","慢","轻","重","冷","热","温","暖","凉","干","湿","硬","软","亮","暗","深","浅","宽","窄","粗","细","方","圆","直","弯","正","反","真","假","对","错","开","关","出","入","回","来","去","上","下","进","退","站","坐","躺","爬","跑","跳","走","停","飞","游","买","卖","送","拿","放","拉","推","抱","举","扔","接","打","敲","切","撕","折","穿","脱","戴","洗","擦","扫","倒","煮","烧","烤","蒸","炒","切","削","剥","种","养","喂","挤","压","按","摸","拍","弹","吹","吸","呼","喊","叫","哭","笑","唱","跳","听","看","闻","尝","触","感","觉","思","考","记","忆","忘","想","念","喜","欢","爱","恨","怕","惊","怒","乐","悲","忧","愁","烦","闷","累","困","饿","渴","饱","醉","醒","睡","梦","愿","意","能","会","可","以","应","该","需","要","必","须","可","能","也","许","大","概","似","乎","当","然","肯","定","绝","对","真","的","假","的","非","常","很","十","分","太","更","最","比","较","稍","微","差","不","多","几","乎","简","直","完","全","总","是","永","远","一","直","经","常","有","时","偶","尔","从","来","没","有","正","在","已","经","将","要","马","上","立","刻","赶","紧","慢","慢","渐","渐","突","然","原","来","本","来","其","实","当","时","以","前","以","后","现","在","刚","才","刚","刚","马","上","立","刻","立","即","赶","紧","连","忙","随","后","接","着","然","后","最","后","终","于","结","果","所","以","因","为","但","是","可","是","不","过","虽","然","而","且","如","果","那","么","除","非","要","不","然","否","则","因","此","于","是","并","且","或","者","还","是","还","有","以","及","等","等"],
)

export default function DailyPage() {
  const [activeTab, setActiveTab] = useState<'read' | 'achievements' | 'report'>('read')
  const [readingComplete, setReadingComplete] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [pinyinMode, setPinyinMode] = useState<PinyinMode>('always')
  const [selectedChar, setSelectedChar] = useState<{ char: string; pinyin: string } | null>(null)
  const [scrollDepth, setScrollDepth] = useState(0)

  const article = SAMPLE_ARTICLE
  const annotations = annotatePinyin(article.body, SAMPLE_KNOWN_CHARS, pinyinMode, article.hskLevel)
  const segments = segmentForDisplay(article.body, annotations)
  const totalSegments = segments.filter(s => s.isHanzi).length
  const readSegments = Math.floor(scrollDepth * totalSegments)

  const handleReadComplete = () => {
    setReadingComplete(true)
    setShowQuiz(true)
  }

  const handleSpeak = useCallback(() => {
    speakArticle(article.body)
  }, [article.body])

  const handleCharClick = useCallback((char: string) => {
    speakChar(char)
    const ann = annotations.find(a => a.char === char)
    setSelectedChar({ char, pinyin: ann?.pinyin || char })
    setTimeout(() => setSelectedChar(null), 3000)
  }, [annotations])

  const tabClass = (tab: typeof activeTab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition-all ${
      activeTab === tab ? 'bg-[#FF6B6C] text-white' : 'text-gray-500 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-teal-50 flex flex-col">
      {/* Nav */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <span className="font-bold text-gray-800">汉字伙伴</span>
        </div>
        <div className="text-sm bg-[#4ECDC4]/10 text-[#4ECDC4] px-3 py-1 rounded-full font-medium">
          Day 1 🔥
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-white/50">
        <button onClick={() => setActiveTab('read')} className={tabClass('read')}>📖 今日阅读</button>
        <button onClick={() => setActiveTab('achievements')} className={tabClass('achievements')}>🏆 成就</button>
        <button onClick={() => setActiveTab('report')} className={tabClass('report')}>📊 报告</button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-24 overflow-y-auto">
        {activeTab === 'read' && (
          <div className="max-w-2xl mx-auto">
            {readingComplete && !showQuiz ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">今日阅读完成！</h2>
                <p className="text-gray-500">明天还有新故事等着你</p>
              </div>
            ) : (
              <>
                {/* Article Header */}
                <div className="flex items-center justify-between mb-4 mt-4">
                  <h1 className="text-xl font-bold text-gray-800">{article.title}</h1>
                  <div className="flex items-center gap-2">
                    <button onClick={handleSpeak}
                      className="p-2 rounded-full hover:bg-gray-100 transition-all text-lg"
                      title="朗读全文"
                    >🔊</button>
                    <select value={pinyinMode} onChange={e => setPinyinMode(e.target.value as PinyinMode)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                    >
                      <option value="always">显示拼音</option>
                      <option value="partial">部分拼音</option>
                      <option value="hidden">隐藏拼音</option>
                    </select>
                  </div>
                </div>

                {/* Article Body */}
                <div className="bg-white rounded-3xl shadow-sm p-6 mb-4 leading-relaxed text-lg text-gray-700"
                  onScroll={e => {
                    const el = e.currentTarget
                    setScrollDepth(el.scrollTop / (el.scrollHeight - el.clientHeight))
                  }}
                >
                  {segments.map((seg, i) => {
                    if (!seg.isHanzi) return <span key={i}>{seg.text}</span>
                    return (
                      <ruby key={i} onClick={() => handleCharClick(seg.text)}
                        className="cursor-pointer hover:text-[#FF6B6C] transition-colors"
                      >
                        {seg.text}
                        {seg.pinyin && <rt className="text-xs text-gray-400">{seg.pinyin}</rt>}
                      </ruby>
                    )
                  })}
                </div>

                {/* Reading Progress */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-[#4ECDC4] h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(100, scrollDepth * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{Math.round(scrollDepth * 100)}%</span>
                </div>

                {/* Word Popup */}
                {selectedChar && (
                  <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 border border-gray-100 text-center animate-fadeIn">
                    <p className="text-3xl font-bold text-gray-800 mb-1">{selectedChar.char}</p>
                    <p className="text-[#4ECDC4] font-medium">{selectedChar.pinyin}</p>
                    <button onClick={() => speakChar(selectedChar.char)}
                      className="mt-2 px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
                    >🔊 听发音</button>
                  </div>
                )}

                {/* Complete Button */}
                <button onClick={handleReadComplete}
                  className="w-full py-4 rounded-2xl font-semibold text-lg text-white bg-[#FF6B6C] hover:bg-[#ff5252] shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  我读完啦 👆
                </button>
              </>
            )}

            {/* Quiz Modal */}
            {showQuiz && <QuizModal onComplete={() => { setShowQuiz(false); setReadingComplete(true) }} />}
          </div>
        )}

        {activeTab === 'achievements' && <AchievementsTab />}
        {activeTab === 'report' && <ReportTab />}
      </div>
    </div>
  )
}

function QuizModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean }>({ show: false, correct: false })
  const [done, setDone] = useState(false)

  const questions = [
    {
      q: '"餐馆"是什么意思？',
      options: ['医院 🏥', '吃饭的地方 🍽️', '学校 🏫', '公园 🌳'],
      answer: 1,
    },
    {
      q: '把下面的词排成正确的句子：',
      type: 'ordering' as const,
      words: ['去', 'Steve', '旅行', '决定'],
      answer: ['Steve', '决定', '去', '旅行'],
    },
    {
      q: 'Steve说："下次旅行，我要带上____。"',
      options: ['我的小狗 🐕', '一只猫 🐱', '一条鱼 🐟'],
      answer: 0,
    },
  ]

  const handleAnswer = (idx: number) => {
    const q = questions[step]
    const correct = q.type === 'ordering'
      ? false // ordering handled separately
      : idx === q.answer
    if (correct) setScore(prev => prev + 5)
    else setScore(prev => prev + 1)
    setFeedback({ show: true, correct })
    setTimeout(() => {
      setFeedback({ show: false, correct: false })
      if (step < questions.length - 1) setStep(prev => prev + 1)
      else setDone(true)
    }, 1200)
  }

  if (feedback.show) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 text-center">
          <div className="text-5xl mb-3">{feedback.correct ? '🎉' : '💪'}</div>
          <p className="text-lg font-medium">{feedback.correct ? '太棒了！+5分' : '没关系，明天还会见到它！+1分'}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">阅读完成！</h2>
          <p className="text-gray-500 mb-4">获得 {score} 分</p>
          <div className="text-4xl mb-4">🔥</div>
          <p className="text-sm text-gray-400 mb-6">连续阅读 1 天</p>
          <button onClick={onComplete}
            className="w-full py-3 rounded-xl font-semibold text-white bg-[#4ECDC4] hover:bg-[#3dbdb5] transition-all"
          >继续</button>
        </div>
      </div>
    )
  }

  const q = questions[step]

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
        <p className="text-sm text-gray-400 mb-2">课后小练习 {step + 1}/{questions.length}</p>
        <p className="text-lg font-bold text-gray-800 mb-4">{q.q}</p>

        {q.type === 'ordering' ? (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {q.words.map((w, i) => (
              <button key={i} onClick={() => handleAnswer(i)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-[#4ECDC4] text-lg font-medium transition-all"
              >{w}</button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {q.options?.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(i)}
                className="w-full p-3 rounded-xl border-2 border-gray-100 hover:border-[#4ECDC4] hover:bg-teal-50 text-left transition-all"
              >{opt}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AchievementsTab() {
  const badges = [
    { id: 'fire', name: '小火苗', icon: '🔥', days: 3, desc: '连续阅读3天' },
    { id: 'book', name: '小书虫', icon: '📚', days: 7, desc: '连续阅读7天' },
    { id: 'explorer', name: '中文探险家', icon: '🚀', days: 14, desc: '连续阅读14天' },
    { id: 'master', name: '汉字大师', icon: '🏆', days: 30, desc: '连续阅读30天' },
  ]

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <div className="text-center mb-6">
        <p className="text-3xl font-bold text-gray-800">10 分</p>
        <p className="text-sm text-gray-400">总积分</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {badges.map(b => (
          <div key={b.id}
            className={`bg-white rounded-2xl p-6 text-center ${1 >= b.days ? 'shadow-md' : 'opacity-40'}`}
          >
            <div className={`text-5xl mb-3 ${1 >= b.days ? '' : 'grayscale'}`}>{b.icon}</div>
            <p className="font-bold text-gray-800">{b.name}</p>
            <p className="text-xs text-gray-400">{b.desc}</p>
            {1 < b.days && <p className="text-xs text-gray-300 mt-1">🔒 还需 {b.days - 1} 天</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportTab() {
  const weakChars = [
    { char: '旅', mastery: 45 },
    { char: '馆', mastery: 52 },
    { char: '行', mastery: 58 },
    { char: '餐', mastery: 61 },
    { char: '远', mastery: 63 },
  ]

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <div className="bg-white rounded-3xl p-6 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">📈 HSK 进度</h3>
        <div className="text-center mb-3">
          <span className="text-2xl font-bold text-[#FF6B6C]">HSK 2</span>
          <span className="text-gray-400 text-sm ml-2">→ 目标：HSK 3</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-gradient-to-r from-[#FF6B6C] to-[#4ECDC4] h-3 rounded-full" style={{ width: '37%' }} />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">已掌握 87/300 字</p>
      </div>

      <div className="bg-white rounded-3xl p-6 mb-4">
        <h3 className="font-bold text-gray-800 mb-3">🔍 本周薄弱字 TOP5</h3>
        <div className="space-y-3">
          {weakChars.map(w => (
            <div key={w.char}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">"{w.char}"</span>
                <span className="text-gray-400">{w.mastery}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-[#FF6B6C] h-2 rounded-full" style={{ width: `${w.mastery}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6">
        <h3 className="font-bold text-gray-800 mb-3">📊 本周趋势</h3>
        <div className="flex items-end justify-between gap-2 h-24">
          {[
            { day: '一', value: 35 }, { day: '二', value: 50 },
            { day: '三', value: 42 }, { day: '四', value: 68 },
            { day: '五', value: 55 }, { day: '六', value: 70 },
            { day: '日', value: 0 },
          ].map(d => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#4ECDC4]/20 rounded-t-sm" style={{ height: `${d.value}%` }}>
                <div className="w-full bg-[#4ECDC4] rounded-t-sm transition-all" style={{ height: `${d.value}%` }} />
              </div>
              <span className="text-xs text-gray-400">{d.day}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">每日阅读完成率</p>
      </div>
    </div>
  )
}
