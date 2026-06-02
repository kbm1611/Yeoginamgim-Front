import { Plus, ScanSearch } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BoardCanvas from '../components/board/BoardCanvas'
import boardBackground from '../assets/image.png'

const posts = [
  { id: 1, type: 'polaroid', row: 0, col: 0, text: '오늘 분위기 굿! ❤️', date: '2024.06.10', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80' },
  { id: 2, type: 'postit', row: 0, col: 1, text: '커피 최고!\n역시 메가커피\n가성비도 맛도 최고', date: '2024.06.10', color: '#F6E07F' },
  { id: 3, type: 'polaroid', row: 1, col: 1, text: '친구랑 찰칵', date: '2024.06.10', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { id: 4, type: 'postit', row: 1, col: 0, text: '친구들이랑\n수다타임\n즐거워~', date: '2024.06.09', color: '#CDECE5' },
  { id: 5, type: 'polaroid', row: 2, col: 0, text: '오늘도 행복한 하루', date: '2024.06.09', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80' },
  { id: 6, type: 'postit', row: 2, col: 1, text: '또 오고 싶은\n우리의 아지트!', date: '2024.06.08', color: '#CFC2F3' },
  { id: 7, type: 'polaroid', row: 3, col: 1, text: '라떼 한 잔', date: '2024.06.08', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80' },
]

function BoardDetail() {
  const navigate = useNavigate()

  return (
    <main className="app-device h-full w-full overflow-hidden bg-[#E9E5DF] p-2">
      <motion.section
        className="relative mx-auto h-full w-full max-w-[430px] overflow-hidden rounded-[34px] border border-[#E2DBD1]"
        initial={{ opacity: 0.92, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <BoardCanvas posts={posts} backgroundImage={boardBackground} />

        <button
          type="button"
          className="absolute bottom-7 left-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#2D2218] shadow-[0_8px_16px_rgba(57,39,25,0.2)]"
        >
          <ScanSearch size={24} />
        </button>

        <button
          type="button"
          onClick={() => navigate('/board/mildo/postit')}
          className="absolute bottom-7 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#2D2218] shadow-[0_8px_16px_rgba(57,39,25,0.2)]"
        >
          <Plus size={30} />
        </button>
      </motion.section>
    </main>
  )
}

export default BoardDetail
