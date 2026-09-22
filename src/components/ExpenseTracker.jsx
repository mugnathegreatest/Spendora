import { useState, useEffect } from "react";
import "./ExpenseTracker.css";

const CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Self Care",
  "Grocery",
  "Miscellaneous",
];

function toBackendCategory(categoryLabel) {
  return categoryLabel.toUpperCase().replace(/ /g, "_");
}

function toDisplayLabel(backendCategory) {
  return backendCategory
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTodayAsString() {
  const today = new Date();

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function ExpenseTracker() {
  const today = new Date();
  const todayString = getTodayAsString();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayString);
  const [description, setDescription] = useState("");

  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [listStatus, setListStatus] = useState("loading");
  const [listErrorMessage, setListErrorMessage] = useState("");

  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const fetchExpenses = () => {
    setListStatus("loading");
    setListErrorMessage("");

    fetch(
      `http://localhost:8080/api/expenses?month=${month}&year=${year}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load expenses.");
        }

        return response.json();
      })
      .then((data) => {
        setExpenses(data);
        setListStatus("success");
      })
      .catch((error) => {
        setListErrorMessage(
          error.message || "Could not load expenses."
        );
        setListStatus("error");
      });
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const validate = () => {
    const amountNumber = parseFloat(amount);

    if (!amount || isNaN(amountNumber) || amountNumber <= 0) {
      return "Amount must be greater than 0.";
    }

    if (!category) {
      return "Please select a category.";
    }

    if (!date) {
      return "Please select a date.";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setSaveStatus("error");
      setSaveMessage(validationError);
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/expenses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            category: toBackendCategory(category),
            date: date,
            description: description || null,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Failed to add expense. Please try again."
        );
      }

      setAmount("");
      setDescription("");

      setSaveStatus("success");
      setSaveMessage("Expense added successfully!");

      fetchExpenses();
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(
        error.message || "Failed to add expense. Please try again."
      );
    }
  };

  return (
    <div className="expense-tracker">
      <h1>Expense Tracking</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="amount">Amount</label>

            <input
              id="amount"
              type="number"
              placeholder="e.g. 100"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>

            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Select a category</option>

              {CATEGORIES.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">Date</label>

            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="description">
              Description (optional)
            </label>

            <input
              id="description"
              type="text"
              placeholder="e.g. Lunch"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {saveStatus === "error" && (
            <p className="error-message">{saveMessage}</p>
          )}

          {saveStatus === "success" && (
            <p className="success-message">{saveMessage}</p>
          )}

          <button
            type="submit"
            className="add-button"
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving"
              ? "Adding..."
              : "Add Expense"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Recent Expenses</h2>

        {listStatus === "loading" && (
          <p>Loading expenses...</p>
        )}

        {listStatus === "error" && (
          <p className="error-message">
            {listErrorMessage}
          </p>
        )}

        {listStatus === "success" && expenses.length === 0 && (
          <p>No expenses recorded for this month.</p>
        )}

        {listStatus === "success" && expenses.length > 0 && (
          <div className="expense-list">
            {expenses.map((expense) => (
              <div className="expense-row" key={expense.id}>
                <div className="expense-main">
                  <span className="expense-amount">
                    ₹{Number(expense.amount).toFixed(2)}
                  </span>

                  <span className="expense-category">
                    {toDisplayLabel(expense.category)}
                  </span>
                </div>

                <div className="expense-sub">
                  <span className="expense-date">
                    {expense.date}
                  </span>

                  {expense.description && (
                    <span className="expense-description">
                      {expense.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseTracker;