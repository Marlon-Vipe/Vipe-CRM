import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Form, FormControl, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'

import type { PipelineSectionType, PipelineTaskType } from './data'
import type { DealContactOption, DealFormInput, DealPropertyOption } from './useDeals'

interface DealFormValues {
  id?: string
  contactId: string
  propertyId: string
  stageId: string
  valueEstimate: string
  expectedCloseDate: string
}

const emptyForm = (defaultStageId?: string): DealFormValues => ({
  contactId: '',
  propertyId: '',
  stageId: defaultStageId || '',
  valueEstimate: '',
  expectedCloseDate: '',
})

interface Props {
  show: boolean
  onHide: () => void
  onSaved: () => void
  deal?: PipelineTaskType | null
  defaultStageId?: string
  stages: PipelineSectionType[]
  contactOptions: DealContactOption[]
  propertyOptions: DealPropertyOption[]
  onCreate: (input: DealFormInput) => Promise<{ error?: string }>
  onUpdate: (dealId: string, input: DealFormInput) => Promise<{ error?: string }>
}

const DealFormModal = ({
  show,
  onHide,
  onSaved,
  deal,
  defaultStageId,
  stages,
  contactOptions,
  propertyOptions,
  onCreate,
  onUpdate,
}: Props) => {
  const [form, setForm] = useState<DealFormValues>(emptyForm(defaultStageId))
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!show) return
    setErrorMessage('')
    if (deal) {
      setForm({
        id: deal.id,
        contactId: deal.contactId,
        propertyId: deal.propertyId || '',
        stageId: deal.sectionId,
        valueEstimate: deal.valueEstimate != null ? String(deal.valueEstimate) : '',
        expectedCloseDate: deal.expectedCloseDate || '',
      })
    } else {
      setForm(emptyForm(defaultStageId))
    }
  }, [show, deal, defaultStageId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.contactId || !form.stageId) {
      setErrorMessage('El contacto y la etapa son requeridos.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const input: DealFormInput = {
      contactId: form.contactId,
      propertyId: form.propertyId || null,
      stageId: form.stageId,
      valueEstimate: form.valueEstimate.trim() ? Number(form.valueEstimate) : null,
      expectedCloseDate: form.expectedCloseDate || null,
    }

    const { error } = form.id ? await onUpdate(form.id, input) : await onCreate(input)

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
        <ModalTitle as="h5">{form.id ? 'Editar negociación' : 'Nueva negociación'}</ModalTitle>
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <div className="mb-3">
            <FormLabel>
              Contacto <span className="text-danger">*</span>
            </FormLabel>
            <FormSelect required value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}>
              <option value="">Selecciona un contacto</option>
              {contactOptions.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="mb-3">
            <FormLabel>Propiedad</FormLabel>
            <FormSelect value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
              <option value="">Sin propiedad asociada</option>
              {propertyOptions.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="mb-3">
            <FormLabel>
              Etapa <span className="text-danger">*</span>
            </FormLabel>
            <FormSelect required value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })}>
              <option value="">Selecciona una etapa</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.title}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="mb-3">
            <FormLabel>Valor estimado (RD$)</FormLabel>
            <FormControl
              type="number"
              min="0"
              value={form.valueEstimate}
              onChange={(e) => setForm({ ...form, valueEstimate: e.target.value })}
            />
          </div>
          <div className="mb-0">
            <FormLabel>Fecha estimada de cierre</FormLabel>
            <FormControl
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
            />
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

export default DealFormModal
