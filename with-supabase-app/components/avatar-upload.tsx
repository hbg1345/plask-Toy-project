"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  avatarUrl: string | null;
  onUpload: (url: string) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_DIMENSION = 512; // 512px

// 이미지 리사이즈 함수
function resizeImage(file: File, maxDimension: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // 512px 이하면 리사이즈 불필요
      if (width <= maxDimension && height <= maxDimension) {
        resolve(file);
        return;
      }

      // 비율 유지하면서 리사이즈
      if (width > height) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to resize image"));
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarUpload({ avatarUrl, onUpload }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      const file = event.target.files?.[0];
      if (!file) return;

      // 파일 타입 체크 (jpg/png만)
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("JPG 또는 PNG 파일만 업로드 가능합니다.");
        return;
      }

      // 파일 크기 체크 (1MB)
      if (file.size > MAX_SIZE) {
        alert("파일 크기는 1MB 이하여야 합니다.");
        return;
      }

      // 이미지 크기 체크 및 리사이즈
      const resizedBlob = await resizeImage(file, MAX_DIMENSION);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("로그인이 필요합니다.");
        return;
      }

      const fileExt = file.type === "image/png" ? "png" : "jpg";
      const fileName = `${user.id}/avatar.${fileExt}`;

      // 기존 파일 삭제 (있다면)
      await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`]);

      // 새 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, resizedBlob, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // user_info 테이블 업데이트
      const { error: updateError } = await supabase
        .from("user_info")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      onUpload(publicUrl + "?t=" + Date.now()); // 캐시 무효화
    } catch (error) {
      console.error("Error uploading avatar:", error);
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      alert(`프로필 사진 업로드에 실패했습니다: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Camera className="w-8 h-8" />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/jpeg,image/png"
        className="hidden"
        disabled={uploading}
      />

      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-0 right-0 rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
