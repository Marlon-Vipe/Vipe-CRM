import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert, Button, Card, CardBody, CardHeader, Col, Form, FormControl, FormLabel, FormSelect, Row, Spinner } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

import { getStatusLabels, getTypeLabels } from '../components/data'

interface ExistingImage {
  id: string
  url: string
}

interface FormValues {
  title: string
  type: 'venta' | 'alquiler'
  status: 'disponible' | 'reservada' | 'vendida' | 'alquilada'
  price: string
  currency: string
  address: string
  sector: string
  city: string
  bedrooms: string
  bathrooms: string
  areaM2: string
}

const EMPTY_FORM: FormValues = {
  title: '',
  type: 'venta',
  status: 'disponible',
  price: '',
  currency: 'DOP',
  address: '',
  sector: '',
  city: '',
  bedrooms: '',
  bathrooms: '',
  areaM2: '',
}

const Page = () => {
  const { t } = useTranslation()
  const statusLabels = getStatusLabels(t)
  const typeLabels = getTypeLabels(t)
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const { tenantId } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormValues>(EMPTY_FORM)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadProperty = useCallback(async () => {
    if (!tenantId || !id) return
    setLoading(true)

    const [{ data: property }, { data: images }] = await Promise.all([
      supabase
        .from('properties')
        .select('title, type, status, price, currency, address, sector, city, bedrooms, bathrooms, area_m2')
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .maybeSingle(),
      supabase.from('property_images').select('id, url').eq('tenant_id', tenantId).eq('property_id', id).order('sort_order'),
    ])

    if (property) {
      setForm({
        title: property.title,
        type: property.type,
        status: property.status,
        price: property.price != null ? String(property.price) : '',
        currency: property.currency,
        address: property.address || '',
        sector: property.sector || '',
        city: property.city || '',
        bedrooms: property.bedrooms != null ? String(property.bedrooms) : '',
        bathrooms: property.bathrooms != null ? String(property.bathrooms) : '',
        areaM2: property.area_m2 != null ? String(property.area_m2) : '',
      })
    }
    setExistingImages(images || [])
    setLoading(false)
  }, [tenantId, id])

  useEffect(() => {
    if (isEditing) loadProperty()
  }, [isEditing, loadProperty])

  const handleDeleteExistingImage = async (image: ExistingImage) => {
    if (!tenantId) return
    if (!window.confirm(t('crm.properties.form.deletePhotoConfirm'))) return
    const { error } = await supabase.from('property_images').delete().eq('id', image.id).eq('tenant_id', tenantId)
    if (error) {
      setErrorMessage(error.message)
      return
    }
    setExistingImages((prev) => prev.filter((img) => img.id !== image.id))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!tenantId) return
    if (!form.title.trim()) {
      setErrorMessage(t('crm.properties.form.titleRequired'))
      return
    }
    const numericFields: [string, string][] = [
      [t('crm.properties.form.price'), form.price],
      [t('crm.properties.form.bedrooms'), form.bedrooms],
      [t('crm.properties.form.bathrooms'), form.bathrooms],
      [t('crm.properties.form.areaShort'), form.areaM2],
    ]
    const invalidField = numericFields.find(([, value]) => value && Number.isNaN(Number(value)))
    if (invalidField) {
      setErrorMessage(t('crm.properties.form.invalidNumber', { field: invalidField[0] }))
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const payload = {
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      price: form.price ? Number(form.price) : null,
      currency: form.currency,
      address: form.address.trim() || null,
      sector: form.sector.trim() || null,
      city: form.city.trim() || null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      area_m2: form.areaM2 ? Number(form.areaM2) : null,
    }

    let propertyId = id

    if (isEditing) {
      const { error } = await supabase.from('properties').update(payload).eq('id', id).eq('tenant_id', tenantId)
      if (error) {
        setSubmitting(false)
        setErrorMessage(error.message)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('properties')
        .insert({ ...payload, tenant_id: tenantId })
        .select('id')
        .single()
      if (error || !data) {
        setSubmitting(false)
        setErrorMessage(error?.message || t('crm.properties.form.createError'))
        return
      }
      propertyId = data.id
    }

    let uploadFailures = 0
    if (newFiles.length > 0 && propertyId) {
      let sortOrder = existingImages.length
      for (const file of newFiles) {
        const path = `${tenantId}/${propertyId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('property-images').upload(path, file)
        if (uploadError) {
          uploadFailures += 1
          setErrorMessage(`${t('crm.properties.form.uploadFailed', { fileName: file.name })} ${uploadError.message}`)
          continue
        }
        const { data: publicUrlData } = supabase.storage.from('property-images').getPublicUrl(path)
        await supabase.from('property_images').insert({
          tenant_id: tenantId,
          property_id: propertyId,
          url: publicUrlData.publicUrl,
          sort_order: sortOrder,
        })
        sortOrder += 1
      }
    }

    setSubmitting(false)

    if (uploadFailures > 0) {
      // Se queda en la página para que el usuario vea el error de carga —
      // la propiedad ya se guardó, pero no todas las fotos.
      setNewFiles([])
      if (!isEditing && propertyId) navigate(`/crm/propiedades/${propertyId}/editar`, { replace: true })
      return
    }

    navigate('/crm/propiedades')
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <>
      <PageBreadcrumb title={isEditing ? t('crm.properties.form.editTitle') : t('crm.properties.form.createTitle')} subtitle={t('nav.properties')} />
      <Row>
        <Col lg={8}>
          <Card>
            <CardHeader>
              <h5 className="mb-0">{t('crm.properties.form.propertyData')}</h5>
            </CardHeader>
            <Form onSubmit={handleSubmit}>
              <CardBody>
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                <Row>
                  <Col md={12} className="mb-3">
                    <FormLabel>
                      {t('crm.properties.form.titleLabel')} <span className="text-danger">*</span>
                    </FormLabel>
                    <FormControl required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <FormLabel>{t('crm.properties.form.type')}</FormLabel>
                    <FormSelect value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FormValues['type'] })}>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </FormSelect>
                  </Col>
                  <Col md={6} className="mb-3">
                    <FormLabel>{t('crm.properties.form.status')}</FormLabel>
                    <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormValues['status'] })}>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </FormSelect>
                  </Col>
                  <Col md={6} className="mb-3">
                    <FormLabel>{t('crm.properties.form.price')}</FormLabel>
                    <FormControl type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <FormLabel>{t('crm.properties.form.currency')}</FormLabel>
                    <FormSelect value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                      <option value="DOP">DOP</option>
                      <option value="USD">USD</option>
                    </FormSelect>
                  </Col>
                  <Col md={12} className="mb-3">
                    <FormLabel>{t('crm.properties.form.address')}</FormLabel>
                    <FormControl value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <FormLabel>{t('crm.properties.form.sector')}</FormLabel>
                    <FormControl value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <FormLabel>{t('crm.properties.form.city')}</FormLabel>
                    <FormControl value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <FormLabel>{t('crm.properties.form.bedrooms')}</FormLabel>
                    <FormControl type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <FormLabel>{t('crm.properties.form.bathrooms')}</FormLabel>
                    <FormControl type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <FormLabel>{t('crm.properties.form.area')}</FormLabel>
                    <FormControl type="number" min="0" value={form.areaM2} onChange={(e) => setForm({ ...form, areaM2: e.target.value })} />
                  </Col>
                </Row>
              </CardBody>
              <CardHeader className="border-top">
                <h5 className="mb-0">{t('crm.properties.form.photos')}</h5>
              </CardHeader>
              <CardBody>
                {existingImages.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {existingImages.map((image) => (
                      <div key={image.id} className="position-relative">
                        <img src={image.url} alt="" style={{ width: 96, height: 96, objectFit: 'cover' }} className="rounded" />
                        <button
                          type="button"
                          className="btn btn-danger btn-icon btn-sm position-absolute top-0 end-0"
                          style={{ transform: 'translate(30%, -30%)' }}
                          onClick={() => handleDeleteExistingImage(image)}
                        >
                          <Icon icon="x" className="fs-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <FormControl
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setNewFiles(Array.from((e.target as HTMLInputElement).files || []))}
                />
                {newFiles.length > 0 && (
                  <p className="text-muted fs-xs mt-2 mb-0">{t('crm.properties.form.newFilesSelected', { count: newFiles.length })}</p>
                )}
              </CardBody>
              <CardBody className="d-flex justify-content-end gap-2 border-top">
                <Button variant="light" type="button" onClick={() => navigate('/crm/propiedades')}>
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? t('common.saving') : t('common.save')}
                </Button>
              </CardBody>
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
