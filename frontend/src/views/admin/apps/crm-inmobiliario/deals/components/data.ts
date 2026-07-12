import { type ChildrenType, type VariantType } from '@/types'
import { type DropResult } from '@hello-pangea/dnd'
import { type BaseSyntheticEvent } from 'react'
import { type Control } from 'react-hook-form'

export type PipelineProviderProps = {
  sectionsData: PipelineSectionType[]
  tasksData: PipelineTaskType[]
  onTaskMoved?: (taskId: PipelineTaskType['id'], newSectionId: PipelineSectionType['id']) => void
} & ChildrenType

export type FormControlSubmitType = {
  control: Control<any>
  newRecord: (values: BaseSyntheticEvent) => void
  editRecord: (values: BaseSyntheticEvent) => void
  deleteRecord: (id: string) => void
}

export type PipelineType = {
  sections: PipelineSectionType[]
  activeSectionId: PipelineSectionType['id'] | undefined
  sectionModal: {
    open: boolean
    toggle: (sectionId?: PipelineSectionType['id']) => void
  }
  sectionFormData: PipelineSectionType | undefined
  sectionForm: FormControlSubmitType
  getAllTasksPerSection: (sectionId: PipelineSectionType['id']) => PipelineTaskType[]
  onDragEnd: (result: DropResult) => void
  deleteTask: (taskId: PipelineTaskType['id']) => void
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
  contactId: string
  propertyId: string | null
  valueEstimate: number | null
  expectedCloseDate: string | null
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
