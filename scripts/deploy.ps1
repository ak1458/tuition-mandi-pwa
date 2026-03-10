param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef
)

$ErrorActionPreference = "Stop"

Write-Host "Linking Supabase project: $ProjectRef"
npx supabase link --project-ref $ProjectRef

Write-Host "Pushing database migrations..."
npx supabase db push

Write-Host "Deploying edge function: generate-progress-report"
npx supabase functions deploy generate-progress-report

Write-Host "Deploying edge function: upgrade-plan"
npx supabase functions deploy upgrade-plan

Write-Host "Setting function secret placeholders (update actual values before running in CI)..."
Write-Host "npx supabase secrets set GEMINI_API_KEY=... RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=..."

Write-Host "Deployment steps completed."
