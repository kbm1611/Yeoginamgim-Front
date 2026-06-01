import { motion } from 'framer-motion'
import HomeHeader from '../components/home/HomeHeader'
import RegionAndChips from '../components/home/RegionAndChips'
import PopularTopSection from '../components/home/PopularTopSection'
import RecentTraceSection from '../components/home/RecentTraceSection'
import EmptyCtaSection from '../components/home/EmptyCtaSection'
import BottomNavigation from '../components/navigation/BottomNavigation'
import top1 from '../assets/images/home/top/top-1.jpg'
import top2 from '../assets/images/home/top/top-2.jpg'
import top3 from '../assets/images/home/top/top-3.jpg'
import top4 from '../assets/images/home/top/top-4.jpg'
import top5 from '../assets/images/home/top/top-5.jpg'
import recent1 from '../assets/images/home/recent/recent-1.jpg'
import recent2 from '../assets/images/home/recent/recent-2.jpg'
import recent3 from '../assets/images/home/recent/recent-3.jpg'
import recent4 from '../assets/images/home/recent/recent-4.jpg'
import avatar1 from '../assets/images/home/avatars/avatar-1.jpg'
import avatar2 from '../assets/images/home/avatars/avatar-2.jpg'
import avatar3 from '../assets/images/home/avatars/avatar-3.jpg'
import avatar4 from '../assets/images/home/avatars/avatar-4.jpg'
import '../css/home-page.css'
import '../css/home-cards.css'
import '../css/bottom-navigation.css'

const topPlaces = [
  {
    rank: 1,
    name: '카페 연남방앗간',
    category: '카페',
    message: '혼자 있고 싶을 때 자주 와요.',
    traces: 128,
    image: top1,
  },
  {
    rank: 2,
    name: '성수연방',
    category: '카페',
    message: '비 오는 날 생각나는 공간이에요.',
    traces: 96,
    image: top2,
  },
  {
    rank: 3,
    name: '밀도 성수',
    category: '베이커리',
    message: '빵 냄새가 따뜻해서 자주 오게 돼요.',
    traces: 68,
    image: top3,
  },
  {
    rank: 4,
    name: '대림창고',
    category: '편집샵',
    message: '구경하다 보면 시간 가는 줄 몰라요.',
    traces: 64,
    image: top4,
  },
  {
    rank: 5,
    name: '서울숲 피크닉장',
    category: '공원',
    message: '따뜻한 햇살 아래에서 책 읽기 좋은 날.',
    traces: 52,
    image: top5,
  },
]

const recentTraces = [
  {
    id: 1,
    place: '어니언 성수',
    category: '카페',
    message: '커피와 디저트 모두 완벽한 조합',
    time: '10분 전',
    image: recent1,
    avatar: avatar1,
  },
  {
    id: 2,
    place: '성수연방',
    category: '카페',
    message: '창가 자리에 앉으면 마음이 차분해져요.',
    time: '1시간 전',
    image: recent2,
    avatar: avatar2,
  },
  {
    id: 3,
    place: '뚝섬한강공원',
    category: '공원',
    message: '해질 때 노을이 정말 예뻐요',
    time: '2시간 전',
    image: recent3,
    avatar: avatar3,
  },
  {
    id: 4,
    place: '언더스탠드에비뉴',
    category: '편집샵',
    message: '볼거리도 많고 감성 사진 남기기 좋아요.',
    time: '3시간 전',
    image: recent4,
    avatar: avatar4,
  },
]

function HomePage() {
  return (
    <motion.main
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="home-scroll">
        <HomeHeader />
        <RegionAndChips />
        <PopularTopSection places={topPlaces} />
        <RecentTraceSection traces={recentTraces} />
        <EmptyCtaSection />
      </div>
      <BottomNavigation />
    </motion.main>
  )
}

export default HomePage
