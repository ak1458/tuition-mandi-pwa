import { PageHeader, PageShell, Icon } from '@/components/common/takhti-ui'

export function SavedPage() {
  return (
    <PageShell>
      <PageHeader title="Saved Teachers" />
      <div className="flex flex-col items-center justify-center px-10 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fbf8f1] text-[#9a8f83]">
          <Icon className="h-10 w-10" name="bookmark" />
        </div>
        <h2 className="mt-6 text-lg font-black text-[#1d1813]">No saved teachers</h2>
        <p className="mt-2 text-sm font-semibold text-[#746a60]">
          Teachers you save will appear here for quick access.
        </p>
      </div>
    </PageShell>
  )
}
