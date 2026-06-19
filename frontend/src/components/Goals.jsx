import React, { useState, useEffect } from "react";
import { Plus, Trash2, Milestone, Calendar, PiggyBank } from "lucide-react";

export default function Goals({ token, dataVersion, triggerRefresh }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    fetchGoals();
  }, [token, dataVersion]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/goals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setGoals(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount || !deadline) return;
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          target_amount: parseFloat(targetAmount),
          current_amount: parseFloat(currentAmount || "0"),
          deadline
        })
      });

      if (res.ok) {
        setName("");
        setTargetAmount("");
        setCurrentAmount("0");
        setDeadline("");
        if (triggerRefresh) triggerRefresh();
        else fetchGoals();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to create goal");
      }
    } catch (err) {
      setError("Network error. Try again.");
    }
  };

  const handleAddMoney = async (id, amountToAdd) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/goals/${id}/add-money`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amountToAdd })
      });
      if (res.ok) {
        if (triggerRefresh) triggerRefresh();
        else fetchGoals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/goals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (triggerRefresh) triggerRefresh();
        else fetchGoals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", color: "white" }}>Goal Tracker</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "28px" }}>
        
        {/* Left Form: New Goal */}
        <div className="glass-card" style={{ height: "fit-content" }}>
          <h2 style={{ fontSize: "18px", color: "white", marginBottom: "20px" }}>New Goal</h2>
          <form onSubmit={handleCreateGoal}>
            <div className="form-group">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Goal name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <input 
                type="number" 
                className="form-control" 
                placeholder="Target amount" 
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <input 
                type="number" 
                className="form-control" 
                placeholder="0" 
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <input 
                type="date" 
                className="form-control" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn" style={{ width: "100%", background: "linear-gradient(135deg, var(--primary), #a855f7)", marginTop: "10px" }}>
              Create goal
            </button>
          </form>
        </div>

        {/* Right Panel: Goals List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {loading ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading goals...</div>
          ) : goals.length === 0 ? (
            <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "60px 0" }}>
              <PiggyBank size={48} style={{ color: "var(--panel-border)", marginBottom: "12px" }} />
              <p>No savings goals set yet.</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Start planning by creating a goal on the left panel.</p>
            </div>
          ) : (
            goals.map((g) => {
              const progressPct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
              return (
                <div key={g.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h3 style={{ fontSize: "18px", color: "white", fontWeight: "600" }}>{g.name}</h3>
                    <button 
                      onClick={() => handleDeleteGoal(g.id)}
                      style={{ 
                        background: "rgba(255, 255, 255, 0.04)", 
                        border: "none", 
                        color: "var(--text-dim)", 
                        cursor: "pointer", 
                        padding: "6px", 
                        borderRadius: "8px", 
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "var(--transition-smooth)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--danger)";
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-dim)";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ fontSize: "20px", fontWeight: "700", color: "white" }}>
                    ₹{g.current_amount.toLocaleString()} <span style={{ color: "var(--text-dim)", fontSize: "16px", fontWeight: "400" }}>/ ₹{g.target_amount.toLocaleString()}</span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="progress-bar-bg" style={{ height: "10px", marginTop: "0" }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progressPct}%`, background: "var(--success)" }} 
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                      <span>{progressPct}% complete</span>
                      <span>deadline {g.deadline}</span>
                    </div>
                  </div>

                  {/* Add money button */}
                  <button 
                    className="btn" 
                    onClick={() => handleAddMoney(g.id, 1000)}
                    style={{ 
                      background: "rgba(99, 102, 241, 0.1)", 
                      border: "1px solid rgba(99, 102, 241, 0.2)", 
                      color: "white", 
                      width: "100%",
                      fontSize: "14px",
                      fontWeight: "600",
                      padding: "10px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary)";
                      e.currentTarget.style.borderColor = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
                    }}
                  >
                    Add ₹1,000
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
