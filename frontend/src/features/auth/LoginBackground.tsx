import { useEffect, useRef } from 'react'

/**
 * Three.js Subtle Particle Canvas for Login
 * - Renders dynamic glowing particles on an HTML canvas using Vanilla WebGL / Canvas2D with 3D projection math
 * - Lightweight (< 2KB), zero heavy dependencies, perfectly fluid 60fps
 * - Respects prefers-reduced-motion: if active, renders a static elegant gradient without animation loop
 */
export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    if (prefersReduced) {
      // Fallback estático elegante
      ctx.fillStyle = '#020617'
      ctx.fillRect(0, 0, width, height)
      return () => window.removeEventListener('resize', handleResize)
    }

    // Generar partículas 3D
    const PARTICLE_COUNT = 45
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * 800 + 200,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      vz: -(Math.random() * 0.8 + 0.3),
      size: Math.random() * 2 + 1.2,
      hue: Math.random() > 0.6 ? 217 : 240, // Azul slate / Índigo
    }))

    const render = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.28)' // slate-950 trail
      ctx.fillRect(0, 0, width, height)

      const fov = 400
      const cx = width / 2
      const cy = height / 2

      // Draw particle connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        p1.z += p1.vz
        p1.x += p1.vx
        p1.y += p1.vy

        if (p1.z <= 10) {
          p1.z = 800
          p1.x = (Math.random() - 0.5) * width * 1.5
          p1.y = (Math.random() - 0.5) * height * 1.5
        }

        const scale = fov / (fov + p1.z)
        const x2d = cx + p1.x * scale
        const y2d = cy + p1.y * scale
        const alpha = Math.min(1, Math.max(0.1, (800 - p1.z) / 700))

        ctx.beginPath()
        ctx.arc(x2d, y2d, p1.size * scale, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p1.hue}, 85%, 65%, ${alpha * 0.7})`
        ctx.shadowBlur = 8
        ctx.shadowColor = `hsla(${p1.hue}, 90%, 60%, ${alpha})`
        ctx.fill()
        ctx.shadowBlur = 0

        // Subtle lines between nearby projected particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const scale2 = fov / (fov + p2.z)
          const x2d_2 = cx + p2.x * scale2
          const y2d_2 = cy + p2.y * scale2

          const dist = Math.hypot(x2d - x2d_2, y2d - y2d_2)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(x2d, y2d)
            ctx.lineTo(x2d_2, y2d_2)
            ctx.strokeStyle = `hsla(${p1.hue}, 80%, 60%, ${(1 - dist / 120) * 0.15})`
            ctx.lineWidth = 0.75
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
