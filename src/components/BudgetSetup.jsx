import { useState } from "react";
import "./BudgetSetup.css";

const CATEGORIES = ["Food", "Transport", "Rent", "Self Care", "Grocery", "Miscellaneous"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Converts a frontend label like "Self Care" into the backend enum value "SELF_CARE"
function toBackendCategory(categoryLabel) {
  return categoryLabel.toUpperCase().replace(/ /g, "_");
}

function BudgetSetup() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [year, setYear] = useState(today.getFullYear());
  const [monthlyBudget, setMonthlyBudget] = useState("");

  const [categoryAmounts, setCategoryAmounts] = useState(
    Object.fromEntries(CATEGORIES.map((category) => [category, ""]))
  );

  // Tracks what's happening with the save: idle, saving, success, or error
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const handleCategoryChange = (category, value) => {
    setCategoryAmounts((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const toNumber = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalAllocated = CATEGORIES.reduce(
    (sum, category) => sum + toNumber(categoryAmounts[category]),
    0
  );

  const totalBudgetNumber = toNumber(monthlyBudget);
  const remaining = totalBudgetNumber - totalAllocated;
  const isOverBudget = remaining < 0;

  const handleSave = async () => {
    if (isOverBudget) {
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("");

    // Only send categories where the user actually entered an amount greater than 0
    const categoriesToSave = CATEGORIES.filter(
      (category) => toNumber(categoryAmounts[category]) > 0
    );

    if (categoriesToSave.length === 0) {
      setSaveStatus("error");
      setSaveMessage("Enter at least one category amount before saving.");
      return;
    }

    try {
      for (const category of categoriesToSave) {
        const response = await fetch("http://localhost:8080/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: toBackendCategory(category),
            amount: toNumber(categoryAmounts[category]),
            month,
            year,
          }),
        });

        if (!response.ok) {
          // The backend sends a plain text error message (e.g. duplicate budget, bad amount)
          const errorText = await response.text();
          throw new Error(`${category}: ${errorText || "Failed to save."}`);
        }
      }

      setSaveStatus("success");
      setSaveMessage("Budget saved successfully!");
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err.message || "Something went wrong while saving. Please try again.");
    }
  };

  return (
    <div className="budget-setup">
      <h1>Budget Setup</h1>

      <div className="card">
        <div className="field-row">
          <div className="field">
            <label htmlFor="month">Month</label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="monthlyBudget">Total Monthly Budget</label>
          <input
            id="monthlyBudget"
            type="number"
            placeholder="e.g. 2000"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h2>Category Allocation</h2>

        {CATEGORIES.map((category) => (
          <div className="field category-field" key={category}>
            <label htmlFor={category}>{category}</label>
            <input
              id={category}
              type="number"
              placeholder="0"
              value={categoryAmounts[category]}
              onChange={(e) => handleCategoryChange(category, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="card summary">
        <div className="summary-row">
          <span>Total Allocated</span>
          <span>{totalAllocated.toFixed(2)}</span>
        </div>
        <div className={`summary-row ${isOverBudget ? "negative" : ""}`}>
          <span>Remaining</span>
          <span>{remaining.toFixed(2)}</span>
        </div>

        {isOverBudget && (
          <p className="error-message">
            You've allocated more than your total monthly budget. Reduce category
            amounts or increase the monthly budget.
          </p>
        )}

        {saveStatus === "error" && (
          <p className="error-message">{saveMessage}</p>
        )}

        {saveStatus === "success" && (
          <p className="success-message">{saveMessage}</p>
        )}

        <button
          className="save-button"
          onClick={handleSave}
          disabled={isOverBudget || saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "Saving..." : "Save Budget"}
        </button>
      </div>
    </div>
  );
}

export default BudgetSetup;