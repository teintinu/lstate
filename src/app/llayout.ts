import { Size } from './lwindow'

export interface AppPagelets {
  header: number | false,
  footer: number | false,
  lside: number | false,
  rside: number | false,
}

export interface AppLayout {
  desired: AppPagelets
  actual: AppPagelets
  window: Size
  content: Size
}
