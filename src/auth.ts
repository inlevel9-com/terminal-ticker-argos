import { hostname } from 'node:os'
import { spawn } from 'node:child_process'
import { api } from './api.js'
import { clearCredentials, loadCredentials, saveCredentials, type Lang } from './config.js'

// Returns false when it didn't try (SSH, BROWSER=none); the caller prints the URL either way.
export function openUrl(url: string): boolean {
  if (process.env.SSH_CONNECTION || process.env.BROWSER === 'none' || process.env.ARGOS_NO_BROWSER) return false
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]
  try {
    spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
    return true
  } catch {
    return false
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function login(lang: Lang, log: (s: string) => void = (s) => process.stderr.write(`${s}\n`)): Promise<void> {
  const deviceName = `argos-cli (${hostname()})`
  const start = await api.deviceStart(deviceName)
  const ko = lang === 'ko'
  const url = start.verification_url_complete ?? start.verification_url
  const opened = openUrl(url)
  log(ko
    ? `\n  ${opened ? '브라우저에서 ARGOS 승인 페이지를 열었습니다.' : '아래 주소를 브라우저에서 여세요.'} 코드가 같은지 확인하고 [승인]을 누르세요.\n`
    : `\n  ${opened ? 'Opened the ARGOS approval page in your browser.' : 'Open this address in a browser.'} Check the code matches, then click Approve.\n`)
  log(`    ${start.user_code}\n`)
  log(`  ${url}\n`)
  log(ko ? '  승인을 기다리는 중… (Ctrl+C로 취소)' : '  Waiting for approval… (Ctrl+C to cancel)')

  const deadline = Date.now() + start.expires_in * 1000
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
