import { type ChildrenType, type VariantType } from '@/types'
import { type DropResult } from '@hello-pangea/dnd'

export type PipelineProviderProps = {
  sectionsData: PipelineSectionType[]
  tasksData: PipelineTaskType[]
  onTaskMoved?: (taskId: PipelineTaskType['id'], newSectionId: PipelineSectionType['id']) => void
} & ChildrenType

export type PipelineType = {
  sections: PipelineSectionType[]
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
