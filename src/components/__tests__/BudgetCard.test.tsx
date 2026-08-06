import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { BudgetRow } from "../finance/BudgetCard";

describe("BudgetRow", () => {
  it("displays correct spent and limit in Rupees", () => {
    // spent is ₹2,500, limit is ₹5,000
    const html = renderToString(<BudgetRow category="Food" spent={2500} limit={5000} />);

    expect(html).toContain("Food");
    expect(html).toContain("2,500");
    expect(html).toContain("5,000");
    expect(html).toContain("aria-valuenow=\"50\"");
  });

  it("handles categories with no limit set", () => {
    const html = renderToString(<BudgetRow category="Misc" spent={150} limit={null} />);

    expect(html).toContain("Misc");
    expect(html).toContain("150");
    expect(html).not.toContain("/ ₹");
    expect(html).not.toContain("role=\"progressbar\"");
  });

  it("calculates percentage accurately for spending in Rupees and caps at 100%", () => {
    const html = renderToString(<BudgetRow category="Shopping" spent={6000} limit={5000} />);

    expect(html).toContain("Shopping");
    expect(html).toContain("6,000");
    expect(html).toContain("5,000");
    expect(html).toContain("aria-valuenow=\"100\"");
  });
});
