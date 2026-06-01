import { ArrowLeft, Bell, Filter, Search, ZoomIn, ZoomOut } from 'lucide-react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FloatingAddButton from '../components/board/FloatingAddButton'
import PostItCard from '../components/board/PostItCard'

const posts = [
  { id: 1, text: '오늘 분위기 굿! ❤️\n창가자리에서 보는\n바깥 풍경이 너무 좋아요!', author: 'sunny_day', date: '2024.06.10', color: 'yellow', tape: 'basic', x: 110, y: 170, angle: -2.2, likes: 12 },
  { id: 2, text: '커피 최고!\n역시 메가커피는\n가성비도 맛도 최고야 :)', author: 'coffee_lover', date: '2024.06.10', color: 'grid', tape: 'basic', x: 470, y: 205, angle: -0.7, likes: 8 },
  { id: 3, text: '책 읽기 좋은 곳 📖\n조용하고 편안해서\n시간 가는 줄 몰랐어요.', author: 'book_worm', date: '2024.06.10', color: 'green', tape: 'basic', x: 880, y: 185, angle: -1.8, likes: 15 },
  { id: 4, text: '인테리어 너무 예뻐요!\n분위기가 정말 취향저격\n♡', author: 'daily_log', date: '2024.06.09', color: 'pink', tape: 'basic', x: 190, y: 530, angle: -2.8, likes: 9 },
  { id: 5, text: '성수 올 때마다\n여기는 꼭 들러요!\n직원분들도 친절해요 ☺️', author: 'happy_', date: '2024.06.09', color: 'green', tape: 'basic', x: 610, y: 585, angle: 1.3, likes: 10 },
  { id: 6, text: '따뜻한 라떼 한 잔과\n함께하는 여유로운 시간\n오늘도 힐링하고 갑니다.', author: 'latte_please', date: '2024.06.08', color: 'grid', tape: 'basic', x: 980, y: 615, angle: 2.1, likes: 11 },
  { id: 7, text: '친구랑 수다 떨기 좋아요\n디저트도 맛있어요 ☕', author: 'choco_milk', date: '2024.06.08', color: 'yellow', tape: 'basic', x: 360, y: 870, angle: -1.1, likes: 7 },
  { id: 8, text: '라떼가 진짜 부드럽고\n자리도 편해서 오래 있고 싶어요', author: 'memo_day', date: '2024.06.07', color: 'pink', tape: 'basic', x: 780, y: 895, angle: 1.6, likes: 13 },
]

function BoardDetail() {
  const navigate = useNavigate()
  const boardPosts = useMemo(() => posts, [])

  return (
    <main className="app-device relative h-full w-full overflow-hidden bg-[#F4EEE4]">
      <TransformWrapper minScale={0.8} maxScale={2.4} initialScale={1} centerOnInit limitToBounds={false}>
        {({ zoomIn, zoomOut }) => (
          <>
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
              <div
                className="relative h-[1900px] w-[1500px]"
                style={{
                  backgroundColor: '#F8F2E8',
                  backgroundImage:
                    'radial-gradient(circle at 20% 15%, rgba(255,255,255,0.35), transparent 34%), radial-gradient(circle at 80% 78%, rgba(194,157,114,0.18), transparent 38%), linear-gradient(rgba(198,178,150,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(198,178,150,0.11) 1px, transparent 1px)',
                  backgroundSize: 'auto, auto, 36px 36px, 36px 36px',
                }}
              >
                {boardPosts.map((post) => (
                  <PostItCard key={post.id} post={post} />
                ))}
              </div>
            </TransformComponent>

            <header className="pointer-events-auto absolute inset-x-0 top-0 z-30 border-b border-[#EFE4D5] bg-white/92 px-6 pb-4 pt-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#2F2118]">
                    <ArrowLeft size={24} />
                  </button>
                  <h1 className="text-[44px] font-bold tracking-[-0.03em] text-[#2B1810]">메가커피 성수점</h1>
                </div>

                <div className="flex items-center gap-3 text-[#2B1810]">
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full"><Search size={23} /></button>
                  <button type="button" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full">
                    <Bell size={23} />
                    <span className="absolute right-0 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EE4D3A] px-1 text-[11px] font-semibold text-white">3</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-full border border-[#E6D9C8] bg-[#FFF7EA] px-6 py-2.5 text-[15px] font-medium text-[#5B412F]">전체 보기</button>
                <button className="rounded-full border border-[#E6D9C8] bg-white px-6 py-2.5 text-[15px] font-medium text-[#5B412F]">최신순</button>
                <button className="rounded-full border border-[#E6D9C8] bg-white px-6 py-2.5 text-[15px] font-medium text-[#5B412F]">랜덤 배치</button>
                <button className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9C8] bg-white px-6 py-2.5 text-[15px] font-medium text-[#5B412F]"><Filter size={15} />필터</button>
              </div>
            </header>

            <div className="pointer-events-auto absolute bottom-24 left-6 z-30 rounded-[20px] border border-[#EADFCF] bg-white px-3 py-2 shadow-[0_8px_18px_rgba(53,34,20,0.12)]">
              <button type="button" onClick={() => zoomIn()} className="flex h-9 w-9 items-center justify-center text-[#4D3728]"><ZoomIn size={18} /></button>
              <button type="button" onClick={() => zoomOut()} className="mt-1 flex h-9 w-9 items-center justify-center text-[#4D3728]"><ZoomOut size={18} /></button>
            </div>

            <FloatingAddButton
              isMenuOpen={false}
              onToggle={() => navigate('/board/mildo/postit')}
              onCreatePostIt={() => navigate('/board/mildo/postit')}
              onCreatePolaroid={() => navigate('/board/mildo/postit', { state: { initialTab: 'polaroid' } })}
              className="pointer-events-auto absolute bottom-8 right-8 z-30"
            />
          </>
        )}
      </TransformWrapper>
    </main>
  )
}

export default BoardDetail
