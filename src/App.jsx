import Dashboard from "./components/Dashboard";
import BudgetSetup from "./components/BudgetSetup";
import ExpenseTracker from "./components/ExpenseTracker";
import MonthlyOverview from "./components/MonthlyOverview";

function App() {
  return (
    <div>
      <MonthlyOverview />
      <Dashboard />
      <BudgetSetup />
      <ExpenseTracker />
    </div>
  );
}

export default App;