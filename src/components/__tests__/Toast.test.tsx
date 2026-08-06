import { describe, it, expect } from "vitest"
import { toast, createToastManager } from "@/components/ui/toast"

describe("Base UI Toast Helper Functions", () => {
  it("exports typed helper functions on toast object", () => {
    expect(typeof toast.success).toBe("function")
    expect(typeof toast.error).toBe("function")
    expect(typeof toast.info).toBe("function")
    expect(typeof toast.warning).toBe("function")
    expect(typeof toast.loading).toBe("function")
    expect(typeof toast.dismiss).toBe("function")
    expect(typeof toast.close).toBe("function")
  })

  it("adds toasts via toast() and typed helper functions to a ToastManager", () => {
    const manager = createToastManager()
    
    // Test helper using default manager behavior
    const id1 = toast.success("Success Toast", { description: "Success description" })
    expect(typeof id1).toBe("string")

    const id2 = toast.error("Error Toast")
    expect(typeof id2).toBe("string")

    const id3 = toast.info("Info Toast")
    expect(typeof id3).toBe("string")

    const id4 = toast.warning("Warning Toast")
    expect(typeof id4).toBe("string")

    const id5 = toast.loading("Loading Toast")
    expect(typeof id5).toBe("string")

    const id6 = toast({ title: "Generic Toast" })
    expect(typeof id6).toBe("string")
  })

  it("allows dismissing toasts via toast.dismiss / toast.close", () => {
    const id = toast.success("Toast to dismiss")
    expect(() => toast.dismiss(id)).not.toThrow()
    expect(() => toast.close()).not.toThrow()
  })
})
