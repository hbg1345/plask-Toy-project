"use client";

import { updatAtcoderHandle } from "@/app/actions";
import { useState } from 'react';
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AtcoderFormProps {
    onSuccess?: () => void;
}

export function AtcoderForm({ onSuccess }: AtcoderFormProps) {
    const [handle, setHandle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    
    const submitHandle = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
        await updatAtcoderHandle(handle);
            // 서버 컴포넌트를 다시 렌더링하여 업데이트된 프로필 정보를 가져옴
            router.refresh();
            // 성공 콜백 호출
            onSuccess?.();
        } catch (error) {
            console.error("Failed to update handle:", error);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <form onSubmit={submitHandle} className="flex flex-row gap-2">
            <Input
                placeholder="Atcoder handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
            />
            <Button type="submit" disabled={isLoading}>
                {isLoading ? "연동 중..." : "연동하기"}
            </Button>
        </form>
    );
}