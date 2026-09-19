import { hostname } from 'node:os'
import { spawn } from 'node:child_process'
import { api } from './api.js'
import { clearCredentials, loadCredentials, saveCredentials, type Lang } from './config.js'

export function openUrl(url: string): void {
  // Over SSH or with BROWSER=none there's no local browser to open; the URL is printed.
  if (process.env.SSH_CONNECTION || process.env.BROWSER === 'none' || process.env.ARGOS_NO_BROWSER) return
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]
  try {
    spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
  } catch {
    // No browser available (SSH, CI): the URL is printed anyway.
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function login(lang: Lang, log: (s: string) => void = (s) => process.stderr.write(`${s}\n`)): Promise<void> {
  const start = await api.deviceStart()
  const ko = lang === 'ko'
  log(ko ? `\n  브라우저에서 아래 코드를 입력해 이 기기를 연결하세요.\n` : `\n  Enter this code in your browser to link this device.\n`)
  log(`    ${start.user_code}\n`)
  log(`  ${start.verification_url}\n`)
  openUrl(start.verification_url)

  const deadline = Date.now() + start.expires_in * 1000
  const deviceName = `argos-cli (${hostname()})`
  while (Date.now() < deadline) {
    await sleep(2500)
    let res
    try {
      res = await api.devicePoll(start.device_code, deviceName)
    } catch (err) {
      if ((err as { code?: string }).code === 'slow_down') { await sleep(2500); continue }
      throw err
    }
    if (res.status === 'approved') {
      saveCredentials({ token: res.token, email: res.user.email })
      log(ko ? `  연결됨: ${res.user.email ?? res.user.id}` : `  Signed in as ${res.user.email ?? res.user.id}`)
      return
    }
    if (res.status === 'expired') break
  }
  throw new Error(ko ? '코드가 만료되었습니다. `argos login`을 다시 실행하세요.' : 'The code expired. Run `argos login` again.')
}

export async function logout(lang: Lang): Promise<string> {
  const creds = loadCredentials()
  if (creds) await api.revoke(creds.token).catch(() => {})
  clearCredentials()
  return lang === 'ko' ? '로그아웃했습니다.' : 'Signed out.'
}
