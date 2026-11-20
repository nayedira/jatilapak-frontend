interface P { size?: number; color?: string }
const base = (size: number) => ({ width: size, height: size, fill: 'none', xmlns: 'http://www.w3.org/2000/svg' })

export const HomeIcon = ({ size = 24, color = '#000' }: P) => (
  <svg {...base(size)} viewBox="40 22 22 24" strokeLinecap="round" strokeWidth="1.7" stroke={color}>
    <path d="M53 43.9992V35.9992C53 35.734 52.8946 35.4796 52.7071 35.2921C52.5196 35.1046 52.2652 34.9992 52 34.9992H48C47.7348 34.9992 47.4804 35.1046 47.2929 35.2921C47.1054 35.4796 47 35.734 47 35.9992V43.9992M41 32.9997C40.9999 32.7088 41.0633 32.4213 41.1858 32.1574C41.3082 31.8935 41.4868 31.6595 41.709 31.4717L48.709 25.4717C49.07 25.1666 49.5274 24.9992 50 24.9992C50.4726 24.9992 50.93 25.1666 51.291 25.4717L58.291 31.4717C58.5132 31.6595 58.6918 31.8935 58.8142 32.1574C58.9367 32.4213 59.0001 32.7088 59 32.9997V41.9997C59 42.5301 58.7893 43.0388 58.4142 43.4139C58.0391 43.789 57.5304 43.9997 57 43.9997H43C42.4696 43.9997 41.9609 43.789 41.5858 43.4139C41.2107 43.0388 41 42.5301 41 41.9997V32.9997Z" />
  </svg>
)
export const SearchIcon = ({ size = 24, color = '#969696' }: P) => (
  <svg {...base(size)} viewBox="0 0 26 26" strokeLinecap="round" strokeWidth="1.6" stroke={color}>
    <circle cx="10.5" cy="10.5" r="9.5" /><path d="M24 25L17.5 18.5" />
  </svg>
)
export const ChatIcon = ({ size = 24, color = '#969696' }: P) => (
  <svg {...base(size)} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke={color}>
    <path d="M3 20l1.3-3.9A8.5 8.5 0 1 1 8 19.3L3 20z" />
  </svg>
)
export const UserIcon = ({ size = 24, color = '#969696' }: P) => (
  <svg {...base(size)} viewBox="0 0 24 24" strokeLinecap="round" strokeWidth="1.7" stroke={color}>
    <circle cx="12" cy="7" r="5" /><path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
)
export const BellIcon = ({ size = 18, color = '#110E0F' }: P) => (
  <svg {...base(size)} viewBox="0 0 32 32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" stroke={color}>
    <path d="M18.3067 28C17.7 29 16.9 29.3 16 29.3S14.3 29 13.7 28M24 10.7C24 6.3 20.4 2.7 16 2.7S8 6.3 8 10.7C8 20 4 22.7 4 22.7H28S24 20 24 10.7Z" />
  </svg>
)
export const PinIcon = ({ size = 16, color = '#0D9488' }: P) => (
  <svg {...base(size)} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" stroke={color}>
    <path d="M20 10c0 6-5.5 11-8 13-2.5-2-8-7-8-13a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
export const BookmarkIcon = ({ size = 22, filled = false }: P & { filled?: boolean }) => (
  <svg {...base(size)} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="#000" style={{ fill: filled ? '#000' : 'none' }}>
    <path d="M19 21L12 16L5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)