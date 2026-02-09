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
        className="block w-8 h-8 rounded-full overflow-hidden bg-pixel-navy hover:ring-2 hover:ring-pixel-yellow transition-all"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-pixel-gray bg-pixel-navy">
            <User className="w-4 h-4" />
          </div>
        )}
      </Link>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <>
          {/* 호버 영역 연결용 투명 브릿지 */}
          <div className="absolute right-0 top-full h-2 w-48" />
          <div className="absolute right-0 top-full mt-2 w-48 bg-pixel-dark border-4 border-pixel-white shadow-[4px_4px_0_0_#333c57] py-1 z-50">
            {/* 유저 정보 */}
            <div className="px-3 py-2 border-b-2 border-pixel-navy">
              {handle && (
                <p className="font-game text-sm font-bold text-pixel-yellow truncate">{handle}</p>
              )}
              {email && (
                <p className="font-game text-xs text-pixel-gray truncate mt-1">{email}</p>
              )}
            </div>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 font-game text-xs font-medium text-pixel-red hover:bg-pixel-navy transition-colors"
            >
              <LogOut className="w-4 h-4" />
              LOG OUT
            </button>
          </div>
        </>
      )}
    </div>
  );
}
