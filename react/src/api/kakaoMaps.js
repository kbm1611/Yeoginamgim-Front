const KAKAO_SCRIPT_ID = 'kakao-map-sdk'

let kakaoScriptPromise = null

export function ensureKakaoMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kakao Maps SDK requires a browser environment.'))
  }

  if (window.kakao?.maps?.load) {
    return loadKakaoMaps()
  }

  const kakaoJavaScriptKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
  if (!kakaoJavaScriptKey) {
    return Promise.reject(new Error('VITE_KAKAO_JAVASCRIPT_KEY is not configured.'))
  }

  if (!kakaoScriptPromise) {
    kakaoScriptPromise = new Promise((resolve, reject) => {
      const finishLoading = () => {
        loadKakaoMaps().then(resolve).catch(reject)
      }

      const failLoading = () => {
        kakaoScriptPromise = null
        reject(new Error('Kakao Maps SDK failed to load.'))
      }

      const existingScript = document.getElementById(KAKAO_SCRIPT_ID)
      if (existingScript) {
        existingScript.addEventListener('load', finishLoading, { once: true })
        existingScript.addEventListener('error', failLoading, { once: true })
        return
      }

      const script = document.createElement('script')
      script.id = KAKAO_SCRIPT_ID
      script.async = true
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(kakaoJavaScriptKey)}&libraries=services&autoload=false`
      script.addEventListener('load', finishLoading, { once: true })
      script.addEventListener('error', failLoading, { once: true })
      document.head.appendChild(script)
    })
  }

  return kakaoScriptPromise
}

function loadKakaoMaps() {
  return new Promise((resolve, reject) => {
    if (!window.kakao?.maps?.load) {
      reject(new Error('Kakao Maps SDK did not initialize.'))
      return
    }

    window.kakao.maps.load(() => resolve(window.kakao))
  })
}
