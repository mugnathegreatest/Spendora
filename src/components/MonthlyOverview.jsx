import { useEffect, useState } from "react";
import "./MonthlyOverview.css";

function MonthlyOverview() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const monthName = today.toLocaleDateString("en-IN", {
    month: "long",
  });

  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});

  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      setStatus("loading");
      setErrorMessage("");

      try {
        const budgetResponse = await fetch(
          `http://localhost:8080/api/monthly-budget?month=${month}&year=${year}`
        );

        let budget = 0;

        if (budgetResponse.ok) {
          const budgetData = await budgetResponse.json();
          budget = Number(budgetData.amount);
        } else if (budgetResponse.status !== 404) {
          throw new Error("Could not load monthly budget.");
        }

        const expenseResponse = await fetch(
          `http://localhost:8080/api/expenses?month=${month}&year=${year}`
        );

        if (!expenseResponse.ok) {
          throw new Error("Could not load expenses.");
        }

        const expenses = await expenseResponse.json();

        const spent = expenses.reduce(
          (sum, expense) => sum + Number(expense.amount),
          0
        );

        const totals = {};

        expenses.forEach((expense) => {
          if (!totals[expense.category]) {
            totals[expense.category] = 0;
          }

          totals[expense.category] += Number(expense.amount);
        });

        setMonthlyBudget(budget);
        setTotalSpent(spent);
        setCategoryTotals(totals);
        setStatus("success");
      } catch (error) {
        setErrorMessage(
          error.message || "Could not load monthly overview."
        );

        setStatus("error");
      }
    };

    loadOverview();
  }, [month, year]);

  const remaining = monthlyBudget - totalSpent;

  const usedPercentage =
    monthlyBudget > 0
      ? (totalSpent / monthlyBudget) * 100
      : 0;

  const progressPercentage = Math.min(
    Math.max(usedPercentage, 0),
    100
  );

  const categoryEntries = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  const formatCategoryName = (category) => {
    return category
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  if (status === "loading") {
    return (
      <div className="monthly-overview">
        <div className="overview-card">
          <p className="overview-loading">
            Loading your monthly overview...
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="monthly-overview">
        <div className="overview-card">
          <p className="overview-error">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="monthly-overview">

      <div className="overview-header">
        <div>
          <p className="overview-eyebrow">
            MONTHLY OVERVIEW
          </p>

          <h2>{monthName} {year}</h2>
        </div>

        <div className="overview-symbol">₹</div>
      </div>

      <div className="overview-main-card">

        <div className="money-grid">

          <div className="money-item">
            <span className="money-label">
              BUDGET
            </span>

            <strong>
              ₹{monthlyBudget.toFixed(2)}
            </strong>
          </div>

          <div className="money-item">
            <span className="money-label">
              SPENT
            </span>

            <strong>
              ₹{totalSpent.toFixed(2)}
            </strong>
          </div>

          <div className="money-item">
            <span className="money-label">
              {remaining >= 0
                ? "REMAINING"
                : "OVER BUDGET"}
            </span>

            <strong>
              ₹{Math.abs(remaining).toFixed(2)}
            </strong>
          </div>

        </div>

        <div className="progress-section">

          <div className="progress-header">
            <span>
              Budget used
            </span>

            <span>
              {usedPercentage.toFixed(0)}%
            </span>
          </div>

          <div className="overview-progress-track">
            <div
              className="overview-progress-fill"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>

        </div>

        {monthlyBudget === 0 && (
          <div className="overview-notice">
            Set your monthly budget to start
            tracking your progress.
          </div>
        )}

        {monthlyBudget > 0 && remaining < 0 && (
          <div className="overview-warning">
            You've exceeded your monthly budget by{" "}
            <strong>
              ₹{Math.abs(remaining).toFixed(2)}
            </strong>
          </div>
        )}

        {monthlyBudget > 0 && remaining >= 0 && (
          <div className="overview-positive">
            You have{" "}
            <strong>
              ₹{remaining.toFixed(2)}
            </strong>{" "}
            left for this month.
          </div>
        )}

      </div>

      <div className="overview-card">

        <div className="overview-section-heading">
          <div>
            <p className="overview-section-eyebrow">
              BREAKDOWN
            </p>

            <h3>
              Spending by category
            </h3>
          </div>
        </div>

        {categoryEntries.length === 0 ? (
          <p className="overview-empty">
            No expenses recorded for this month yet.
          </p>
        ) : (
          <div className="overview-category-list">

            {categoryEntries.map(
              ([category, amount]) => {

                const percentage =
                  totalSpent > 0
                    ? (amount / totalSpent) * 100
                    : 0;

                return (
                  <div
                    className="overview-category"
                    key={category}
                  >

                    <div className="overview-category-top">

                      <span>
                        {formatCategoryName(category)}
                      </span>

                      <strong>
                        ₹{amount.toFixed(2)}
                      </strong>

                    </div>

                    <div className="overview-category-track">
                      <div
                        className="overview-category-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p>
                      {percentage.toFixed(0)}% of
                      total spending
                    </p>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
}

export default MonthlyOverview;