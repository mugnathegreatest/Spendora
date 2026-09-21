import { useState, useEffect } from "react";
import "./Dashboard.css";

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

// Converts backend values like "SELF_CARE" into "Self Care"
function toDisplayLabel(backendCategory) {
  return backendCategory
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function Dashboard() {
  const today = new Date();

  const [month] = useState(today.getMonth() + 1);
  const [year] = useState(today.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setStatus("loading");
    setErrorMessage("");

    fetch(
      `http://localhost:8080/api/budgets?month=${month}&year=${year}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("The server could not load your budgets.");
        }

        return response.json();
      })
      .then((data) => {
        setBudgets(data);
        setStatus("success");
      })
      .catch((err) => {
        setErrorMessage(
          err.message ||
            "Something went wrong while loading your budgets."
        );
        setStatus("error");
      });
  }, [month, year]);

  const totalAllocated = budgets.reduce(
    (sum, budget) => sum + Number(budget.amount),
    0
  );

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <p className="dashboard-subtitle">
        {MONTHS[month - 1]} {year}
      </p>

      {status === "loading" && (
        <div className="card">
          <p>Loading your budgets...</p>
        </div>
      )}

      {status === "error" && (
        <div className="card">
          <p className="error-message">{errorMessage}</p>
        </div>
      )}

      {status === "success" && budgets.length === 0 && (
        <div className="card">
          <p>
            No budget set up for {MONTHS[month - 1]} {year} yet.
            Head to Budget Setup to create one.
          </p>
        </div>
      )}

      {status === "success" && budgets.length > 0 && (
        <>
          <div className="card">
            <h2>Category Budgets</h2>

            {budgets.map((budget) => (
              <div className="budget-row" key={budget.id}>
                <span>{toDisplayLabel(budget.category)}</span>
                <span>₹{Number(budget.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="card summary">
            <div className="summary-row">
              <span>Total Allocated</span>
              <span>₹{totalAllocated.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;