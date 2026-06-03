/**
 * Share Profile Button — Native share + Facebook specific
 */
export function ShareProfileButton({
    profileId,
    teacherName,
    city,
}: {
    profileId: string
    teacherName: string
    city: string
}) {
    const profileUrl = `${window.location.origin}/profile/${profileId}`

    const shareText = `${teacherName} — Experienced tuition teacher in ${city}. 
Verified profile, parent ratings, aur results dekho:
${profileUrl}
#TuitionMandi #Tuition${city.replace(/\s/g, '')}`

    function handleShare() {
        if (navigator.share) {
            navigator.share({
                title: `${teacherName} — TuitionMandi Teacher Profile`,
                text: shareText,
                url: profileUrl,
            }).catch(() => {
                // Fallback if share cancelled
                navigator.clipboard.writeText(profileUrl)
            })
        } else {
            navigator.clipboard.writeText(profileUrl)
            alert('Link copy ho gaya!')
        }
    }

    function shareToFacebook() {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}&quote=${encodeURIComponent(shareText)}`
        window.open(fbUrl, '_blank')
    }

    function shareToWhatsApp() {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
        window.open(waUrl, '_blank')
    }

    return (
        <div className="flex gap-2">
            <button
                type="button"
                onClick={handleShare}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-[11px] font-bold text-ink transition-all hover:border-saffron/40 hover:shadow-sm"
            >
                📤 Share Profile
            </button>
            <button
                type="button"
                onClick={shareToFacebook}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-center text-[11px] font-bold text-blue-600 transition-all hover:bg-blue-100"
            >
                f
            </button>
            <button
                type="button"
                onClick={shareToWhatsApp}
                className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-center text-[11px] font-bold text-green-600 transition-all hover:bg-green-100"
            >
                💬
            </button>
        </div>
    )
}
