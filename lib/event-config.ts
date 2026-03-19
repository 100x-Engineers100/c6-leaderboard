export const VALID_EVENT_TYPES = [
  'assignment_1',
  'assignment_2',
  'assignment_3',
  'assignment_4',
  'midcapstone',
  'hackathon_1',
  'final_capstone',
] as const

export type EventType = (typeof VALID_EVENT_TYPES)[number]

export const EVENT_CONFIG: Record<EventType, { label: string; hint: string }> = {
  assignment_1:   { label: 'Assignment 1',   hint: 'Edmingle export CSV' },
  assignment_2:   { label: 'Assignment 2',   hint: 'Edmingle export CSV' },
  assignment_3:   { label: 'Assignment 3',   hint: 'Edmingle export CSV' },
  assignment_4:   { label: 'Assignment 4',   hint: 'Edmingle export CSV' },
  midcapstone:    { label: 'Mid Capstone',   hint: 'Edmingle export CSV (base 30 + marks)' },
  hackathon_1:    { label: 'Mini Hackathon', hint: 'Tally evaluation CSV' },
  final_capstone: { label: 'Final Capstone', hint: 'Team formation submission CSV' },
}

export function isValidEventType(s: string): s is EventType {
  return (VALID_EVENT_TYPES as readonly string[]).includes(s)
}
