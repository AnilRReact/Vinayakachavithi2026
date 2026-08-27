import { useState } from 'react'
import { Button, ConfirmModal } from './ui'
import { EditRecordButton } from './EditRecordButton'

/**
 * High-contrast, visually distinct action buttons for table/card records (Fixes B-1).
 * Edit button has neutral bordered treatment; Delete button has soft red-tinted treatment.
 */
export function RecordActions({
  record,
  fields,
  onSave,
  onDelete,
  deleteTitle = 'Delete Record',
  deleteMessage = 'Are you sure you want to delete this record? This action cannot be undone.',
  extraActions,
  size = 'medium'
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className={`record-actions-group ${size}`}>
      {extraActions}
      {fields && onSave && (
        <EditRecordButton
          record={record}
          fields={fields}
          onSave={onSave}
          size={size}
        />
      )}
      {onDelete && (
        <>
          <Button
            type="button"
            kind="delete-action"
            onClick={() => setShowConfirm(true)}
            aria-label="Delete this entry"
            title="Delete this entry"
          >
            <span className="action-icon" aria-hidden="true">🗑</span>
            <span className="action-label">Delete</span>
          </Button>
          <ConfirmModal
            isOpen={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={async () => {
              await onDelete(record.id)
            }}
            title={deleteTitle}
            message={deleteMessage}
            confirmText="Delete"
            isDestructive={true}
          />
        </>
      )}
    </div>
  )
}

