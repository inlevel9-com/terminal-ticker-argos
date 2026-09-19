# ARGOS 터미널

[English](README.md)

터미널에서 쓰는 ARGOS입니다. 시세 티커가 아니라 리서치 브리핑입니다. 미국·한국·해외 상장사 약 16,000곳의 공시, 실적 서프라이즈, 컨센서스 대비 목표가 갭, 섹터 공포·탐욕, AI 브리프를 터미널에서 봅니다. 웹: <https://argos.inlevel9.com>

```bash
npx @inlevel9/argos
```

## 설치

Node.js 22 이상이 필요합니다.

```bash
npm install -g @inlevel9/argos    # `argos` 명령이 생깁니다
argos --version
```

설치하지 않고 `npx @inlevel9/argos <명령>`으로 바로 실행해도 됩니다.

차트는 점자(braille) 문자로 그립니다. 대부분의 터미널 폰트에 들어 있지만, 네모나 물음표로 보이면 `--ascii`를 붙이세요.

## 빠른 시작

조회만 할 때는 계정이 필요 없습니다.

```bash
argos search 삼성전자      # 티커 찾기 (한글·영문 모두 가능)
argos brief NVDA           # 가격, 차트, 컨센서스, 이벤트, AI 브리프
argos 005930               # `argos brief 005930`의 줄임
argos                      # 대화형 터미널 열기
```

관심종목과 다이제스트를 쓰려면 로그인하세요.

```bash
argos login
```

`argos login`을 실행하면 브라우저에 승인 페이지가 열리고 6자리 코드가 미리 채워져 있습니다. 터미널에 표시된 코드와 같은지 확인하고 **승인**을 누르세요. 로그인이 안 되어 있으면 먼저 로그인 화면이 나오고, 로그인 후 승인 페이지로 돌아옵니다. 승인하면 터미널 쪽 로그인은 자동으로 끝납니다. SSH 접속 중이거나 `BROWSER=none`이면 브라우저를 열지 않고 주소만 출력하므로, 휴대폰 등 아무 기기에서나 열면 됩니다.

비밀번호는 터미널에 입력하지 않습니다. CLI는 기기 토큰만 `~/.config/argos/credentials.json`(본인만 읽기 가능)에 저장하고, `argos logout`을 실행하면 서버에서 토큰이 폐기됩니다. 승인 페이지에 표시되는 기기 이름은 기본값이 `argos-cli (<OS> <CPU>)`이며, 컴퓨터 호스트 이름은 보내지 않습니다. 원하는 이름을 쓰려면 `ARGOS_DEVICE_NAME`을 설정하세요.

## 종목 한눈에 보기

```text
$ argos brief NVDA --lang en
NVDA  NVIDIA CORP  NASDAQ
222.27 USD  +1.3% 1D  +6.5% 3M  $5.37T

⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⢀⡤⠤⣄⠀⠀⠀⠀⠀⠀⣤⡀⠀⢀⡴⠋⠳⣄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠖⠋⠳⠴⠋⠀⠀⠈⠳⠤⣄⡀⠀⢀⡇⠷⠲⠞⠀⠀⠀⠈⠳⢤⠀⠀⣰⠚
⢤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣄⣰⠒⢦⡀⠀⣰⠲⢤⡀⠀⠀⠀⠀⣠⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠳⠖⠚⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⠋⠁⠀
⠈⢧⣀⠀⠀⣠⣄⠀⠀⢠⠟⠋⠘⠃⠀⠀⠓⠚⠁⠀⠀⢳⠀⠀⠀⡴⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠈⠳⠖⠃⠈⠙⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠧⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

Consensus
  EPS beats            4/4  last +6.2%
  Target gap        +47.8%  328.49 · strong_buy · 58 analysts
  Sector mood           60  Greed · Technology

Recent events
  11-17  Earnings    Next earnings date
  09-10  Analyst     Piper Sandler: Overweight
  09-04  Analyst     Rosenblatt: Buy
```

(예시는 영어 출력입니다. 기본 언어는 시스템 설정을 따르고, `--lang ko`로 바꿀 수 있습니다.)

- **EPS beat**: 최근 4분기 중 EPS가 컨센서스를 넘은 분기 수와, 직전 분기의 서프라이즈 폭
- **목표가 갭**: 애널리스트 평균 목표가가 최근 종가보다 몇 % 높은지
- **섹터 심리**: 해당 섹터의 공포·탐욕 점수 (0 극단적 공포 ~ 100 극단적 탐욕)

## 대화형 터미널

인자 없이 `argos`를 실행하면 탭 4개가 있는 화면이 열립니다.

| 탭 | 내용 |
|---|---|
| `1` 관심종목 | 왼쪽은 관심종목 목록, 오른쪽은 선택한 종목의 차트·최근 이벤트·컨센서스·섹터 심리. 노란 `●`는 다이제스트를 마지막으로 연 뒤 새 이벤트가 생긴 종목입니다. |
| `2` 섹터 심리 | 미국·한국 섹터별 공포·탐욕 |
| `3` 스크리너 | 시가총액·컨센서스 상승여력·실적 서프라이즈 순위 |
| `4` 다이제스트 | 최근 7일간 관심종목의 새 이벤트 |

단축키:

| 키 | 동작 |
|---|---|
| `1`–`4`, `Tab` | 탭 전환 |
| `j` `k` 또는 `↑` `↓` | 이동 |
| `h` `l` 또는 `←` `→` | 차트 기간 (1M, 3M, 6M, YTD, 1Y, 3Y, 5Y) |
| `/` | 종목 검색. `Enter`로 열고 `Esc`로 닫기 |
| `b` | 선택한 종목의 AI 브리프 전체 보기 |
| `a` / `d` | 관심종목 추가 / 삭제 |
| `o` | 웹에서 종목 페이지 열기 |
| `m` / `s` | 시장 전환 / 정렬 변경 (섹터 심리·스크리너 탭) |
| `r` | 새로고침 |
| `?` | 도움말 |
| `q` | 종료 |

검색으로 연 종목은 `a`로 추가하기 전까지 회색으로 표시됩니다. 창이 좁아도 화면이 맞춰지지만, 80열 이상에서 가장 보기 좋습니다.

## 명령

| 명령 | 동작 |
|---|---|
| `argos` | 대화형 터미널 |
| `argos login` · `logout` · `whoami` | 로그인, 로그아웃, 계정 확인 |
| `argos brief <티커>` · `argos <티커>` | 종목 하나 요약 |
| `argos search <검색어>` | 이름이나 코드로 티커 찾기 |
| `argos watch` | 관심종목 보기 |
| `argos watch add <티커>` · `argos watch rm <티커>` | 관심종목 추가·삭제 |
| `argos sentiment [--market kr]` | 섹터 공포·탐욕 (기본은 미국) |
| `argos screen [옵션]` | 퀀트 스크리너 (아래) |
| `argos digest [--since <날짜>] [--all]` | 마지막 확인 이후 관심종목의 새 이벤트 |

모든 명령에 쓸 수 있는 옵션:

| 옵션 | |
|---|---|
| `--json` | 응답을 JSON 그대로 출력 |
| `--lang ko\|en` | 언어 (기본값: 설정 파일, 없으면 `$LANG`) |
| `--range 1M\|3M\|6M\|YTD\|1Y\|3Y\|5Y` | `brief` 차트 기간 |
| `--ascii` | 점자 문자 없이 차트 그리기 |
| `--no-color` | 색 끄기 (`NO_COLOR` 환경 변수도 인식) |

### 스크리너

```bash
argos screen --market us --sort upside --min-upside 20
argos screen --market us --beat --min-mcap 1e10
argos screen --market kr --min-mcap-krw 1e13        # 한국, 시총 10조 원 이상
```

| 옵션 | |
|---|---|
| `--market us\|kr\|jp\|hk\|tw\|cn\|eu` | 시장 |
| `--sector <텍스트>` | 섹터 이름에 포함된 텍스트 (예: `Semiconductors`) |
| `--min-mcap <달러>` | 최소 시가총액 (달러) |
| `--min-mcap-krw <원>` | 최소 시가총액 (원, 한국 종목만) |
| `--min-upside <%>` | 최소 컨센서스 상승여력 (%) |
| `--beat` | 직전 분기 EPS가 컨센서스를 넘은 종목만 |
| `--sort cap\|upside\|surprise` | 정렬 (기본 `cap`) |
| `--limit <n>` | 최대 50행 (기본 25) |

```text
$ argos screen --market kr --limit 3 --lang en
TICKER    NAME                         MCAP    UPSIDE  SURPRISE  SECTOR
005930    SAMSUNG ELECTRONICS C…   ₩1476.2T         —    +40.0%  Technology
000660    SK hynix Inc.            ₩1274.7T         —    +41.6%  Technology
005935    SamsungElectronics(1P)    ₩155.1T         —         —  Technology
```

한국 종목은 시가총액을 원화로 보여줍니다(`--lang ko`에서는 `₩1476조`처럼 표시). 한국 종목의 컨센서스 목표가는 아직 제공되지 않아 상승여력은 `—`입니다.

### 스크립트에서 쓰기

`--json`은 서버 응답을 그대로 출력하므로 다른 도구와 연결할 수 있습니다.

```bash
# 여러 종목의 목표가 갭
for t in NVDA AAPL 005930; do
  argos brief "$t" --json | jq -r '[.company.ticker, .consensus.target_gap_pct] | @tsv'
done

# 컨센서스를 넘은 미국 종목 티커 (시총 순)
argos screen --market us --beat --json | jq -r '.items[].ticker'

# 최근 7일간 관심종목별 새 이벤트 수
argos digest --all --json | jq '.by_ticker'
```

응답 필드는 [`docs/API.md`](docs/API.md)에 정리되어 있습니다.

## 설정

설정 파일은 `~/.config/argos/`(또는 `$XDG_CONFIG_HOME/argos`)에 있습니다.

| 파일 | 내용 |
|---|---|
| `config.json` | 기본값. 예: `{ "lang": "ko", "range": "3M", "ascii": false }` |
| `credentials.json` | 기기 토큰 (본인만 읽기 가능) |
| `state.json` | 다이제스트를 마지막으로 확인한 시각 |

환경 변수: `ARGOS_API_URL`(기본 `https://argos.inlevel9.com`), `ARGOS_CONFIG_DIR`, `ARGOS_DEVICE_NAME`, `NO_COLOR`, `BROWSER=none`.

## 문제 해결

| 증상 | 해결 |
|---|---|
| 차트가 네모나 `?`로 보임 | 폰트에 점자 문자가 없습니다. `--ascii`를 쓰거나 `config.json`에 `"ascii": true`를 넣으세요. |
| 열이 어긋나 보임 | 한글을 두 칸 폭으로 그리는 고정폭 폰트를 쓰세요(대부분 해당). 대화형 화면은 80열 이상에서 가장 잘 보입니다. |
| `argos login`이 브라우저를 열지 않음 | 출력된 주소를 아무 기기에서나 직접 여세요. |
| "로그인이 필요합니다" | `argos login`을 실행하세요. 계정이 필요한 것은 관심종목과 다이제스트뿐입니다. |
| "서버 응답을 해석하지 못했습니다" | 업데이트하세요: `npm install -g @inlevel9/argos@latest` |
| "요청이 너무 많습니다" | 공개 API는 IP당 요청 수가 제한됩니다. 1분쯤 뒤에 다시 시도하세요. |

## 고지

- **투자 권유가 아닙니다.** ARGOS는 무료 리서치 도구입니다. 개별 투자 상담, 자금 운용, 매수·매도 추천을 하지 않으며, 금융위원회에 등록된 투자자문업자나 유사투자자문업자가 아닙니다. 투자 판단과 그 결과(원금 손실 포함)의 책임은 이용자에게 있습니다.
- **생성형 AI 사용.** AI 브리프는 생성형 인공지능(Google Gemini)이 작성하며 "AI 브리프 · 생성형 AI 작성"으로 표시됩니다(「인공지능 발전과 신뢰 기반 조성 등에 관한 기본법」 제31조). 오류가 있을 수 있으니 종목 페이지의 원자료와 함께 확인하세요.
- **데이터 출처.** 가격·공시·컨센서스 등은 공공데이터(금융위원회, 공공데이터포털), OpenDART, SEC EDGAR 등 공개·제3자 출처에서 가져오며 전체 목록은 <https://argos.inlevel9.com/sources>에 있습니다. 실시간보다 늦을 수 있고, 시장에 따라 비어 있는 항목이 있습니다.
- **개인정보.** 로그인하지 않으면 조회 요청만 전송됩니다. 로그인하면 기기 토큰이 ARGOS 계정과 연결됩니다. 자세한 내용은 [개인정보처리방침](https://argos.inlevel9.com/privacy)과 [이용약관](https://argos.inlevel9.com/terms)을 보세요.
- **터미널 출력.** 서버에서 받은 텍스트는 출력 전에 제어문자를 제거하므로, 외부 콘텐츠가 터미널에 제어 시퀀스를 보낼 수 없습니다.

## 개발

```bash
npm install
npm run dev -- brief NVDA                          # 프로덕션 API로 실행
ARGOS_API_URL=http://localhost:3000 npm run dev    # 로컬 ARGOS 서버로 실행
npm test && npm run typecheck && npm run build
```

배포: `package.json`의 `version`을 올리고 같은 버전의 `v<version>` 태그를 푸시하면 CI가 npm에 provenance와 함께 배포합니다([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## 라이선스

[MIT](LICENSE)
