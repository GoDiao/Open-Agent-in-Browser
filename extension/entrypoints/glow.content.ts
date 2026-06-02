let overlay: HTMLDivElement | null = null
let stopBtn: HTMLDivElement | null = null
let activeConversationId: string | null = null
let stylesInjected = false

function injectStyles() {
  if (stylesInjected) return
  const style = document.createElement('style')
  style.id = 'iris-glow-styles'
  style.textContent = `
    @keyframes iris-glow-pulse {
      0%, 100% {
        box-shadow: inset 0 0 60px 10px rgba(0.2, 0.8, 0.8, 0.04),
                    inset 0 0 120px 20px rgba(0.2, 0.8, 0.8, 0.02);
      }
      50% {
        box-shadow: inset 0 0 80px 20px rgba(0.2, 0.8, 0.8, 0.10),
                    inset 0 0 160px 40px rgba(0.2, 0.8, 0.8, 0.05);
      }
    }
    @keyframes iris-glow-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `
  document.head.appendChild(style)
  stylesInjected = true
}

function startGlow() {
  stopGlow()
  injectStyles()

  overlay = document.createElement('div')
  overlay.id = 'iris-glow-overlay'
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '2147483647',
    pointerEvents: 'none',
    animation: 'iris-glow-fade-in 420ms ease-out forwards, iris-glow-pulse 3s ease-in-out infinite',
  })
  document.body.appendChild(overlay)

  // Stop button
  stopBtn = document.createElement('div')
  stopBtn.id = 'iris-glow-stop'
  Object.assign(stopBtn.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgb(180, 40, 40)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    pointerEvents: 'auto',
    zIndex: '2147483647',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    transition: 'opacity 0.2s',
  })
  stopBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`
  stopBtn.addEventListener('mouseenter', () => { stopBtn!.style.opacity = '0.8' })
  stopBtn.addEventListener('mouseleave', () => { stopBtn!.style.opacity = '1' })
  stopBtn.addEventListener('click', () => {
    if (activeConversationId) {
      try {
        chrome.runtime.sendMessage({ type: 'stop-agent', conversationId: activeConversationId })
      } catch {
        // Extension context invalidated
      }
    }
    stopGlow()
  })
  document.body.appendChild(stopBtn)
}

function stopGlow() {
  overlay?.remove()
  overlay = null
  stopBtn?.remove()
  stopBtn = null
  activeConversationId = null
}

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    try {
      chrome.runtime.onMessage.addListener((message: { conversationId?: string; isActive?: boolean; showConfetti?: boolean }) => {
        if (message.conversationId && typeof message.isActive === 'boolean') {
          if (message.isActive) {
            activeConversationId = message.conversationId
            startGlow()
          } else if (message.conversationId === activeConversationId) {
            stopGlow()
          }
        }
      })
    } catch {
      // Extension context invalidated
    }

    window.addEventListener('beforeunload', stopGlow)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopGlow()
    })
  },
})
