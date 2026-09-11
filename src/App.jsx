import { useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [employees, setEmployees] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  const [search, setSearch] = useState("");
  const [softwareFilter, setSoftwareFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [aiResult, setAiResult] = useState(null);

  const [activePage, setActivePage] = useState("dashboard");

  // =====================================================
  // LOAD EMPLOYEES
  // =====================================================

  useEffect(() => {
    fetch(`${API}/employees`)
      .then((response) => response.json())
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading employees:", error);
        setLoading(false);
      });
  }, []);

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    fetch(`${API}/dashboard`)
      .then((response) => response.json())
      .then((data) => {
        setDashboard(data);
      })
      .catch((error) => {
        console.error("Dashboard error:", error);
      });
  }, []);

  // =====================================================
  // FILTER EMPLOYEES
  // =====================================================

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.employee_id
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesSoftware =
      softwareFilter === "ALL" ||
      employee.software === softwareFilter;

    return matchesSearch && matchesSoftware;
  });

  // =====================================================
  // AI PREDICTION
  // =====================================================

  const analyzeEmployee = async (employeeId) => {
    setAnalyzing(true);
    setAiResult(null);

    try {
      const response = await fetch(
        `${API}/predict/${employeeId}`
      );

      const data = await response.json();

      setAiResult(data);
    } catch (error) {
      console.error("AI prediction error:", error);

      setAiResult({
        message: "Unable to connect to AI backend"
      });
    }

    setAnalyzing(false);
  };

  // =====================================================
  // RECOMMENDATION CLASS
  // =====================================================

  const getRecommendationClass = (recommendation) => {
    if (recommendation === "KEEP LICENSE") {
      return "keep";
    }

    if (recommendation === "RECLAIM CANDIDATE") {
      return "reclaim";
    }

    return "review";
  };

  // =====================================================
  // DASHBOARD
  // =====================================================

  const DashboardPage = () => {
    if (!dashboard) {
      return (
        <div className="loading">
          Loading dashboard...
        </div>
      );
    }

    return (
      <section className="page-section">

        <div className="page-title">
          <h2>LicenseGuard Dashboard</h2>
          <p>
            AI-powered overview of software license usage
          </p>
        </div>

        <div className="dashboard-cards">

          <div className="dashboard-card">
            <span>Total Employees</span>
            <strong>{dashboard.total_employees}</strong>
            <p>Employees analyzed</p>
          </div>

          <div className="dashboard-card keep-card">
            <span>Keep License</span>
            <strong>{dashboard.keep_license}</strong>
            <p>Licenses required</p>
          </div>

          <div className="dashboard-card reclaim-card">
            <span>Reclaim Candidates</span>
            <strong>{dashboard.reclaim_candidates}</strong>
            <p>Potentially unused</p>
          </div>

          <div className="dashboard-card review-card">
            <span>Review</span>
            <strong>{dashboard.review}</strong>
            <p>Needs manual review</p>
          </div>

        </div>

        <div className="savings-highlight">

          <h2>Potential Monthly Savings</h2>

          <p>
            Estimated savings from reclaiming unnecessary licenses
          </p>

          <strong>
            ₹{dashboard.potential_monthly_savings.toLocaleString()}
          </strong>

        </div>

      </section>
    );
  };

  // =====================================================
  // EMPLOYEES
  // =====================================================

  const EmployeesPage = () => {
    return (
      <section className="employee-section">

        <div className="section-title">

          <div>
            <h2>
              Employee License Management
            </h2>

            <p>
              View employee software usage and analyze
              license requirements using AI.
            </p>
          </div>

          <div className="employee-count">
            {filteredEmployees.length} Employees
          </div>

        </div>

        <div className="filters">

          <input
            type="text"
            placeholder="Search Employee ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={softwareFilter}
            onChange={(e) =>
              setSoftwareFilter(e.target.value)
            }
          >
            <option value="ALL">
              All Software
            </option>

            <option value="Adobe">
              Adobe
            </option>

            <option value="Figma">
              Figma
            </option>

            <option value="Salesforce">
              Salesforce
            </option>

            <option value="Microsoft 365">
              Microsoft 365
            </option>

            <option value="AutoCAD">
              AutoCAD
            </option>
          </select>

        </div>

        {aiResult && !aiResult.message && (

          <div className="ai-result">

            <div className="ai-result-header">

              <h2>
                AI License Analysis
              </h2>

              <button
                className="close-button"
                onClick={() =>
                  setAiResult(null)
                }
              >
                ×
              </button>

            </div>

            <div className="ai-details">

              <div>
                <strong>Employee</strong>
                <span>
                  {aiResult.employee_id}
                </span>
              </div>

              <div>
                <strong>Software</strong>
                <span>
                  {aiResult.software}
                </span>
              </div>

              <div>
                <strong>Department</strong>
                <span>
                  {aiResult.department}
                </span>
              </div>

              <div>
                <strong>
                  License Needed Probability
                </strong>

                <span className="probability">
                  {aiResult.license_needed_probability}%
                </span>
              </div>

            </div>

            <div
              className={`ai-recommendation ${getRecommendationClass(
                aiResult.recommendation
              )}`}
            >
              {aiResult.recommendation}
            </div>

          </div>
        )}

        {loading ? (

          <div className="loading">
            Loading employees...
          </div>

        ) : (

          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Software</th>
                  <th>Department</th>
                  <th>Days Since Last Use</th>
                  <th>Monthly Usage</th>
                  <th>License Cost</th>
                  <th>Status</th>
                  <th>AI Analysis</th>
                </tr>
              </thead>

              <tbody>

                {filteredEmployees
                  .slice(0, 100)
                  .map((employee) => (

                    <tr key={employee.employee_id}>

                      <td>
                        <strong>
                          {employee.employee_id}
                        </strong>
                      </td>

                      <td>
                        {employee.software}
                      </td>

                      <td>
                        {employee.department}
                      </td>

                      <td>
                        {employee.days_since_last_use} days
                      </td>

                      <td>
                        {employee.monthly_usage_hours} hrs
                      </td>

                      <td>
                        ₹{employee.license_cost}
                      </td>

                      <td>

                        {employee.license_needed === 1 ? (

                          <span className="badge keep">
                            KEEP LICENSE
                          </span>

                        ) : (

                          <span className="badge reclaim">
                            RECLAIM
                          </span>

                        )}

                      </td>

                      <td>

                        <button
                          className="analyze-button"
                          onClick={() =>
                            analyzeEmployee(
                              employee.employee_id
                            )
                          }
                        >
                          {analyzing
                            ? "Analyzing..."
                            : "Analyze"}
                        </button>

                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        )}

      </section>
    );
  };

  // =====================================================
  // SAVINGS PAGE
  // =====================================================

  const SavingsPage = () => {

    if (!dashboard) {
      return (
        <div className="loading">
          Loading savings...
        </div>
      );
    }

    return (
      <section className="page-section">

        <div className="page-title">
          <h2>License Savings</h2>

          <p>
            Estimated financial impact of reclaiming
            unnecessary software licenses.
          </p>
        </div>

        <div className="savings-main">

          <div className="savings-box">

            <span>
              Potential Monthly Savings
            </span>

            <strong>
              ₹{dashboard.potential_monthly_savings.toLocaleString()}
            </strong>

            <p>
              Estimated savings from reclaim candidates
            </p>

          </div>

          <div className="savings-box">

            <span>
              Potential Annual Savings
            </span>

            <strong>
              ₹{(
                dashboard.potential_monthly_savings * 12
              ).toLocaleString()}
            </strong>

            <p>
              Projected savings over 12 months
            </p>

          </div>

        </div>

        <div className="savings-summary">

          <h3>License Summary</h3>

          <div className="summary-row">
            <span>Total Employees</span>
            <strong>
              {dashboard.total_employees}
            </strong>
          </div>

          <div className="summary-row">
            <span>Licenses to Keep</span>
            <strong>
              {dashboard.keep_license}
            </strong>
          </div>

          <div className="summary-row">
            <span>Reclaim Candidates</span>
            <strong>
              {dashboard.reclaim_candidates}
            </strong>
          </div>

          <div className="summary-row">
            <span>Requires Review</span>
            <strong>
              {dashboard.review}
            </strong>
          </div>

        </div>

      </section>
    );
  };

  // =====================================================
  // REPORTS PAGE
  // =====================================================

  const ReportsPage = () => {

    if (!dashboard) {
      return (
        <div className="loading">
          Loading reports...
        </div>
      );
    }

    const keepPercentage =
      (
        (dashboard.keep_license /
          dashboard.total_employees) *
        100
      ).toFixed(1);

    const reclaimPercentage =
      (
        (dashboard.reclaim_candidates /
          dashboard.total_employees) *
        100
      ).toFixed(1);

    const reviewPercentage =
      (
        (dashboard.review /
          dashboard.total_employees) *
        100
      ).toFixed(1);

    return (
      <section className="page-section">

        <div className="page-title">

          <h2>License Reports</h2>

          <p>
            AI-generated analysis of your organization's
            software licenses.
          </p>

        </div>

        <div className="report-card">

          <h3>License Distribution</h3>

          <div className="report-row">

            <div>
              <span>Keep License</span>

              <strong>
                {dashboard.keep_license}
              </strong>
            </div>

            <span className="report-percent">
              {keepPercentage}%
            </span>

          </div>

          <div className="progress">
            <div
              className="progress-keep"
              style={{
                width: `${keepPercentage}%`
              }}
            ></div>
          </div>

          <div className="report-row">

            <div>
              <span>Reclaim Candidates</span>

              <strong>
                {dashboard.reclaim_candidates}
              </strong>
            </div>

            <span className="report-percent">
              {reclaimPercentage}%
            </span>

          </div>

          <div className="progress">
            <div
              className="progress-reclaim"
              style={{
                width: `${reclaimPercentage}%`
              }}
            ></div>
          </div>

          <div className="report-row">

            <div>
              <span>Review Required</span>

              <strong>
                {dashboard.review}
              </strong>
            </div>

            <span className="report-percent">
              {reviewPercentage}%
            </span>

          </div>

          <div className="progress">
            <div
              className="progress-review"
              style={{
                width: `${reviewPercentage}%`
              }}
            ></div>
          </div>

        </div>

        <div className="report-card">

          <h3>Financial Impact</h3>

          <div className="financial-report">

            <div>
              <span>Monthly Savings</span>

              <strong>
                ₹{dashboard.potential_monthly_savings.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Annual Savings</span>

              <strong>
                ₹{(
                  dashboard.potential_monthly_savings * 12
                ).toLocaleString()}
              </strong>
            </div>

          </div>

        </div>

        <div className="report-card">

          <h3>AI Recommendation</h3>

          <p className="report-message">

            LicenseGuard identified{" "}
            <strong>
              {dashboard.reclaim_candidates}
            </strong>{" "}
            potential reclaim candidates.

            These licenses should be reviewed and,
            where appropriate, reclaimed to reduce
            unnecessary software expenditure.

          </p>

        </div>

      </section>
    );
  };

  // =====================================================
  // MAIN RETURN
  // =====================================================

  return (

    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div>
          <h1>AI LicenseGuard</h1>

          <p>
            AI-Powered Software License Management
          </p>
        </div>

        <div className="connection">

          <span className="status-dot"></span>

          Backend Connected

        </div>

      </header>

{/* ================= NAVIGATION ================= */}

<nav className="navbar">

  <button
    className={activePage === "dashboard" ? "active" : ""}
    onClick={() => setActivePage("dashboard")}
  >
    Dashboard
  </button>

  <button
    className={activePage === "employees" ? "active" : ""}
    onClick={() => setActivePage("employees")}
  >
    Employees
  </button>

  <button
    className={activePage === "reclamation" ? "active" : ""}
    onClick={() => setActivePage("reclamation")}
  >
    Reclamation
  </button>

  <button
    className={activePage === "savings" ? "active" : ""}
    onClick={() => setActivePage("savings")}
  >
    Savings
  </button>

  <button
    className={activePage === "reports" ? "active" : ""}
    onClick={() => setActivePage("reports")}
  >
    Reports
  </button>

</nav>


{/* ================= PAGE CONTENT ================= */}

{activePage === "dashboard" && (
  <DashboardPage />
)}

{activePage === "employees" && (
  <EmployeesPage />
)}

{activePage === "reclamation" && (
  <ReclamationPage />
)}

{activePage === "savings" && (
  <SavingsPage />
)}

{activePage === "reports" && (
  <ReportsPage />
)}

    </div>
  );
}
// =====================================================
// RECLAMATION PAGE
// =====================================================

function ReclamationPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [response, setResponse] = useState("");
  const [employeeStatus, setEmployeeStatus] = useState("");

  const [notificationResult, setNotificationResult] = useState(null);
  const [responseResult, setResponseResult] = useState(null);
  const [statusResult, setStatusResult] = useState(null);

  const [loading, setLoading] = useState(false);

  // Send reclamation notification
  const sendNotification = async () => {
    if (!employeeId) {
      alert("Please enter an Employee ID");
      return;
    }

    setLoading(true);
    setNotificationResult(null);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/reclamation/notify/${employeeId}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Notification failed");
      }

      setNotificationResult(data);
    } catch (error) {
      setNotificationResult({
        error: error.message,
      });
    }

    setLoading(false);
  };

  // Process employee response
  const submitResponse = async () => {
    if (!employeeId) {
      alert("Please enter an Employee ID");
      return;
    }

    if (!response) {
      alert("Please select employee response");
      return;
    }

    setLoading(true);
    setResponseResult(null);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/reclamation/response/${employeeId}?response=${response}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Response processing failed");
      }

      setResponseResult(data);
    } catch (error) {
      setResponseResult({
        error: error.message,
      });
    }

    setLoading(false);
  };

  // Update employee status
  const updateEmployeeStatus = async () => {
    if (!employeeId) {
      alert("Please enter an Employee ID");
      return;
    }

    if (!employeeStatus) {
      alert("Please select employee status");
      return;
    }

    setLoading(true);
    setStatusResult(null);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/reclamation/employee-status/${employeeId}?status=${employeeStatus}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Status update failed");
      }

      setStatusResult(data);
    } catch (error) {
      setStatusResult({
        error: error.message,
      });
    }

    setLoading(false);
  };

  return (
    <section className="reclamation-section">

      <div className="page-title">
        <h2>License Reclamation</h2>

        <p>
          Manage unused software licenses and reclaim licenses
          when employees no longer require them.
        </p>
      </div>

      {/* EMPLOYEE ID */}

      <div className="reclamation-card">

        <h3>Employee Reclamation</h3>

        <p>
          Enter an employee ID to send a license reclamation
          notification.
        </p>

        <input
          type="text"
          placeholder="Enter Employee ID e.g. E1234"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />

        <button
          className="primary-button"
          onClick={sendNotification}
          disabled={loading}
        >
          {loading ? "Processing..." : "Send Notification"}
        </button>

      </div>


      {/* NOTIFICATION RESULT */}

      {notificationResult && (

        <div className="result-card">

          <h3>Notification Result</h3>

          {notificationResult.error ? (

            <p className="error-text">
              {notificationResult.error}
            </p>

          ) : (

            <>
              <p>
                <strong>Employee:</strong>{" "}
                {notificationResult.employee_id}
              </p>

              <p>
                <strong>Software:</strong>{" "}
                {notificationResult.software}
              </p>

              <p>
                <strong>Message:</strong>{" "}
                {notificationResult.message}
              </p>

              <p className="success-text">
                {notificationResult.status}
              </p>
            </>

          )}

        </div>

      )}


      {/* EMPLOYEE RESPONSE */}

      <div className="reclamation-card">

        <h3>Employee Response</h3>

        <p>
          Record whether the employee still requires the license.
        </p>

        <select
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        >

          <option value="">
            Select Response
          </option>

          <option value="yes">
            Yes - Still Using
          </option>

          <option value="no">
            No - Not Using
          </option>

        </select>

        <button
          className="primary-button"
          onClick={submitResponse}
          disabled={loading}
        >
          Submit Response
        </button>

      </div>


      {/* RESPONSE RESULT */}

      {responseResult && (

        <div className="result-card">

          <h3>Reclamation Response Result</h3>

          {responseResult.error ? (

            <p className="error-text">
              {responseResult.error}
            </p>

          ) : (

            <>
              <p>
                <strong>Employee:</strong>{" "}
                {responseResult.employee_id}
              </p>

              <p>
                <strong>Response:</strong>{" "}
                {responseResult.response}
              </p>

              <p className="success-text">
                License Status:{" "}
                {responseResult.license_status}
              </p>
            </>

          )}

        </div>

      )}


      {/* EMPLOYEE STATUS */}

      <div className="reclamation-card">

        <h3>Employee Status</h3>

        <p>
          Update the employee status when an employee leaves
          the company.
        </p>

        <select
          value={employeeStatus}
          onChange={(e) =>
            setEmployeeStatus(e.target.value)
          }
        >

          <option value="">
            Select Employee Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="left_company">
            Left Company
          </option>

        </select>

        <button
          className="primary-button"
          onClick={updateEmployeeStatus}
          disabled={loading}
        >
          Update Employee Status
        </button>

      </div>


      {/* STATUS RESULT */}

      {statusResult && (

        <div className="result-card">

          <h3>Status Update Result</h3>

          {statusResult.error ? (

            <p className="error-text">
              {statusResult.error}
            </p>

          ) : (

            <>
              <p>
                <strong>Employee:</strong>{" "}
                {statusResult.employee_id}
              </p>

              <p>
                <strong>Employee Status:</strong>{" "}
                {statusResult.employee_status}
              </p>

              <p>
                <strong>License Status:</strong>{" "}
                {statusResult.license_status}
              </p>

              <p className="success-text">
                Monthly Savings: ₹
                {statusResult.monthly_savings}
              </p>
            </>

          )}

        </div>

      )}

    </section>
  );
}

export default App;