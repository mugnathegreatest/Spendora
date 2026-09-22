import { useEffect, useState } from "react";
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
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getTodayAsString() {
  const today = new Date();

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ExpenseTracker() {
  const today = new Date();
  const todayString = getTodayAsString();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayString);
  const [description, setDescription] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});

  const [listStatus, setListStatus] = useState("loading");
  const [listErrorMessage, setListErrorMessage] = useState("");

  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const [editingId, setEditingId] = useState(null);

  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const fetchExpenses = async () => {
    setListStatus("loading");
    setListErrorMessage("");

    try {
      const response = await fetch(
        `http://localhost:8080/api/expenses?month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error("Could not load expenses.");
      }

      const data = await response.json();

      setExpenses(data);
      setListStatus("success");

      const total = data.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      );

      setTotalSpent(total);

      const totals = {};

      data.forEach((expense) => {
        if (!totals[expense.category]) {
          totals[expense.category] = 0;
        }

        totals[expense.category] += Number(expense.amount);
      });

      setCategoryTotals(totals);
    } catch (error) {
      setListErrorMessage(
        error.message || "Could not load expenses."
      );

      setListStatus("error");
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDate(todayString);
    setDescription("");
    setEditingId(null);
  };

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
      const expenseData = {
        amount: parseFloat(amount),
        category: toBackendCategory(category),
        date: date,
        description: description || null,
      };

      const url = editingId
        ? `http://localhost:8080/api/expenses/${editingId}`
        : "http://localhost:8080/api/expenses";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText ||
            `Failed to ${
              editingId ? "update" : "add"
            } expense.`
        );
      }

      setSaveStatus("success");

      setSaveMessage(
        editingId
          ? "Expense updated successfully!"
          : "Expense added successfully!"
      );

      resetForm();

      await fetchExpenses();
    } catch (error) {
      setSaveStatus("error");

      setSaveMessage(
        error.message ||
          `Failed to ${
            editingId ? "update" : "add"
          } expense.`
      );
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);

    setAmount(String(expense.amount));
    setCategory(toDisplayLabel(expense.category));
    setDate(expense.date);
    setDescription(expense.description || "");

    setSaveStatus("idle");
    setSaveMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/expenses/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Failed to delete expense."
        );
      }

      if (editingId === id) {
        resetForm();
      }

      setSaveStatus("success");
      setSaveMessage("Expense deleted successfully!");

      await fetchExpenses();
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(
        error.message || "Failed to delete expense."
      );
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setSaveStatus("idle");
    setSaveMessage("");
  };

  const categoryEntries = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="expense-tracker">

      {/* HEADER */}

      <div className="page-header">
        <div>
          <p className="eyebrow">SPENDORA</p>

          <h1>Track your spending</h1>

          <p className="page-subtitle">
            Keep an eye on where your money goes.
          </p>
        </div>

        <div className="header-accent">₹</div>
      </div>

      {/* MONTHLY SUMMARY */}

      <div className="summary-card">
        <div className="summary-label">
          THIS MONTH
        </div>

        <div className="summary-content">
          <div>
            <p className="summary-title">
              Total spent
            </p>

            <p className="summary-amount">
              ₹{totalSpent.toFixed(2)}
            </p>
          </div>

          <div className="summary-expense-count">
            <span>{expenses.length}</span>
            <small>
              {expenses.length === 1
                ? "expense"
                : "expenses"}
            </small>
          </div>
        </div>
      </div>

      {/* ADD / EDIT FORM */}

      <div className="card">
        <div className="form-heading">
          <div>
            <p className="section-eyebrow">
              {editingId ? "EDIT EXPENSE" : "NEW EXPENSE"}
            </p>

            <h2>
              {editingId
                ? "Update your expense"
                : "Add an expense"}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="field">
            <label htmlFor="amount">
              Amount
            </label>

            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 100"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
            />
          </div>

          <div className="field">
            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="">
                Select a category
              </option>

              {CATEGORIES.map((categoryName) => (
                <option
                  key={categoryName}
                  value={categoryName}
                >
                  {categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">
              Date
            </label>

            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </div>

          <div className="field">
            <label htmlFor="description">
              Description
              <span className="optional-label">
                {" "}optional
              </span>
            </label>

            <input
              id="description"
              type="text"
              placeholder="e.g. Lunch with friends"
              value={description}
              maxLength={255}
              onChange={(event) =>
                setDescription(event.target.value)
              }
            />
          </div>

          {saveMessage && (
            <p
              className={
                saveStatus === "error"
                  ? "error-message"
                  : "success-message"
              }
            >
              {saveMessage}
            </p>
          )}

          <div className="form-buttons">
            <button
              type="submit"
              className="add-button"
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving"
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                ? "Update Expense"
                : "Add Expense"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CATEGORY BREAKDOWN */}

      {categoryEntries.length > 0 && (
        <div className="card">

          <div className="section-heading">
            <div>
              <p className="section-eyebrow">
                BREAKDOWN
              </p>

              <h2>Spending by category</h2>
            </div>
          </div>

          <div className="category-list">

            {categoryEntries.map(
              ([categoryName, categoryAmount]) => {

                const percentage =
                  totalSpent > 0
                    ? (categoryAmount / totalSpent) * 100
                    : 0;

                return (
                  <div
                    className="category-item"
                    key={categoryName}
                  >

                    <div className="category-top">

                      <span className="category-name">
                        {toDisplayLabel(categoryName)}
                      </span>

                      <span className="category-value">
                        ₹{categoryAmount.toFixed(2)}
                      </span>

                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="category-percentage">
                      {percentage.toFixed(0)}% of spending
                    </p>

                  </div>
                );
              }
            )}

          </div>
        </div>
      )}

      {/* RECENT EXPENSES */}

      <div className="card">

        <div className="section-heading">

          <div>
            <p className="section-eyebrow">
              THIS MONTH
            </p>

            <h2>Recent expenses</h2>
          </div>

          <div className="expense-count">
            {expenses.length}
          </div>

        </div>

        {listStatus === "loading" && (
          <p className="empty-message">
            Loading expenses...
          </p>
        )}

        {listStatus === "error" && (
          <p className="error-message">
            {listErrorMessage}
          </p>
        )}

        {listStatus === "success" &&
          expenses.length === 0 && (
            <p className="empty-message">
              No expenses recorded for this month.
            </p>
          )}

        {listStatus === "success" &&
          expenses.length > 0 && (

            <div className="expense-list">

              {expenses.map((expense) => (

                <div
                  className="expense-row"
                  key={expense.id}
                >

                  <div className="expense-icon">
                    ₹
                  </div>

                  <div className="expense-details">

                    <div className="expense-main">

                      <div className="expense-info">

                        <span className="expense-category">
                          {toDisplayLabel(
                            expense.category
                          )}
                        </span>

                        <span className="expense-date">
                          {formatDate(expense.date)}
                        </span>

                      </div>

                      <span className="expense-amount">
                        ₹
                        {Number(
                          expense.amount
                        ).toFixed(2)}
                      </span>

                    </div>

                    {expense.description && (
                      <div className="expense-description">
                        {expense.description}
                      </div>
                    )}

                  </div>

                  <div className="expense-actions">

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() =>
                        handleEdit(expense)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        handleDelete(expense.id)
                      }
                    >
                      Delete
                    </button>

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