import React, { useState } from 'react'
import { CommitteeRoster } from './CommitteeRoster'
import { VolunteerManager } from './VolunteerManager'
import { NoticeBoard } from './NoticeBoard'

export function Community({ data, admin, add, update, remove }) {
  const [subTab, setSubTab] = useState('committee')

  const settings = data.settings?.[0] || {}
  const committeeMembers = data.committee_members || []
  const volunteers = data.volunteers || []
  const notices = data.notices || []

  return (
    <div className="community-feature-container">
      {/* Sub-navigation Pills */}
      <div className="sub-nav-bar">
        <button
          type="button"
          className={`sub-nav-pill ${subTab === 'committee' ? 'active' : ''}`}
          onClick={() => setSubTab('committee')}
        >
          👥 కమిటీ సభ్యులు (Committee) <span className="pill-count">{committeeMembers.length}</span>
        </button>
        <button
          type="button"
          className={`sub-nav-pill ${subTab === 'volunteers' ? 'active' : ''}`}
          onClick={() => setSubTab('volunteers')}
        >
          🤝 వాలంటీర్లు (Volunteers) <span className="pill-count">{volunteers.length}</span>
        </button>
        <button
          type="button"
          className={`sub-nav-pill ${subTab === 'notices' ? 'active' : ''}`}
          onClick={() => setSubTab('notices')}
        >
          📢 ప్రకటనలు (Notices) <span className="pill-count">{notices.length}</span>
        </button>
      </div>

      {/* Render Active Sub-feature */}
      {subTab === 'committee' && (
        <CommitteeRoster
          members={committeeMembers}
          settings={settings}
          admin={admin}
          add={add}
          update={update}
          remove={remove}
        />
      )}

      {subTab === 'volunteers' && (
        <VolunteerManager
          volunteers={volunteers}
          settings={settings}
          admin={admin}
          add={add}
          update={update}
          remove={remove}
        />
      )}

      {subTab === 'notices' && (
        <NoticeBoard
          notices={notices}
          admin={admin}
          add={add}
          update={update}
          remove={remove}
        />
      )}
    </div>
  )
}
