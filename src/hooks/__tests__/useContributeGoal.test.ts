import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rupeesToPaise } from '@/lib/currency'

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

// Mock toast
vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock goals server action
const mockContributeGoalAction = vi.fn()
vi.mock('@/lib/actions/goals', () => ({
  contributeGoalAction: (...args: any[]) => mockContributeGoalAction(...args),
}))

// Mock react-query
const mockInvalidateQueries = vi.fn()
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
}

vi.mock('@tanstack/react-query', () => ({
  useMutation: (config: Record<string, unknown>) => {
    // Expose the config so tests can invoke mutationFn directly
    return {
      mutationFn: config.mutationFn,
      onSuccess: config.onSuccess,
      onError: config.onError,
      _config: config,
    }
  },
  useQueryClient: () => mockQueryClient,
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHook = Record<string, any>

import { useContributeGoal } from '../useContributeGoal'
import { toast } from '@/components/ui/toast'

describe('useContributeGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls contributeGoalAction with correct paise value (not raw rupees)', async () => {
    mockContributeGoalAction.mockResolvedValue({ id: 'goal-1', current_amount: 15000 })

    const hook = useContributeGoal() as unknown as AnyHook
    await hook.mutationFn({ id: 'goal-1', amount: 150 })

    expect(mockContributeGoalAction).toHaveBeenCalledWith({
      id: 'goal-1',
      amount: rupeesToPaise(150), // 15000 paise, not 150
    })
    expect(mockContributeGoalAction).toHaveBeenCalledTimes(1)
  })

  it('calls queryClient.invalidateQueries with ["goals"] on success', () => {
    const hook = useContributeGoal() as unknown as AnyHook
    hook.onSuccess()

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['goals'] })
  })

  it('calls toast.error on action failure', () => {
    const hook = useContributeGoal() as unknown as AnyHook
    const error = new Error('DB connection failed')
    hook.onError(error)

    expect(toast.error).toHaveBeenCalledWith('Failed to update goal: DB connection failed')
  })

  it('invokes contributeGoalAction directly (confirms single server action execution)', async () => {
    mockContributeGoalAction.mockResolvedValue({ id: 'goal-1', current_amount: 25000 })

    const hook = useContributeGoal() as unknown as AnyHook
    await hook.mutationFn({ id: 'goal-1', amount: 250 })

    expect(mockContributeGoalAction).toHaveBeenCalledTimes(1)
    expect(mockContributeGoalAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'goal-1' }))
  })

  it('throws when contributeGoalAction rejects with an error', async () => {
    const actionError = new Error('Goal not found or unauthorized')
    mockContributeGoalAction.mockRejectedValue(actionError)

    const hook = useContributeGoal() as unknown as AnyHook

    await expect(hook.mutationFn({ id: 'bad-id', amount: 100 })).rejects.toThrow('Goal not found or unauthorized')
  })

  it('shows specific toast "Amount exceeds the remaining goal balance." when action throws the overcontribution error message', () => {
    const hook = useContributeGoal() as unknown as AnyHook
    const error = { message: 'Contribution would exceed goal target' }
    hook.onError(error)

    expect(toast.error).toHaveBeenCalledWith('Amount exceeds the remaining goal balance.')
    expect(toast.error).not.toHaveBeenCalledWith(expect.stringContaining('Failed to update goal'))
  })

  it('shows generic toast.error for all other action errors', () => {
    const hook = useContributeGoal() as unknown as AnyHook
    const error = { message: 'Some unexpected database error' }
    hook.onError(error)

    expect(toast.error).toHaveBeenCalledWith('Failed to update goal: Some unexpected database error')
  })
})
