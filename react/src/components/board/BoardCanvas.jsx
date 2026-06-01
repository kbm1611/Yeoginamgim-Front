import { motion } from 'framer-motion'
import { useMemo } from 'react'
import Polaroid from './Polaroid'
import PostIt from './PostIt'

function BoardCanvas({
  postIts,
  polaroids,
  onSelectItem,
  selectedItemId,
  justCreatedId,
  placementDraft,
  onDraftPositionChange,
}) {
  const mixedItems = useMemo(() => {
    const all = [...postIts, ...polaroids]
    return all.map((item, idx) => ({ ...item, layoutOrder: idx }))
  }, [postIts, polaroids])

  return (
    <div
      className="relative h-full w-full overflow-y-auto px-4 pb-28 pt-2"
      style={{
        backgroundColor: '#EFE5D6',
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(137,113,86,0.11) 1px, transparent 0), linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
        backgroundSize: '16px 16px, auto',
      }}
    >
      <div className="grid grid-cols-3 gap-x-3 gap-y-4">
        {mixedItems.map((item, index) => {
          const mtClass = index % 3 === 0 ? 'mt-3' : index % 3 === 1 ? 'mt-0' : 'mt-5'

          return (
            <div key={item.id} className={mtClass}>
              {item.type === 'polaroid' ? (
                <Polaroid item={item} onClick={onSelectItem} selected={selectedItemId === item.id} />
              ) : (
                <PostIt item={item} onClick={onSelectItem} selected={selectedItemId === item.id} justCreated={justCreatedId === item.id} />
              )}
            </div>
          )
        })}
      </div>

      {placementDraft ? (
        <motion.div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto w-[180px] rounded-2xl bg-white/90 px-4 py-2 text-center text-[12px] text-[#5c4638] shadow">
          아래 카드 위치를 확인한 뒤 [남기기]를 눌러주세요
        </motion.div>
      ) : null}
    </div>
  )
}

export default BoardCanvas
