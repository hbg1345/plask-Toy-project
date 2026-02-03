# AtCoder AI Coach

AI 기반 경쟁 프로그래밍 학습 플랫폼

AtCoder 알고리즘 문제를 AI 코치와 함께 풀며 실력을 키우세요.

## 주요 기능

### AI 채팅 코칭
- 문제별 AI 상담으로 막힐 때 도움 받기
- 단계별 힌트 제공 (정답을 바로 알려주지 않음)
- 채팅 히스토리 저장 및 관리

### 맞춤 문제 추천
- 사용자 레이팅 기반 적정 난이도 문제 추천
- 현재 레이팅 ±500 범위의 문제 자동 선별
- 난이도별 색상 구분 (회색~금색)

### 문제 아카이브
- ABC/ARC/AGC 전체 문제 검색
- 콘테스트별 문제 테이블
- 푼 문제 필터링 옵션

### 프로필 & 통계
- AtCoder 핸들 연동 및 레이팅 동기화
- 풀이 기록 및 통계 시각화
- 연습 세션별 상세 기록

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Lucide Icons |
| AI | Vercel AI SDK (@ai-sdk/google) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |

## 시작하기

### 요구사항
- Node.js 18+
- Supabase 프로젝트
- Google AI API 키 (Gemini)

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/plask-Toy-project.git
cd plask-Toy-project/with-supabase-app

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 Supabase URL, API 키, Google AI 키 입력

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 프로젝트 구조

```
with-supabase-app/
├── app/                    # Next.js App Router
│   ├── chat/              # AI 채팅
│   ├── practice/          # 문제 추천
│   ├── problems/          # 문제 아카이브
│   ├── profile/           # 프로필
│   └── auth/              # 인증
├── components/            # React 컴포넌트
├── lib/                   # 유틸리티
└── domains/              # 도메인 로직
```

## 라이선스

MIT
