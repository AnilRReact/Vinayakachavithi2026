import { useMemo } from 'react'
import { Card, Empty, Form } from '../../components/ui'
import { RecordActions } from '../../components/RecordActions'
import { useToast } from '../../context/ToastContext'

export function Music({ data, admin, add, update, remove }) {
  const { toast } = useToast()
  const tracksList = data.music_playlist || []

  const sortedTracks = useMemo(() => {
    return [...tracksList].sort(
      (a, b) =>
        Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
        String(a.title || '').localeCompare(String(b.title || ''))
    )
  }, [tracksList])

  const trackFields = [
    { name: 'title', label: 'Song / Track Title', required: true, placeholder: 'e.g. Ganapathi Bappa Morya, Ganesha Ashtakam' },
    { name: 'artist', label: 'Artist / Album / Singer', placeholder: 'e.g. S.P. Balasubrahmanyam, Devotional' },
    { name: 'language', label: 'Language', placeholder: 'e.g. Telugu, Hindi, Sanskrit' },
    { name: 'audio_url', label: 'Audio / YouTube URL', type: 'url', required: true, placeholder: 'https://...' },
    { name: 'sort_order', label: 'Playlist Position / Priority', type: 'number', default: 0 }
  ]

  const handleAddTrack = async (values) => {
    const err = await add('music_playlist', {
      ...values,
      sort_order: Number(values.sort_order || 0)
    })
    if (err) {
      toast.error(err.message || 'Failed to add song.')
    } else {
      toast.success('Track added to playlist.')
    }
  }

  const handleUpdateTrack = async (id, values) => {
    const err = await update('music_playlist', id, {
      ...values,
      sort_order: Number(values.sort_order || 0)
    })
    if (err) {
      toast.error(err.message || 'Failed to update song.')
    } else {
      toast.success('Song details updated.')
    }
  }

  const handleDeleteTrack = async (id) => {
    const err = await remove('music_playlist', id)
    if (err) {
      toast.error(err.message || 'Failed to remove song.')
    } else {
      toast.success('Track removed from playlist.')
    }
  }

  return (
    <>
      <Card title="Festival Music & Playlist">
        <p className="muted">
          Devotional songs, pooja stotrams, procession audio, and announcements curated for the pandal.
        </p>

        <div className="playlist">
          {sortedTracks.map((track, index) => (
            <article className="track" key={track.id}>
              <span className="track-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="track-icon" aria-hidden="true">
                ▶
              </span>
              <div className="track-info">
                <b>{track.title}</b>
                <small>
                  {track.artist || 'Festival track'}
                  {track.language ? ` · ${track.language}` : ''}
                </small>
              </div>

              <a
                className="track-open"
                href={track.audio_url}
                target="_blank"
                rel="noreferrer"
                title="Play on external source"
              >
                Play ↗
              </a>

              {admin && (
                <RecordActions
                  record={track}
                  fields={trackFields}
                  onSave={(values) => handleUpdateTrack(track.id, values)}
                  onDelete={() => handleDeleteTrack(track.id)}
                  deleteTitle="Remove Song"
                  deleteMessage={`Remove "${track.title}" from the festival playlist?`}
                />
              )}
            </article>
          ))}
        </div>

        {!sortedTracks.length && (
          <Empty>
            Add the playlist links the committee wants during the celebration.
          </Empty>
        )}
      </Card>

      {admin && (
        <Card title="Add Playlist Track">
          <Form
            submit="Add Track"
            onSubmit={handleAddTrack}
            fields={trackFields}
          />
        </Card>
      )}
    </>
  )
}

