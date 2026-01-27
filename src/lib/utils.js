import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export function createPageUrl(pageName, params = {}) {
    const paramString = new URLSearchParams(params).toString();
    return paramString ? `/${pageName}?${paramString}` : `/${pageName}`;
}
