
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./MonthlyOverview.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CHART_COLORS = [
  "#432F2E",
  "#C4DAE8",
  "#FEEFB8",
  "#7FA8BC",
  "#D9A6A6",
  "#A8B89A",
];

function formatCategoryName(category) {
  return category
    .toLowerCase()
    .split("_")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function MonthlyOverview() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadOverview() {
      try {
        setStatus("loading");
        setErrorMessage("");

        // 1. Get overall monthly budget
        const monthlyBudgetResponse = await fetch(
          `http://localhost:8080/api/monthly-budget?month=${month}&year=${year}`
        );

        let budgetAmount = 0;

        if (monthlyBudgetResponse.ok) {
          const budgetData = await monthlyBudgetResponse.json();
          budgetAmount = Number(budgetData.amount);
        } else if (monthlyBudgetResponse.status !== 404) {
          throw new Error("Could not load monthly budget.");
        }

        // 2. Get category budgets
        const categoryBudgetResponse = await fetch(
          `http://localhost:8080/api/category-budgets?month=${month}&year=${year}`
        );

        if (!categoryBudgetResponse.ok) {
          throw new Error("Could not load category budgets.");
        }

        const categoryBudgetData = await categoryBudgetResponse.json();

        // 3. Get expenses
        const expenseResponse = await fetch(
          `http://localhost:8080/api/expenses?month=${month}&year=${year}`
        );

        if (!expenseResponse.ok) {
          throw new Error("Could not load expenses.");
        }

        const expenseData = await expenseResponse.json();

        setMonthlyBudget(budgetAmount);
        setCategoryBudgets(categoryBudgetData);
        setExpenses(expenseData);
        setStatus("success");
      } catch (error) {
        console.error("Monthly Overview error:", error);

        setErrorMessage(
          error.message || "Could not load monthly overview."
        );

        setStatus("error");
      }
    }

    loadOverview();
  }, [month, year]);

  // Total spending
  const totalSpent = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount);
  }, 0);

  // Overall remaining amount
  const remaining = monthlyBudget - totalSpent;

  // Overall percentage used
  const usedPercentage =
    monthlyBudget > 0
      ? (totalSpent / monthlyBudget) * 100
      : 0;

  const progressPercentage = Math.min(
    Math.max(usedPercentage, 0),
    100
  );

  // Create a combined category map.
  // This combines category budgets and actual expenses.
  const categoryMap = {};

  categoryBudgets.forEach((budget) => {
    categoryMap[budget.category] = {
      category: budget.category,
      allocated: Number(budget.amount),
      spent: 0,
    };
  });

  expenses.forEach((expense) => {
    if (!categoryMap[expense.category]) {
      categoryMap[expense.category] = {
        category: expense.category,
        allocated: 0,
        spent: 0,
      };
    }

    categoryMap[expense.category].spent += Number(
      expense.amount
    );
  });

  const categoryOverview = Object.values(categoryMap)
    .map((item) => {
      return {
        category: item.category,
        name: formatCategoryName(item.category),
        allocated: item.allocated,
        spent: item.spent,
        remaining: item.allocated - item.spent,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  // Allocated vs spent chart
  const comparisonChartData = categoryOverview.map((item) => {
    return {
      name: item.name,
      allocated: item.allocated,
      spent: item.spent,
    };
  });

  // Spending distribution
  const spendingMap = {};

  expenses.forEach((expense) => {
    if (!spendingMap[expense.category]) {
      spendingMap[expense.category] = 0;
    }

    spendingMap[expense.category] += Number(expense.amount);
  });

  const spendingChartData = Object.entries(spendingMap)
    .map(([category, amount]) => {
      return {
        name: formatCategoryName(category),
        value: amount,
      };
    })
    .sort((a, b) => b.value - a.value);

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
          <p className="overview-error">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monthly-overview">
      {/* Header */}
      <div className="overview-header">
        <div>
          <p className="overview-eyebrow">
            MONTHLY OVERVIEW
          </p>

          <h2>
            {MONTHS[month - 1]} {year}
          </h2>
        </div>

        <div className="overview-symbol">₹</div>
      </div>

      {/* Overall summary */}
      <div className="overview-main-card">
        <div className="money-grid">
          <div className="money-item">
            <span className="money-label">BUDGET</span>

            <strong>
              ₹{monthlyBudget.toFixed(2)}
            </strong>
          </div>

          <div className="money-item">
            <span className="money-label">SPENT</span>

            <strong>
              ₹{totalSpent.toFixed(2)}
            </strong>
          </div>

          <div className="money-item">
            <span className="money-label">
              {remaining >= 0 ? "REMAINING" : "OVER BUDGET"}
            </span>

            <strong>
              ₹{Math.abs(remaining).toFixed(2)}
            </strong>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span>Budget used</span>
            <span>{usedPercentage.toFixed(0)}%</span>
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
            Set your monthly budget to start tracking your
            progress.
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

      {/* Allocated vs Spent */}
      <div className="overview-card">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-eyebrow">
              BUDGET VS REALITY
            </p>

            <h3>Allocated vs Spent</h3>
          </div>
        </div>

        {categoryOverview.length === 0 ? (
          <p className="overview-empty">
            No category budgets or expenses recorded for
            this month yet.
          </p>
        ) : (
          <>
            <div
              className="overview-chart-wrapper"
              style={{ height: "320px" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis tick={{ fontSize: 12 }} />

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toFixed(2)}`
                    }
                  />

                  <Bar
                    dataKey="allocated"
                    name="Allocated"
                    fill="#C4DAE8"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="spent"
                    name="Spent"
                    fill="#432F2E"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overview-category-list">
              {categoryOverview.map((item) => {
                const percentage =
                  item.allocated > 0
                    ? (item.spent / item.allocated) * 100
                    : 0;

                const displayPercentage = Math.min(
                  Math.max(percentage, 0),
                  100
                );

                return (
                  <div
                    className="overview-category"
                    key={item.category}
                  >
                    <div className="overview-category-top">
                      <span>{item.name}</span>

                      <strong>
                        ₹{item.spent.toFixed(2)}
                      </strong>
                    </div>

                    <div className="overview-category-track">
                      <div
                        className="overview-category-fill"
                        style={{
                          width: `${displayPercentage}%`,
                        }}
                      />
                    </div>

                    <p>
                      Allocated: ₹
                      {item.allocated.toFixed(2)}
                      {" • "}

                      {item.remaining >= 0
                        ? `₹${item.remaining.toFixed(
                            2
                          )} remaining`
                        : `₹${Math.abs(
                            item.remaining
                          ).toFixed(2)} over budget`}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Spending distribution */}
      <div className="overview-card">
        <div className="overview-section-heading">
          <div>
            <p className="overview-section-eyebrow">
              BREAKDOWN
            </p>

            <h3>Spending by category</h3>
          </div>
        </div>

        {spendingChartData.length === 0 ? (
          <p className="overview-empty">
            No expenses recorded for this month yet.
          </p>
        ) : (
          <>
            <div className="overview-chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={spendingChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {spendingChartData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            CHART_COLORS[
                              index % CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toFixed(2)}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="overview-category-list">
              {spendingChartData.map((item) => {
                const percentage =
                  totalSpent > 0
                    ? (item.value / totalSpent) * 100
                    : 0;

                return (
                  <div
                    className="overview-category"
                    key={item.name}
                  >
                    <div className="overview-category-top">
                      <span>{item.name}</span>

                      <strong>
                        ₹{item.value.toFixed(2)}
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
                      {percentage.toFixed(0)}% of total
                      spending
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MonthlyOverview;

