"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Challenge = {
    id: string;
    orderIndex: number;
    title: string;
    stars: number;
    isLocked: boolean;
    sentenceCount: number;
}