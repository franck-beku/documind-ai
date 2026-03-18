import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  FileSearch:     () => null, Upload:       () => null,
  Eye:            () => null, Trash2:       () => null,
  RefreshCw:      () => null, ArrowLeft:    () => null,
  Download:       () => null, AlertTriangle:() => null,
  FileText:       () => null, Info:         () => null,
  CheckSquare:    () => null, PenLine:      () => null,
  MessageSquare:  () => null, Send:         () => null,
  LayoutDashboard:() => null, History:      () => null,
  Users:          () => null, Settings:     () => null,
  LogOut:         () => null, BarChart2:    () => null,
}))