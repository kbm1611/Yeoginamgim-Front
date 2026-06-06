function MapOverlay({ children }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F1ECE4]/92 px-8 text-center text-[#3D2415]">
      {children}
    </div>
  )
}

export default MapOverlay
