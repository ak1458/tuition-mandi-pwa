import { useNavigate } from 'react-router'
import { Avatar, Btn, EmptyState, IconBtn, TopBar } from '@/components/common/tm-kit'
import { useLocalInquiries } from '@/hooks/use-local-inquiries'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function MessagesPage() {
  const navigate = useNavigate()
  const items = useLocalInquiries()
  const newCount = items.filter((i) => i.status === 'new').length

  return (
    <div className="tm-noscroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <TopBar
        title="Messages"
        subtitle={newCount > 0 ? `${newCount} naye` : `${items.length} message${items.length === 1 ? '' : 's'}`}
        onBack={() => navigate(-1)}
        right={<IconBtn name="search" label="Search" />}
      />

      <div style={{ padding: '8px 0 100px' }}>
        {items.length === 0 ? (
          <EmptyState
            icon="message"
            title="Abhi koi message nahi"
            body="Teacher ke profile par Send Inquiry tap karein — aapke messages yahan dikhenge."
            action={<Btn variant="ink" icon="search" onClick={() => navigate('/search')}>Find Teachers</Btn>}
          />
        ) : (
          items.map((m) => {
            const unread = m.status === 'new'
            return (
              <button
                key={m.id}
                onClick={() => navigate('/inquiries')}
                className="tm-btn"
                style={{ width: '100%', display: 'flex', gap: 13, alignItems: 'center', padding: '13px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <Avatar name={m.parent_name || 'Parent'} size={50} radius={16} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span className="font-display" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.parent_name || 'Parent'}</span>
                    <span style={{ fontSize: 11, color: unread ? 'var(--marigold-deep)' : 'var(--ink-soft)', fontWeight: 700, flexShrink: 0 }}>{timeAgo(m.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>{m.subject_needed || 'Tuition'} · {m.student_class || 'Class'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 12.5, color: unread ? 'var(--ink-2)' : 'var(--ink-soft)', fontWeight: unread ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                      {m.message || `Status: ${m.status}`}
                    </span>
                    {unread && <span style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--marigold)', flexShrink: 0 }} />}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
