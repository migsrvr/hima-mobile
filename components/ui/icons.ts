import { createLucideIcon } from 'lucide-react-native';

/**
 * Every icon the design uses, in one place. Screens import icons from here.
 *
 * Most come straight from lucide-react-native. The design was drawn with an
 * older Lucide release, and a few glyphs have since been redrawn upstream.
 * Those are rebuilt below with lucide's own createLucideIcon and the exact
 * path data from design/screens, so they render exactly like the design.
 */
export {
  ArrowLeft,
  ArrowRight,
  Ban,
  Banknote,
  Bell,
  Bus,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleQuestionMark,
  CircleX,
  Clock,
  Coffee,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FingerprintPattern,
  GraduationCap,
  Hourglass,
  House,
  Info,
  KeyRound,
  Link,
  LoaderCircle,
  Lock,
  LogOut,
  Nfc,
  Pencil,
  Printer,
  RefreshCw,
  Send,
  Shield,
  ShieldCheck,
  SmartphoneNfc,
  Tag,
  Timer,
  TriangleAlert,
  User,
  Utensils,
  Wallet,
  X,
} from 'lucide-react-native';
export type { LucideIcon, LucideProps } from 'lucide-react-native';

const SPARKLE_PATH =
  'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z';

/** Hima AI mark (single star). */
export const Sparkle = createLucideIcon('sparkle', [['path', { d: SPARKLE_PATH, key: 'star' }]]);

/** Hima AI mark with the small plus (07 Home, Foundations). */
export const Sparkles = createLucideIcon('sparkles', [
  ['path', { d: SPARKLE_PATH, key: 'star' }],
  ['path', { d: 'M20 3v4', key: 'v' }],
  ['path', { d: 'M22 5h-4', key: 'h' }],
]);

export const Calendar = createLucideIcon('calendar', [
  ['path', { d: 'M8 2v4', key: 'a' }],
  ['path', { d: 'M16 2v4', key: 'b' }],
  ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2', key: 'c' }],
  ['path', { d: 'M3 10h18', key: 'd' }],
]);

export const BookOpen = createLucideIcon('book-open', [
  ['path', { d: 'M12 7v14', key: 'a' }],
  [
    'path',
    {
      d: 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
      key: 'b',
    },
  ],
]);

export const PiggyBank = createLucideIcon('piggy-bank', [
  [
    'path',
    {
      d: 'M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z',
      key: 'a',
    },
  ],
  ['path', { d: 'M2 9v1c0 1.1.9 2 2 2h1', key: 'b' }],
  ['path', { d: 'M16 11h.01', key: 'c' }],
]);

export const ShoppingBag = createLucideIcon('shopping-bag', [
  ['path', { d: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z', key: 'a' }],
  ['path', { d: 'M3 6h18', key: 'b' }],
  ['path', { d: 'M16 10a4 4 0 0 1-8 0', key: 'c' }],
]);

export const Store = createLucideIcon('store', [
  ['path', { d: 'M3 9 4.5 4h15L21 9', key: 'a' }],
  ['path', { d: 'M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z', key: 'b' }],
  ['path', { d: 'M5 12.5V20h14v-7.5', key: 'c' }],
  ['path', { d: 'M10 20v-4h4v4', key: 'd' }],
]);

export const CloudOff = createLucideIcon('cloud-off', [
  ['path', { d: 'm2 2 20 20', key: 'a' }],
  ['path', { d: 'M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193', key: 'b' }],
  ['path', { d: 'M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07', key: 'c' }],
]);
