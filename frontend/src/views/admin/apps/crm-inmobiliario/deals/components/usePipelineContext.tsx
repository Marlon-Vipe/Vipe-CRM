import { VariantType } from '@/types'
import type { DropResult } from '@hello-pangea/dnd'
import { yupResolver } from '@hookform/resolvers/yup'
import { createContext, startTransition, use, useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { type PipelineProviderProps, type PipelineSectionType, type PipelineTaskType, type PipelineType } from './data'

const PipelineContext = createContext<PipelineType | undefined>(undefined)

export const PipelineSectionSchema = yup.object({
  sectionTitle: yup.string().required('Section title is required'),
  sectionVariant: yup.mixed<VariantType>().required('Section variant is required'),
})

export type SectionFormFields = yup.InferType<typeof PipelineSectionSchema>

const usePipelineContext = () => {
  const context = use(PipelineContext)
  if (!context) {
    throw new Error('usePipelineContext can only be used within PipelineProvider')
  }
  return context
}

const PipelineProvider = ({ children, tasksData, sectionsData, onTaskMoved }: PipelineProviderProps) => {
  const [sections, setSections] = useState<PipelineSectionType[]>(sectionsData)
  const [tasks, setTasks] = useState<PipelineTaskType[]>(tasksData)
  const [activeSectionId, setActiveSectionId] = useState<PipelineSectionType['id']>()
  const [sectionFormData, setSectionFormData] = useState<PipelineSectionType>()
  const [showSectionModal, setShowSectionModal] = useState(false)

  useEffect(() => {
    setSections(sectionsData)
  }, [sectionsData])

  useEffect(() => {
    setTasks(tasksData)
  }, [tasksData])

  const {
    control: sectionControl,
    handleSubmit: sectionHandleSubmit,
    reset: sectionReset,
  } = useForm({
    resolver: yupResolver(PipelineSectionSchema),
  })

  const emptySectionForm = useCallback(() => {
    sectionReset({ sectionTitle: '' })
  }, [sectionReset])

  const toggleSectionModal = (sectionId?: PipelineSectionType['id']) => {
    if (sectionId) {
      const foundSection = sections.find((section) => section.id === sectionId)
      if (foundSection) {
        startTransition(() => {
          setSectionFormData(foundSection)
        })
        startTransition(() => {
          setActiveSectionId(foundSection.id)
        })
        sectionReset({
          sectionTitle: foundSection.title,
        })
      }
    }
    if (showSectionModal) emptySectionForm()
    startTransition(() => {
      setShowSectionModal(!showSectionModal)
    })
  }

  const getAllTasksPerSection = useCallback(
    (id: PipelineSectionType['id']) => {
      return tasks.filter((task) => task.sectionId == id)
    },
    [tasks]
  )

  const deleteTask = (taskId: PipelineTaskType['id']) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result
    if (!destination) return

    const taskIndex = tasks.findIndex((task) => String(task.id) === String(draggableId))
    if (taskIndex === -1) return

    const task = tasks[taskIndex]

    let newTasks = tasks.filter((t) => String(t.id) !== String(draggableId))

    const updatedTask = { ...task, sectionId: destination.droppableId }

    let destIdx = 0
    let count = 0
    for (let i = 0; i < newTasks.length; i++) {
      if (newTasks[i].sectionId === destination.droppableId) {
        if (count === destination.index) {
          destIdx = i
          break
        }
        count++
      }
      if (i === newTasks.length - 1) {
        destIdx = newTasks.length
      }
    }

    newTasks = [...newTasks.slice(0, destIdx), updatedTask, ...newTasks.slice(destIdx)]

    setTasks(newTasks)

    if (task.sectionId !== destination.droppableId) {
      onTaskMoved?.(task.id, destination.droppableId)
    }
  }

  const handleNewSection = sectionHandleSubmit((values: SectionFormFields) => {
    const section: PipelineSectionType = {
      // TODO test, test when array is empty
      id: Number(sections.slice(-1)[0].id) + 1 + '',
      title: values.sectionTitle,
      variant: values.sectionVariant,
    }
    setSections([...sections, section])
    startTransition(() => {
      toggleSectionModal()
    })
    sectionReset()
  })

  const handleEditSection = sectionHandleSubmit((values: SectionFormFields) => {
    if (activeSectionId) {
      const newSection = {
        id: activeSectionId,
        title: values.sectionTitle,
        variant: values.sectionVariant,
      }
      setSections(
        sections.map((section) => {
          return section.id === activeSectionId ? newSection : section
        })
      )
    }
    startTransition(() => {
      toggleSectionModal()
    })
    sectionReset()
  })

  const handleDeleteSection = (sectionId: PipelineSectionType['id']) => {
    setSections(sections.filter((section) => section.id !== sectionId))
  }

  return (
    <PipelineContext.Provider
      value={useMemo(
        () => ({
          sections,
          activeSectionId,
          sectionFormData,
          sectionModal: {
            open: showSectionModal,
            toggle: toggleSectionModal,
          },
          sectionForm: {
            control: sectionControl,
            newRecord: handleNewSection,
            editRecord: handleEditSection,
            deleteRecord: handleDeleteSection,
          },
          getAllTasksPerSection,
          onDragEnd,
          deleteTask,
        }),
        [
          sections,
          activeSectionId,
          sectionFormData,
          showSectionModal,
          toggleSectionModal,
          sectionControl,
          handleNewSection,
          handleEditSection,
          handleDeleteSection,
          getAllTasksPerSection,
          onDragEnd,
          deleteTask,
        ]
      )}
    >
      {children}
    </PipelineContext.Provider>
  )
}

export { PipelineProvider, usePipelineContext }
