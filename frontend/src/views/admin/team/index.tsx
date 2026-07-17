import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'
import { Alert, Badge, Button, Card, CardHeader, Col, ListGroup, ListGroupItem, Row, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { useTeam } from './components/useTeam'
import InviteFormModal from './components/InviteFormModal'

const Page = () => {
  const { t } = useTranslation()
  const { role: myRole, tenantId } = useAuth()
  const { members, invitations, loading, error: loadError, reload } = useTeam()
  const [showInvite, setShowInvite] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const canManageTeam = myRole === 'owner' || myRole === 'admin'

  const copyInviteLink = async (token: string, id: string) => {
    const link = `${window.location.origin}/auth/sign-up?invite=${token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000)
  }

  const handleRevoke = async (invitationId: string) => {
    if (!tenantId) return
    if (!window.confirm(t('team.revokeConfirm'))) return
    const { error } = await supabase.from('invitations').delete().eq('id', invitationId).eq('tenant_id', tenantId)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    reload()
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (loadError) {
    return (
      <>
        <PageBreadcrumb title={t('nav.team')} subtitle={t('nav.crmGroup')} />
        <div className="text-center py-5">
          <p className="text-danger mb-3">{loadError}</p>
          <Button variant="primary" onClick={reload}>
            {t('common.retry')}
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title={t('nav.team')} subtitle={t('nav.crmGroup')} />

      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Row>
        <Col lg={6}>
          <Card>
            <CardHeader>
              <h5 className="mb-0">{t('team.membersHeader', { count: members.length })}</h5>
            </CardHeader>
            <ListGroup variant="flush">
              {members.map((member) => (
                <ListGroupItem key={member.userId} className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 fw-medium">{member.fullName || member.email}</p>
                    <p className="mb-0 text-muted fs-xs">{member.email}</p>
                  </div>
                  <Badge className="text-bg-light">{t(`common.roles.${member.role}`)}</Badge>
                </ListGroupItem>
              ))}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('team.pendingInvitationsHeader', { count: invitations.length })}</h5>
              {canManageTeam && (
                <Button size="sm" variant="primary" onClick={() => setShowInvite(true)}>
                  <Icon icon="plus" className="fs-sm me-1" /> {t('team.inviteAgent')}
                </Button>
              )}
            </CardHeader>
            <ListGroup variant="flush">
              {invitations.length === 0 && <ListGroupItem className="text-muted">{t('team.noPendingInvitations')}</ListGroupItem>}
              {invitations.map((invitation) => (
                <ListGroupItem key={invitation.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 fw-medium">{invitation.email}</p>
                    <p className="mb-0 text-muted fs-xs">{t(`common.roles.${invitation.role}`)}</p>
                  </div>
                  {canManageTeam && (
                    <div className="d-flex gap-1">
                      <Button size="sm" variant="light" onClick={() => copyInviteLink(invitation.token, invitation.id)}>
                        <Icon icon={copiedId === invitation.id ? 'check' : 'link'} className="fs-sm me-1" />
                        {copiedId === invitation.id ? t('team.copied') : t('team.copyLink')}
                      </Button>
                      <button type="button" className="btn btn-icon btn-sm btn-ghost-light text-muted" onClick={() => handleRevoke(invitation.id)}>
                        <Icon icon="trash-2" className="fs-sm" />
                      </button>
                    </div>
                  )}
                </ListGroupItem>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <InviteFormModal show={showInvite} onHide={() => setShowInvite(false)} onSaved={reload} />
    </>
  )
}

export default Page
