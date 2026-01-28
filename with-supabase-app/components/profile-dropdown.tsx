"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut } from "lucide-react";

interface ProfileDropdownProps {
  avatarUrl: string | null;
  handle: string | null;
  email: string | null;
}

export function ProfileDropdown({ avatarUrl, handle, email }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* 프로필 이미지 - 클릭 시 프로필 페이지로 이동 */}
      <Link
        href="/profile"
        className="block w-9 h-9 rounded-full overflow-hidden bg-muted border-2 border-border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
            <User className="w-5 h-5" />
          </div>
        )}
      </Link>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <>
          {/* 호버 영역 연결용 투명 브릿지 */}
          <div className="absolute right-0 top-full h-2 w-48" />
          <div className="absolute right-0 top-full mt-2 w-48 bg-popover border rounded-lg shadow-lg py-1 z-50">
            {/* 유저 정보 */}
            <div className="px-3 py-2 border-b">
              {handle && (
                <p className="font-medium text-sm truncate">{handle}</p>
              )}
              {email && (
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              )}
            </div>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
