import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import type { PipelineSectionType } from './data'

interface Props {
  show: boolean
  onHide: () => void
  onSaved: () => void
  stage?: PipelineSectionType | null
  onCreate: (name: string) => Promise<{ error?: string }>
  onUpdate: (stageId: string, name: string) => Promise<{ error?: string }>
}

const StageFormModal = ({ show, onHide, onSaved, stage, onCreate, onUpdate }: Props) => {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!show) return
    setErrorMessage('')
    setName(stage?.title || '')
  }, [show, stage])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      setErrorMessage('El nombre de la etapa es requerido.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const { error } = stage ? await onUpdate(stage.id, name.trim()) : await onCreate(name.trim())

    setSubmitting(false)

    if (error) {
      setErrorMessage(error)
      return
    }

    onSaved()
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide}>
      <ModalHeader closeButton>
        <ModalTitle as="h5">{stage ? 'Editar etapa' : 'Nueva etapa'}</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <div className="mb-0">
            <FormLabel>
              Nombre <span className="text-danger">*</span>
            </FormLabel>
            <FormControl required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onHide} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default StageFormModal
