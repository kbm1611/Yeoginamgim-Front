const KAKAO_SCRIPT_ID = 'kakao-map-sdk'
const KAKAO_SDK_LOAD_TIMEOUT_MS = 12000

let kakaoScriptPromise = null

export function ensureKakaoMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Kakao Maps SDK requires a browser environment.'))
  }

  if (isLoadedKakaoMaps(window.kakao)) {
    return Promise.resolve(window.kakao)
  }

  if (window.kakao?.maps?.load) {
    return loadKakaoMapsWithTimeout()
  }

  const kakaoJavaScriptKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
  if (!kakaoJavaScriptKey) {
    return Promise.reject(new Error('VITE_KAKAO_JAVASCRIPT_KEY is not configured.'))
  }

  if (!kakaoScriptPromise) {
    kakaoScriptPromise = new Promise((resolve, reject) => {
      let timeoutId = null

      const stopWaiting = () => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId)
          timeoutId = null
        }
      }

      const finishLoading = () => {
        loadKakaoMapsWithTimeout()
          .then((kakao) => {
            stopWaiting()
            resolve(kakao)
          })
          .catch((error) => {
            stopWaiting()
            kakaoScriptPromise = null
            reject(error)
          })
      }

      const failLoading = () => {
        stopWaiting()
        kakaoScriptPromise = null
        reject(new Error('Kakao Maps SDK failed to load.'))
      }

      timeoutId = window.setTimeout(() => {
        kakaoScriptPromise = null
        reject(new Error('Kakao Maps SDK load timed out.'))
      }, KAKAO_SDK_LOAD_TIMEOUT_MS)

      const existingScript = document.getElementById(KAKAO_SCRIPT_ID)
      if (existingScript) {
        if (isLoadedKakaoMaps(window.kakao)) {
          stopWaiting()
          resolve(window.kakao)
          return
        }

        if (window.kakao?.maps?.load) {
          finishLoading()
          return
        }

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

export function isLoadedKakaoMaps(kakao) {
  return Boolean(kakao?.maps?.Map && kakao?.maps?.LatLng && kakao?.maps?.Marker)
}

function loadKakaoMapsWithTimeout() {
  return new Promise((resolve, reject) => {
    if (isLoadedKakaoMaps(window.kakao)) {
      resolve(window.kakao)
      return
    }

    if (!window.kakao?.maps?.load) {
      reject(new Error('Kakao Maps SDK did not initialize.'))
      return
    }

    const timeoutId = window.setTimeout(() => {
      reject(new Error('Kakao Maps SDK load timed out.'))
    }, KAKAO_SDK_LOAD_TIMEOUT_MS)

    window.kakao.maps.load(() => {
      window.clearTimeout(timeoutId)
      if (isLoadedKakaoMaps(window.kakao)) {
        resolve(window.kakao)
        return
      }

      reject(new Error('Kakao Maps SDK did not initialize.'))
    })
  })
}
