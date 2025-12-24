"use client";

import { updatAtcoderHandle } from "@/app/actions";
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AtcoderForm() {
    const [handle, setHandle] = useState("");
    const submitHandle = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("handle:" + handle);
        await updatAtcoderHandle(handle);
    };
    return (
        <form onSubmit={submitHandle} className="flex flex-row gap-2">
            <Input
                placeholder="Atcoder handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
            />
            <Button type="submit">연동하기</Button>
        </form>
    );
}