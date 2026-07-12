import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { toPascalCase } from '@/utils/helpers'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import clsx from 'clsx'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Card, CardBody, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Spinner } from 'react-bootstrap'

import { type PipelineTaskType } from './data'
import DealFormModal from './DealFormModal'
import { PipelineProvider, usePipelineContext } from './usePipelineContext'
import { useDeals } from './useDeals'

export const variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'] as const

const PipelinePage = () => {
  const { sections, tasks, contactOptions, propertyOptions, loading, updateDealStage, createDeal, updateDeal, reload } = useDeals()
  const [showDealModal, setShowDealModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<PipelineTaskType | null>(null)
  const [createStageId, setCreateStageId] = useState<string | undefined>()

  const openCreate = (stageId?: string) => {
    setEditingDeal(null)
    setCreateStageId(stageId)
    setShowDealModal(true)
  }

  const openEdit = (task: PipelineTaskType) => {
    setEditingDeal(task)
    setShowDealModal(true)
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <PipelineProvider sectionsData={sections} tasksData={tasks} onTaskMoved={updateDealStage}>
      <div className="outlook-box kanban-app">
        <Card className="h-100 mb-0 flex-grow-1">
          <PipelineHeader onAddDeal={() => openCreate()} />
          <Board onAddTask={openCreate} onEditTask={openEdit} />
        </Card>
      </div>
      <DealFormModal
        show={showDealModal}
        onHide={() => setShowDealModal(false)}
        onSaved={reload}
        deal={editingDeal}
        defaultStageId={createStageId}
        stages={sections}
        contactOptions={contactOptions}
        propertyOptions={propertyOptions}
        onCreate={createDeal}
        onUpdate={updateDeal}
      />
    </PipelineProvider>
  )
}

export default PipelinePage

const PipelineHeader = ({ onAddDeal }: { onAddDeal: () => void }) => {
  return (
    <CardHeader className="d-flex border-light align-items-center gap-2">
      <div className="app-search d-none d-lg-block">
        <input type="search" className="form-control" placeholder="Buscar negociación..." />
        <Icon icon="search" className="app-search-icon text-muted" />
      </div>
      <Button variant="primary" className="ms-auto" onClick={onAddDeal}>
        <Icon icon="plus" className="fs-sm me-2" /> Nueva negociación
      </Button>
    </CardHeader>
  )
}

const Board = ({ onAddTask, onEditTask }: { onAddTask: (sectionId: string) => void; onEditTask: (task: PipelineTaskType) => void }) => {
  const { onDragEnd, sections, getAllTasksPerSection } = usePipelineContext()

  return (
    <CardBody className="p-0">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-content">
          {sections.map((section) => (
            <Droppable key={section.id} droppableId={section.id}>
              {(provided) => (
                <div className={`kanban-board bg-${section.variant} bg-opacity-10`} ref={provided.innerRef}>
                  <div className="kanban-item py-2 px-3 d-flex align-items-center">
                    <h5 className="m-0">
                      {section.title} ({getAllTasksPerSection(section.id).length})
                    </h5>
                    <Button className="ms-auto btn btn-sm btn-icon rounded-circle btn-primary" onClick={() => onAddTask(section.id)}>
                      <Icon icon="plus" />
                    </Button>
                  </div>
                  <SimpleBar className="kanban-board-group px-2">
                    <ul>
                      {getAllTasksPerSection(section.id).map((task, idx) => (
                        <Draggable draggableId={task.id} index={idx} key={task.id}>
                          {(provided) => (
                            <li className="kanban-item" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <TaskItem item={task} onEdit={onEditTask} />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  </SimpleBar>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </CardBody>
  )
}

const TaskItem = ({ item, onEdit }: { item: PipelineTaskType; onEdit: (task: PipelineTaskType) => void }) => {
  const { deleteTask } = usePipelineContext()
  return (
    <>
      <Card className="shadow mb-2">
        <CardBody>
          <div className="d-flex align-items-center mb-2">
            <div>
              <h5 className="mb-0 fw-semibold">
                <Link to={`/crm/negociaciones/${item.id}`} className="link-reset">
                  {item.title}
                </Link>
              </h5>
              <small className="text-muted">{item.company}</small>
            </div>
            <Dropdown className="ms-auto">
              <DropdownToggle className="btn btn-icon btn-sm drop-arrow-none btn-ghost-light text-muted content-none" type="button">
                <Icon icon="ellipsis-vertical" className="fs-xl" />
              </DropdownToggle>
              <DropdownMenu align="end">
                <DropdownItem onClick={() => onEdit(item)}>
                  <Icon icon="square-pen" className="me-2" />
                  Editar
                </DropdownItem>
                <DropdownItem className="text-danger" onClick={() => deleteTask(item.id)}>
                  <Icon icon="trash-2" className="me-2" />
                  Eliminar
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-1">
              <img src={item.user} className="rounded-circle avatar-xs" alt={item.userName} />
              <span className="fw-medium text-muted fs-sm">{item.userName}</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <Icon icon="calendar-clock" className={clsx('fs-lg', item.status === 'lost' ? 'text-danger' : item.status === 'won' ? 'text-success' : '')} />
              <h5 className="fs-base mb-0 fw-medium">{item.date}</h5>
            </div>
          </div>
          <div className="mt-2">
            <div className="d-flex justify-content-between align-items-center">
              {item.messages !== undefined && (
                <div className="d-flex align-items-center gap-2 fs-sm">
                  <span className="d-flex align-items-center gap-1">
                    <Icon icon="message-square" className="text-muted fs-lg" /> {item.messages}
                  </span>
                  {item.tasks && (
                    <span className="d-flex align-items-center gap-1">
                      <Icon icon="list-check" className="text-muted fs-lg" /> {item.tasks}
                    </span>
                  )}
                </div>
              )}

              {item.status && (
                <div className="d-flex align-items-center gap-2 fs-sm">
                  {item.status === 'won' ? <Icon icon="medal" className="text-success fs-lg" /> : <Icon icon="x" className="text-danger fs-lg" />}
                  {toPascalCase(item.status)}
                </div>
              )}
              <span className={clsx('fw-semibold', item.status === 'lost' ? 'text-danger' : '')}>${item.amount}</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
