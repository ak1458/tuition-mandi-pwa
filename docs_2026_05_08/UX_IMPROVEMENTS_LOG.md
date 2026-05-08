# UX Improvements Log (Local Mode)

**Date:** May 8, 2026

## 1. WhatsApp Fee Reminders Added
- **Objective:** Allow teachers to send fee reminders to parents with a single click.
- **Changes Made:**
  - Updated `FeeRow` interface in `src/features/fees/services/fees-service.ts` to include `guardianPhone`.
  - Updated data fetching logic in both `getLocalMode` and `supabase` mappings to fetch `guardian_phone` from the `students` table.
  - Added `buildFeeReminderLink` in `src/utils/whatsapp.ts` to generate a pre-filled Hindi WhatsApp message detailing the amount due and the month.
  - Updated `src/features/fees/pages/fees-page.tsx` to conditionally render a WhatsApp icon button next to the student's fee status if the status is `pending` or `partial` and the `guardianPhone` is available.

## 2. AI Progress Report Quality Enhanced
- **Objective:** Make the AI-generated reports more comprehensive and human-like by including fee status and enforcing a polite, encouraging tone.
- **Changes Made:**
  - Updated `ReportMetrics` interface in `src/features/reports/services/reports-service.ts` to include `feePendingAmount`.
  - Updated `getReportMetrics` to calculate the `feePendingAmount` by comparing `monthly_fee` from the student record against the `amount_paid` from the fee record.
  - Enhanced `buildOpenRouterPrompt` to inject the `feePendingAmount`. The prompt now instructs the AI to politely mention pending fees or thank the parent if fees are clear. It also enforces a rule to use gentle phrasing if attendance is below 50%.

## Next Steps
These changes significantly reduce the daily friction for teachers. The app now handles the awkwardness of asking for fees via automated, professional WhatsApp links and AI-generated text. The next logical step is to ensure that if these actions are taken offline, the sync conflict resolution is bulletproof, or to move towards Phase 1 (Supabase Live Deployment).