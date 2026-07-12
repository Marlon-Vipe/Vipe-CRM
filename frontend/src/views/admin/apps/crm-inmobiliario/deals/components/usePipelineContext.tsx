import type { DropResult } from '@hello-pangea/dnd'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { type PipelineProviderProps, type PipelineSectionType, type PipelineTaskType, type PipelineType } from './data'

const PipelineContext = createContext<PipelineType | undefined>(undefined)

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

  useEffect(() => {
    setSections(sectionsData)
  }, [sectionsData])

  useEffect(() => {
    setTasks(tasksData)
  }, [tasksData])

  const getAllTasksPerSection = useCallback(
    (id: PipelineSectionType['id']) => {
      return tasks.filter((task) => task.sectionId == id)
    },
    [tasks]
  )

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

  return (
    <PipelineContext.Provider
      value={useMemo(
        () => ({
          sections,
          getAllTasksPerSection,
          onDragEnd,
        }),
        [sections, getAllTasksPerSection, onDragEnd]
      )}
    >
      {children}
    </PipelineContext.Provider>
  )
}

export { PipelineProvider, usePipelineContext }
