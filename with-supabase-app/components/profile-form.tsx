"use client";
import { useState } from "react";
import { AtcoderForm } from "./atcoder-form";
import { UserInfoRow } from "@/types/supabase";
export function ProfileForm({rating, atcoder_handle}: UserInfoRow) {
    const [modify, setModify] = useState(false);

    console.log(rating);
    if (rating === null || modify) {
        return (
        <AtcoderForm/>
        );
    }
    return (
        <div>
        <p> Atcoder handle: {atcoder_handle} </p>
        <p> rating: {rating} </p>
        <button onClick={() => setModify(true)}>수정하기</button>
        </div>
    );
}