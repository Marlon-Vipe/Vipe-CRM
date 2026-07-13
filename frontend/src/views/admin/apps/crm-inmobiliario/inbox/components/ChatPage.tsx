import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { generateInitials } from '@/utils/helpers'
import { Link } from 'react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Card, CardFooter, CardHeader, Form, FormControl, ListGroup, ListGroupItem, Offcanvas, Spinner } from 'react-bootstrap'
import ChatToolbar from './ChatToolbar'
import { CHANNEL_LABELS, type ConversationItem } from './data'
import { useConversations } from './useConversations'
import { useMessages } from './useMessages'

const formatTimestamp = (value: string | null) => {
  if (!value) return ''
  return new Date(value).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const ChatPage = () => {
  const [show, setShow] = useState(false)
  const { conversations, loading: loadingConversations } = useConversations()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  const currentConversation = conversations.find((c) => c.id === selectedId) || null
  const { messages, loading: loadingMessages, sending, sendMessage } = useMessages(selectedId)
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState('')

  useEffect(() => {
    setDraft('')
    setSendError('')
  }, [selectedId])

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    setSendError('')
    try {
      await sendMessage(content)
      setDraft('')
    } catch (error) {
      setSendError((error as Error).message)
    }
  }

  if (loadingConversations) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return <p className="text-muted text-center py-5">Todavía no hay conversaciones para tu agencia.</p>
  }

  return (
    <div className="outlook-box gap-1">
      <Offcanvas responsive="lg" show={show} onHide={() => setShow(!show)} className="outlook-left-menu outlook-left-menu-lg">
        <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} />
      </Offcanvas>

      <Card className="h-100 mb-0 rounded-start-0 flex-grow-1">
        <CardHeader className="card-bg">
          <div className="d-lg-none d-inline-flex gap-2">
            <button className="btn btn-default btn-icon" type="button" onClick={() => setShow(!show)}>
              <Icon icon="menu-4" className="fs-lg" />
            </button>
          </div>

          {currentConversation && (
            <div className="flex-grow-1">
              <h5 className="mb-1 lh-base fs-lg">
                {currentConversation.contactId ? (
                  <Link to={`/crm/contactos/${currentConversation.contactId}`} className="link-reset">
                    {currentConversation.contactName}
                  </Link>
                ) : (
                  currentConversation.contactName
                )}
              </h5>
              <p className="mb-0 lh-sm text-muted" style={{ paddingTop: '1px' }}>
                <Icon icon="circle" className={`me-1 ${currentConversation.status === 'abierta' ? 'text-success' : 'text-danger'}`} />
                {currentConversation.status === 'abierta' ? 'Abierta' : 'Cerrada'} · {CHANNEL_LABELS[currentConversation.channelType]}
              </p>
            </div>
          )}

          <ChatToolbar contactId={currentConversation?.contactId ?? null} />
        </CardHeader>

        <SimpleBar className="card-body pt-0 mb-5 pb-2" style={{ maxHeight: 'calc(100vh - 317px)' }}>
          {loadingMessages ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="sm" />
            </div>
          ) : messages.length === 0 ? (
            <div className="d-flex align-items-center justify-content-center my-5">
              <Icon icon="message-square-text" className="text-muted me-1 fs-1" />
              <span>No hay mensajes en esta conversación.</span>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`d-flex align-items-start gap-2 my-3 chat-item ${message.direction === 'saliente' ? 'text-end justify-content-end' : ''}`}
              >
                {message.direction === 'entrante' && currentConversation && (
                  <span className="avatar-sm flex-shrink-0">
                    <span className="avatar-title text-bg-primary fw-bold rounded-circle">{generateInitials(currentConversation.contactName)}</span>
                  </span>
                )}
                <div>
                  <div className={`chat-message py-2 px-3 rounded ${message.direction === 'saliente' ? 'bg-info-subtle' : 'bg-warning-subtle'}`}>
                    {message.content || <span className="text-muted fst-italic">Mensaje sin contenido de texto ({message.type})</span>}
                  </div>
                  <div className="text-muted d-inline-flex align-items-center gap-1 fs-xs mt-1">
                    <Icon icon="clock" /> {formatTimestamp(message.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </SimpleBar>

        <CardFooter className="bg-body-secondary border-top border-dashed border-bottom-0 position-absolute bottom-0 w-100">
          {sendError && (
            <Alert variant="danger" className="py-1 px-2 fs-xs mb-2" onClose={() => setSendError('')} dismissible>
              {sendError}
            </Alert>
          )}
          <Form onSubmit={handleSend} className="d-flex gap-2 align-items-center">
            <div className="app-search flex-grow-1">
              <FormControl
                type="text"
                className="py-2 bg-light-subtle border-light"
                placeholder="Escribe un mensaje..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={sending || !currentConversation}
              />
              <Icon icon="message-square-text" className="app-search-icon text-muted" />
            </div>
            <Button variant="primary" type="submit" disabled={sending || !draft.trim() || !currentConversation}>
              {sending ? 'Enviando...' : 'Enviar'} <Icon icon="send-horizontal" className="ms-1 fs-xl" />
            </Button>
          </Form>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ChatPage

const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: ConversationItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}) => {
  return (
    <Card className="h-100 mb-0 border-end-0 rounded-end-0">
      <CardHeader className="p-3 border-light card-bg d-block">
        <div className="app-search">
          <FormControl type="text" className="bg-light-subtle border-light" placeholder="Buscar conversación..." />
          <Icon icon="search" className="app-search-icon text-muted" />
        </div>
      </CardHeader>
      <SimpleBar className="card-body p-2" style={{ height: 'calc(100% - 100px)' }}>
        <ListGroup variant="flush" className="chat-list">
          {conversations.map((conversation) => (
            <ListGroupItem
              key={conversation.id}
              action
              className={`d-flex gap-2 justify-content-between ${conversation.id === selectedId ? 'active' : ''}`}
              onClick={() => onSelect(conversation.id)}
            >
              <span className="d-flex justify-content-start align-items-center gap-2 overflow-hidden">
                <span className="avatar avatar-sm flex-shrink-0">
                  <span className="avatar-title text-bg-primary fw-bold rounded-circle">{generateInitials(conversation.contactName)}</span>
                </span>
                <span className="overflow-hidden">
                  <span className="text-nowrap fw-semibold fs-base mb-0 lh-base">{conversation.contactName}</span>
                  {conversation.lastMessage && <span className="text-muted d-block fs-xs mb-0 text-truncate">{conversation.lastMessage}</span>}
                </span>
              </span>
              <span className="d-flex flex-column gap-1 justify-content-center flex-shrink-0 align-items-end">
                <span className="text-muted fs-xs">{formatTimestamp(conversation.lastMessageAt)}</span>
                <span className="badge text-bg-light fs-xxs">{CHANNEL_LABELS[conversation.channelType]}</span>
              </span>
            </ListGroupItem>
          ))}
        </ListGroup>
      </SimpleBar>
    </Card>
  )
}
