import { Link, useNavigate } from 'react-router'
import { Icon, IconButton, PageHeader, PageShell, PersonAvatar, cx } from '@/components/common/tuition-mandi-ui'
import { removeSavedTeacher } from '@/lib/saved-teachers'
import { useSavedTeachers } from '@/hooks/use-saved-teachers'

function teacherVariant(name: string) {
  return /anjali|neha|priyanka/i.test(name) ? 'female' : 'male'
}

export function SavedPage() {
  const navigate = useNavigate()
  const items = useSavedTeachers()

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        subtitle={`${items.length} teacher${items.length === 1 ? '' : 's'} saved`}
        title="Saved Teachers"
      />

      <section className="px-4 py-4 pb-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[#fbf8f1] text-[#9a8f83]">
              <Icon className="h-10 w-10" name="bookmark" />
            </div>
            <h2 className="mt-6 text-lg font-black text-[#1d1813]">Abhi koi teacher saved nahi hai</h2>
            <p className="mt-2 text-sm font-semibold text-[#746a60]">
              Teacher profile pe heart icon pe tap karein - yahan dikh jayenge.
            </p>
            <button
              className="mt-5 rounded-xl bg-[#4930a8] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)]"
              onClick={() => navigate('/search')}
              type="button"
            >
              Find Teachers
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((teacher) => (
              <article
                className="rounded-[18px] border border-[#eee4d8] bg-white p-3 shadow-[0_10px_24px_rgba(53,38,22,0.06)]"
                key={teacher.id}
              >
                <div className="flex items-start gap-3">
                  <PersonAvatar name={teacher.full_name} size="sm" variant={teacherVariant(teacher.full_name)} />
                  <Link className="min-w-0 flex-1" to={`/profile/${teacher.id}`}>
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-[13px] font-extrabold text-[#1d1813]">{teacher.full_name}</h3>
                      {teacher.is_verified && (
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-[#0d7b51] text-white">
                          <Icon className="h-2.5 w-2.5" name="check" />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-[#5d544c]">
                      {teacher.subjects.slice(0, 2).join(' + ')} - {teacher.classes_taught.slice(0, 2).join(', ')}
                    </p>
                    <p className="mt-1 truncate text-[11px] font-semibold text-[#9a8f83]">
                      {teacher.area_mohalla ? `${teacher.area_mohalla}, ${teacher.city}` : teacher.city}
                    </p>
                  </Link>
                  <button
                    aria-label="Remove from saved"
                    className={cx('grid h-9 w-9 place-items-center rounded-xl border border-[#eadfcd] bg-white text-[#d84b3f] shadow-sm')}
                    onClick={() => removeSavedTeacher(teacher.id)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="heart" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
