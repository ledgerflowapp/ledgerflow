import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderToString } from "react-dom/server"
import React, { act } from "react"
import { createRoot, Root } from "react-dom/client"
import { ContactReconciliationWizard } from "@/components/contacts/ContactReconciliationWizard"
import { toast } from "@/components/ui/toast"

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock("@/components/ui/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("@/lib/actions/groups", () => ({
  requestGroupGhostMerge: vi.fn().mockResolvedValue({
    success: true,
    requestId: "req-mock-123",
    groupId: "group-1",
  }),
}))

const mockContacts = [
  { id: "contact-1", name: "Alice Smith", phone: "+1555123456", email: "alice@example.com" },
  { id: "contact-2", name: "Bob Jones", phone: "+1555987654", email: "bob@example.com" },
]

const mockGhosts = [
  {
    ghostMemberId: "ghost-101",
    groupId: "group-1",
    groupName: "Summer Trip 2026",
    ghostName: "Alice (Ghost)",
    adminId: "admin-user-1",
  },
  {
    ghostMemberId: "ghost-102",
    groupId: "group-2",
    groupName: "Office Lunch Club",
    ghostName: "Bob J.",
    adminId: "admin-user-2",
  },
]

describe("ContactReconciliationWizard Static Server Rendering", () => {
  it("renders step 1 with unregistered contact selection and progress", () => {
    const html = renderToString(
      <ContactReconciliationWizard
        unregisteredContacts={mockContacts}
        candidateGhostMembers={mockGhosts}
        targetUserId="user-me"
      />
    )

    expect(html).toContain("Select Unregistered Contact")
    expect(html).toContain("Alice Smith")
    expect(html).toContain("Bob Jones")
    expect(html).toContain("Step")
    expect(html).toContain("of 3")
  })
})

describe("ContactReconciliationWizard Step Navigation & Submission", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.clearAllMocks()
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it("navigates through steps 1, 2, and 3 correctly", async () => {
    await act(async () => {
      root.render(
        <ContactReconciliationWizard
          unregisteredContacts={mockContacts}
          candidateGhostMembers={mockGhosts}
          targetUserId="user-me"
        />
      )
    })

    // Step 1 check
    expect(container.textContent).toContain("Select Unregistered Contact")
    expect(container.textContent).toContain("Step 1 of 3")

    // Select first contact
    const choices = container.querySelectorAll('[data-slot="questionnaire-choice"]')
    expect(choices.length).toBeGreaterThan(0)
    
    await act(async () => {
      (choices[0] as HTMLElement).click()
    })

    // Click Next to Step 2
    const nextBtn1 = container.querySelector('[data-slot="questionnaire-next"]') as HTMLButtonElement
    expect(nextBtn1).not.toBeNull()

    await act(async () => {
      nextBtn1.click()
    })

    // Step 2 check
    expect(container.textContent).toContain("Verified Identity Matching")
    expect(container.textContent).toContain("Step 2 of 3")

    // Click Previous back to Step 1
    const prevBtn = container.querySelector('[data-slot="questionnaire-previous"]') as HTMLButtonElement
    await act(async () => {
      prevBtn.click()
    })
    expect(container.textContent).toContain("Select Unregistered Contact")

    // Go back to Step 2
    await act(async () => {
      nextBtn1.click()
    })

    // Click Next to Step 3
    const nextBtn2 = container.querySelector('[data-slot="questionnaire-next"]') as HTMLButtonElement
    await act(async () => {
      nextBtn2.click()
    })

    // Step 3 check
    expect(container.textContent).toContain("Claim Group Ghost Member")
    expect(container.textContent).toContain("Step 3 of 3")
    expect(container.textContent).toContain("Summer Trip 2026")
  })

  it("submits ghost member claim, invokes requestGroupGhostMerge, shows toast.success, and calls onComplete", async () => {
    const onRequestMergeMock = vi.fn().mockResolvedValue({
      success: true,
      requestId: "req-test-999",
    })
    const onCompleteMock = vi.fn()

    await act(async () => {
      root.render(
        <ContactReconciliationWizard
          unregisteredContacts={mockContacts}
          candidateGhostMembers={mockGhosts}
          targetUserId="user-me"
          onRequestMerge={onRequestMergeMock}
          onComplete={onCompleteMock}
        />
      )
    })

    // Step 1: Select contact 1
    const choices1 = container.querySelectorAll('[data-slot="questionnaire-choice"]')
    await act(async () => {
      (choices1[0] as HTMLElement).click()
    })

    // Move to Step 2
    const nextBtn1 = container.querySelector('[data-slot="questionnaire-next"]') as HTMLButtonElement
    await act(async () => {
      nextBtn1.click()
    })

    // Move to Step 3
    const nextBtn2 = container.querySelector('[data-slot="questionnaire-next"]') as HTMLButtonElement
    await act(async () => {
      nextBtn2.click()
    })

    // Step 3: Select ghost member 1
    const choices3 = container.querySelectorAll('[data-slot="questionnaire-choice"]')
    expect(choices3.length).toBeGreaterThan(0)
    await act(async () => {
      (choices3[0] as HTMLElement).click()
    })

    // Submit form
    const submitBtn = container.querySelector('[data-slot="questionnaire-submit"]') as HTMLButtonElement
    expect(submitBtn).not.toBeNull()

    await act(async () => {
      submitBtn.click()
    })

    expect(onRequestMergeMock).toHaveBeenCalledWith({
      groupId: "group-1",
      ghostMemberId: "ghost-101",
      targetUserId: "user-me",
    })

    expect(toast.success).toHaveBeenCalledWith("Ghost member claim submitted! Admin approval requested.")
    expect(onCompleteMock).toHaveBeenCalledWith({
      contactId: "contact-1",
      contactName: "Alice Smith",
      groupId: "group-1",
      ghostMemberId: "ghost-101",
      targetUserId: "user-me",
    })
  })

  it("handles claim submission error gracefully and displays error toast", async () => {
    const onRequestMergeMock = vi.fn().mockRejectedValue(new Error("Admin merge request failed"))

    await act(async () => {
      root.render(
        <ContactReconciliationWizard
          unregisteredContacts={mockContacts}
          candidateGhostMembers={mockGhosts}
          targetUserId="user-me"
          onRequestMerge={onRequestMergeMock}
        />
      )
    })

    // Step 1 -> Step 2 -> Step 3
    const choices1 = container.querySelectorAll('[data-slot="questionnaire-choice"]')
    await act(async () => { (choices1[0] as HTMLElement).click() })

    const nextBtn1 = container.querySelector('[data-slot="questionnaire-next"]') as HTMLButtonElement
    await act(async () => { nextBtn1.click() })

    const nextBtn2 = container.querySelector('[data-slot="questionnaire-next"]') as HTMLButtonElement
    await act(async () => { nextBtn2.click() })

    // Step 3: Select ghost member 1
    const choices3 = container.querySelectorAll('[data-slot="questionnaire-choice"]')
    await act(async () => { (choices3[0] as HTMLElement).click() })

    const submitBtn = container.querySelector('[data-slot="questionnaire-submit"]') as HTMLButtonElement
    await act(async () => { submitBtn.click() })

    expect(toast.error).toHaveBeenCalledWith("Admin merge request failed")
  })
})

describe("ReconcileContactsDialog", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.clearAllMocks()
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it("renders modal dialog when open is true", async () => {
    const { ReconcileContactsDialog } = await import("@/components/contacts/ContactReconciliationWizard")

    await act(async () => {
      root.render(
        <ReconcileContactsDialog
          open={true}
          unregisteredContacts={mockContacts}
          candidateGhostMembers={mockGhosts}
          targetUserId="user-me"
        />
      )
    })

    expect(document.body.textContent).toContain("Contact Reconciliation")
    expect(document.body.textContent).toContain("Select Unregistered Contact")
  })
})

