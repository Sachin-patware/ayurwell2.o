// Utility functions for date/time handling

/**
 * Convert UTC timestamp to IST and format it
 * MongoDB stores all timestamps in UTC, so we need to convert to IST for display
 */

/**
 * Get IST time from UTC timestamp
 */
export function toIST(dateString: string | Date): Date {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
}

import { format } from "date-fns";

/**
 * formatDateIST()
 * - Correctly converts UTC timestamps ending with “Z” to IST.
 * - Leaves local timestamps (with GMT+0530 or +05:30) untouched.
 * - Avoids double timezone conversion.
 */
export function formatDateIST(date: string | Date | null | undefined, formatStr: string = "MMM d, yyyy h:mm a"): string {
    if (!date) return "";

    // Always convert input to Date object
    const d = new Date(date);

    // Detect if the date is already local IST (browser local time)
    // Local date always includes GMT+0530 or +05:30 offset
    const isLocalIST =
        typeof date === "string" &&
        (date.includes("GMT+0530") || date.includes("+05:30"));

    // If already IST → no conversion needed
    if (isLocalIST) {
        return format(d, formatStr);
    }

    // If the date ends with "Z", it is UTC → convert to IST
    const isUTC = typeof date === "string" && date.endsWith("Z");

    if (isUTC) {
        const istDate = new Date(
            d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        return format(istDate, formatStr);
    }

    // For any other case (safety fallback)
    return format(d, formatStr);
}
