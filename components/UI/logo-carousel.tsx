"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SVGProps,
} from "react"
import { AnimatePresence, motion } from "motion/react"

export interface Logo {
  name: string
  id: number
  img: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const distributeLogos = (allLogos: Logo[], columnCount: number): Logo[][] => {
  const shuffled = shuffleArray(allLogos)
  const columns: Logo[][] = Array.from({ length: columnCount }, () => [])

  shuffled.forEach((logo, index) => {
    columns[index % columnCount].push(logo)
  })

  const maxLength = Math.max(...columns.map((col) => col.length))
  columns.forEach((col) => {
    while (col.length < maxLength) {
      col.push(shuffled[Math.floor(Math.random() * shuffled.length)])
    }
  })

  return columns
}

interface LogoColumnProps {
  logos: Logo[]
  index: number
  currentTime: number
}

const LogoColumn: React.FC<LogoColumnProps> = React.memo(
  ({ logos, index, currentTime }) => {
    const cycleInterval = 2000
    const columnDelay = index * 200
    const adjustedTime =
      (currentTime + columnDelay) % (cycleInterval * logos.length)
    const currentIndex = Math.floor(adjustedTime / cycleInterval)

    const CurrentLogo = useMemo(
      () => logos[currentIndex].img,
      [logos, currentIndex]
    )

    return (
      <motion.div
        className="relative h-14 w-24 overflow-hidden md:h-24 md:w-48"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.1,
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${logos[currentIndex].id}-${currentIndex}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ y: "10%", opacity: 0, filter: "blur(8px)" }}
            animate={{
              y: "0%",
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                mass: 1,
                bounce: 0.2,
                duration: 0.5,
              },
            }}
            exit={{
              y: "-20%",
              opacity: 0,
              filter: "blur(6px)",
              transition: {
                type: "tween",
                ease: "easeIn",
                duration: 0.3,
              },
            }}
          >
            <CurrentLogo
              className="h-20 w-20 max-h-[80%] max-w-[80%] object-contain md:h-32 md:w-32"
              aria-label={logos[currentIndex].name}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    )
  }
)

LogoColumn.displayName = "LogoColumn"

function LogoCarousel({
  columnCount = 2,
  logos,
}: {
  columnCount?: number
  logos?: Logo[]
}) {
  const [logoSets, setLogoSets] = useState<Logo[][]>([])
  const [currentTime, setCurrentTime] = useState(0)

  const allLogos: Logo[] = useMemo(
    () =>
      logos ?? [
        { name: "Celo", id: 1, img: CeloLogo },
        { name: "MiniPay", id: 2, img: MiniPayLogo },
        { name: "Ripio", id: 3, img: RipioLogo },
        { name: "Textile", id: 4, img: TextileLogo },
        { name: "Mento", id: 5, img: MentoLogo },
      ],
    [logos]
  )

  useEffect(() => {
    setLogoSets(distributeLogos(allLogos, columnCount))
  }, [allLogos, columnCount])

  const updateTime = useCallback(() => {
    setCurrentTime((prevTime) => prevTime + 100)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(updateTime, 100)
    return () => clearInterval(intervalId)
  }, [updateTime])

  return (
    <div className="flex space-x-4">
      {logoSets.map((columnLogos, index) => (
        <LogoColumn
          key={index}
          logos={columnLogos}
          index={index}
          currentTime={currentTime}
        />
      ))}
    </div>
  )
}

/** Partner brand marks */

function CeloLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 2500 2500" fill="none" role="img" {...props}>
      <title>Celo</title>
      <circle cx="1250" cy="1250" r="1250" fill="#FCFF52" />
      <path
        fill="#000"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1949.3 546.2H550.7v1407.7h1398.7v-491.4h-232.1c-80 179.3-260.1 304.1-466.2 304.1-284.1 0-514.2-233.6-514.2-517.5 0-284 230.1-515.6 514.2-515.6 210.1 0 390.2 128.9 470.2 312.1h228.1V546.2z"
      />
    </svg>
  )
}

function MiniPayLogo(props: SVGProps<SVGSVGElement>) {
  const clipId = React.useId().replace(/:/g, "")
  return (
    <svg viewBox="0 0 256 256" fill="none" role="img" {...props}>
      <title>MiniPay</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx="128" cy="128" r="128" />
        </clipPath>
      </defs>
      <circle cx="128" cy="128" r="128" fill="#0A0A0A" />
      <g clipPath={`url(#${clipId})`}>
        <image href="/logos/minipay.png" width="256" height="256" />
      </g>
    </svg>
  )
}

function RipioLogo(props: SVGProps<SVGSVGElement>) {
  const clipId = React.useId().replace(/:/g, "")
  return (
    <svg viewBox="0 0 408 408" fill="none" role="img" {...props}>
      <title>Ripio</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx="204" cy="204" r="204" />
        </clipPath>
      </defs>
      <circle cx="204" cy="204" r="204" fill="#6B2DFF" />
      <g clipPath={`url(#${clipId})`}>
        <image href="/logos/ripio.png" width="408" height="408" />
      </g>
    </svg>
  )
}

/** Pinked (zigzag) edge path for a square fabric swatch */
function pinkedSquarePath(x: number, y: number, size: number, teeth = 8) {
  const step = size / teeth
  const amp = size * 0.055
  const pts: string[] = []

  // top L→R
  for (let i = 0; i <= teeth; i++) {
    pts.push(`${x + i * step},${y + (i % 2 === 0 ? 0 : amp)}`)
  }
  // right T→B
  for (let i = 1; i <= teeth; i++) {
    pts.push(`${x + size + (i % 2 === 0 ? 0 : amp)},${y + i * step}`)
  }
  // bottom R→L
  for (let i = 1; i <= teeth; i++) {
    pts.push(`${x + size - i * step},${y + size + (i % 2 === 0 ? 0 : amp)}`)
  }
  // left B→T
  for (let i = 1; i < teeth; i++) {
    pts.push(`${x - (i % 2 === 0 ? 0 : amp)},${y + size - i * step}`)
  }

  return `M${pts.join('L')}Z`
}

function TextileLogo(props: SVGProps<SVGSVGElement>) {
  const clipId = React.useId().replace(/:/g, "")
  const back = pinkedSquarePath(38, 38, 100, 9)
  const front = pinkedSquarePath(78, 78, 110, 9)

  return (
    <svg viewBox="0 0 220 220" fill="none" role="img" {...props}>
      <title>Textile</title>
      <defs>
        <clipPath id={clipId}>
          <path d={front} />
        </clipPath>
      </defs>
      <circle cx="110" cy="110" r="110" fill="#FAF9F6" />
      {/* Back pink swatch */}
      <path d={back} fill="#E8A6BE" stroke="#1A1A1A" strokeWidth="2.5" />
      {/* Front blue / yellow striped swatch */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="70" y="70" width="40" height="130" fill="#3E70C4" />
        <rect x="110" y="70" width="38" height="130" fill="#E8C44A" />
        <rect x="148" y="70" width="50" height="130" fill="#3E70C4" />
      </g>
      <path d={front} fill="none" stroke="#1A1A1A" strokeWidth="2.5" />
    </svg>
  )
}

function MentoLogo(props: SVGProps<SVGSVGElement>) {
  const clipId = React.useId().replace(/:/g, "")
  return (
    <svg viewBox="0 0 200 200" fill="none" role="img" {...props}>
      <title>Mento</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="100" fill="#FFFFFF" />
      <g clipPath={`url(#${clipId})`}>
        <image href="/logos/mento.png" width="200" height="200" />
      </g>
    </svg>
  )
}

export {
  LogoCarousel,
  CeloLogo,
  MiniPayLogo,
  RipioLogo,
  TextileLogo,
  MentoLogo,
}
export default LogoCarousel
