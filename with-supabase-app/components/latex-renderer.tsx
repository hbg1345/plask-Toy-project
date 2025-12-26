"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * LaTeX를 HTML로 변환하는 함수
 * $...$ (인라인) 또는 $$...$$ (블록) 형식의 LaTeX를 KaTeX로 렌더링
 */
export function renderLatexInText(text: string): string {
  // 블록 수식 ($$...$$) 먼저 처리
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return `$$${latex}$$`;
    }
  });

  // 인라인 수식 ($...$) 처리 (블록 수식이 아닌 경우만)
  result = result.replace(/\$([^$\n]+?)\$/g, (match, latex) => {
    // 이미 HTML 태그 안에 있으면 (블록 수식으로 변환된 경우) 스킵
    if (match.includes("<")) return match;
    try {
      return katex.renderToString(latex.trim(), {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `$${latex}$`;
    }
  });

  return result;
}

