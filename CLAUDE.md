## 0. Project Overview

**AtCoder AI Coach** - AI 기반 경쟁 프로그래밍 학습 플랫폼

AtCoder 알고리즘 문제를 AI 코치와 함께 풀며 실력을 키우는 서비스.

### 핵심 기능
| 기능 | 경로 | 설명 |
|------|------|------|
| **AI 채팅** | `/chat` | 문제별 AI 상담, 단계별 힌트 제공 |
| **맞춤 추천** | `/practice` | 사용자 레이팅 ±500 범위 문제 추천 |
| **문제 아카이브** | `/problems` | ABC/ARC/AGC 전체 문제 검색 |
| **프로필** | `/profile` | AtCoder 연동, 통계, 풀이 기록 |

### 기술 스택
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui (Radix), Lucide Icons
- **AI**: Vercel AI SDK (@ai-sdk/google)
- **Database**: Supabase (PostgreSQL)
- **External**: AtCoder API, Kenkoo API

### 주요 데이터 테이블
- `user_info` - 사용자 정보 (rating, atcoder_handle)
- `chat_history` - 채팅 기록 (messages, hints, problem_url)
- `problems` - AtCoder 문제 데이터
- `user_solved_problems` - 사용자별 푼 문제
- `practice_sessions` - 연습 세션 기록
- `rating_history` - 레이팅 변화 히스토리

### 앱 구조
```
with-supabase-app/
├── app/                    # Next.js App Router 페이지
│   ├── chat/              # AI 채팅 페이지
│   ├── practice/          # 문제 추천 페이지
│   ├── problems/          # 문제 아카이브
│   ├── profile/           # 사용자 프로필
│   └── auth/              # 인증 (로그인/회원가입)
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   └── ...               # 도메인별 컴포넌트
├── lib/                   # 유틸리티, API 클라이언트
│   ├── supabase/         # Supabase 클라이언트
│   └── actions/          # Server Actions
└── domains/              # 도메인 로직 (schema, action, handler)
```

---

## 1. Rules Summary

### Domain Pattern
1. **Schema is source of truth** — Types, Context, Handler defined in `schema.ts`
2. **Action sets up context** — Auth check, orgId extraction in `action.ts`
3. **Handlers are typed** — Use `Handler` type from schema
4. **One file per operation** — `create.ts`, `update.ts`, not `operations.ts`

### Architecture Boundaries
1. **Views are generic** — NO domain imports in `components/views/`
2. **Domains are isolated** — Cannot cross-import between domains
3. **Domains are pure** — No UI imports in domain files
4. **Pages compose** — Import domains + views

### Component Pattern
1. **DomainForm** — Full form with domain prop and operation
2. **DomainDialog** — Full dialog with submit in footer
3. **DomainTable** — Generic table for any domain
4. **Field ecosystem** — FieldLabel, FieldError, FieldGroup

---

## 2. Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
- **Use Next.js MCP tools for browser/log/error testing verification**

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## 3. Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## 4. Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.