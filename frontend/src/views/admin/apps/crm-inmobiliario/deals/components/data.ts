import { type ChildrenType, type VariantType } from '@/types'
import { type DropResult } from '@hello-pangea/dnd'
import { type BaseSyntheticEvent } from 'react'
import { type Control } from 'react-hook-form'

export type PipelineProviderProps = {
  sectionsData: PipelineSectionType[]
  tasksData: PipelineTaskType[]
  onTaskMoved?: (taskId: PipelineTaskType['id'], newSectionId: PipelineSectionType['id']) => void
} & ChildrenType

export type PipelineDialogType = {
  showNewTaskModal: boolean
  showSectionModal: boolean
}

export type FormControlSubmitType = {
  control: Control<any>
  newRecord: (values: BaseSyntheticEvent) => void
  editRecord: (values: BaseSyntheticEvent) => void
  deleteRecord: (id: string) => void
}

export type PipelineType = {
  sections: PipelineSectionType[]
  activeSectionId: PipelineSectionType['id'] | undefined
  newTaskModal: {
    open: boolean
    toggle: (sectionId?: PipelineSectionType['id'], taskId?: PipelineTaskType['id']) => void
  }
  sectionModal: {
    open: boolean
    toggle: (sectionId?: PipelineSectionType['id']) => void
  }
  taskFormData: PipelineTaskType | undefined
  sectionFormData: PipelineSectionType | undefined
  taskForm: FormControlSubmitType
  sectionForm: FormControlSubmitType
  getAllTasksPerSection: (sectionId: PipelineSectionType['id']) => PipelineTaskType[]
  onDragEnd: (result: DropResult) => void
}

export type PipelineTaskType = {
  id: string
  sectionId: PipelineSectionType['id']
  title: string
  user: string
  userName: string
  company: string
  date: string
  messages?: number
  tasks?: number
  amount: number
  status?: 'won' | 'lost'
}

export type PipelineSectionType = {
  id: string
  title: string
  variant: VariantType
}

export type TaskFormValues = {
  title: string
  userName: string
  company: string
  amount: number
  status: 'lead' | 'negotiation' | 'won' | 'lost'
}
