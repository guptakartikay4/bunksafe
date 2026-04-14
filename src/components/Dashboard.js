import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Dashboard() {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState({});
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); 
  const [marked, setMarked] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
     const snap = await getDocs(
  collection(db, "users", user.uid, "attendance")
);

const data = {};

snap.forEach((docSnap) => {
  const d = docSnap.data();

  const key = docSnap.id.trim().toLowerCase();

  data[key] = {
    subjectName: d.subjectName || docSnap.id,
    totalClasses: Number(d.totalClasses) || 0,
    attendedClasses: Number(d.attendedClasses) || 0,
    percentage:
      d.percentage !== undefined
        ? Number(d.percentage)
        : d.totalClasses > 0
        ? (d.attendedClasses / d.totalClasses) * 100
        : 0,
  };
});

setAttendance(data);
console.log("attendance:", data);

        const timetableDoc = await getDoc(
          doc(db, "users", user.uid, "timetable", "data")
        );

        if (timetableDoc.exists()) {
          setTimetable(timetableDoc.data().classes);
        }

      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data"); // ✅ added
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const overallPercentage = () => {
  const subjects = Object.values(attendance);

  if (subjects.length === 0) return 0;

  let total = 0;
  let attended = 0;

  subjects.forEach((sub) => {
total += Number(sub.totalClasses) || 0;
attended += Number(sub.attendedClasses) || 0;
  });

  return total === 0 ? 0 : ((attended / total) * 100).toFixed(1);
};

  const getStatus = (percent) => {
    if (percent >= 85) return "Safe ✅";
    if (percent >= 75) return "Warning ⚠️";
    return "Danger 🔴";
  };

  const getColor = (percent) => {
    if (percent >= 85) return "#4ecca3";
    if (percent >= 75) return "#ffc107";
    return "#e74c3c";
  };
  // 🔥 Risk forecast per subject
const getRiskMessage = (percent) => {
  if (percent < 75) {
    return {
      text: "Critical: Below required attendance",
      color: "#e74c3c",
    };
  }
  if (percent <= 80) {
    return {
      text: "Caution: One or two more bunks may put you at risk",
      color: "#ffc107",
    };
  }
  return {
    text: "Safe zone",
    color: "#4ecca3",
  };
};

// 🔥 Overall trend
const getOverallTrend = (percent) => {
  if (percent < 75) return "Danger 🔴";
  if (percent <= 80) return "Warning ⚠️";
  return "Safe ✅";
};

  // ✅ FIXED bunk calculation
  const getBunk = (attended, total) => {
    if (total === 0) return 0;
    const safe = Math.floor((attended - 0.75 * total) / 0.75);
    return safe > 0 ? safe : 0;
  };

  const getRequired = (attended, total) => {
    let x = 0;
    while ((attended + x) / (total + x) < 0.75) {
      x++;
    }
    return x;
  };

  const markAttendance = async (subject, type) => {
    const user = auth.currentUser;

    try {
      const key = subject.trim().toLowerCase();

      const ref = doc(db, "users", user.uid, "attendance", key);
      
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      let data = snap.data();

      let newTotal = data.totalClasses + 1;
      let newAttended =
        type === "present"
          ? data.attendedClasses + 1
          : data.attendedClasses;

      const percentage = ((newAttended / newTotal) * 100).toFixed(1);

      await updateDoc(ref, {
        totalClasses: newTotal,
        attendedClasses: newAttended,
        percentage: Number(percentage),
      });
    setAttendance((prev) => {
  const updated = { ...prev };

  if (!updated[subject]) return prev; // subject is already normalized key

  updated[subject] = {
    ...updated[subject],
    totalClasses: newTotal,
    attendedClasses: newAttended,
    percentage: Number(percentage),
  };

  return updated;
});

      

    } catch (err) {
      console.error(err);
      setError("Failed to update attendance"); // ✅ added
    }
  };
  const handleCancel = (subjectKey) => {
  setMarked((prev) => ({ ...prev, [subjectKey]: true }));
};

  const today = new Date().toLocaleString("en-US", { weekday: "long" });
  const todaysClasses = timetable.filter((cls) => {
  const key = cls.subject.trim().toLowerCase();

  return (
    cls.day === today &&
    attendance[key] // ✅ only show if exists in attendance
  );
});


  if (loading) {
    return <div className="spinner"></div>;
  }

  // ✅ show error if exists
  if (error) {
    return <p className="error">{error}</p>;
  }

  if (Object.keys(attendance).length === 0) {
  return (
    <div className="empty-state">
      <h2>No attendance data yet</h2>
      <button onClick={() => navigate("/attendance-setup")}>
        Add Attendance
      </button>
    </div>
  );
}

  if (timetable.length === 0) {
    return (
      <div className="empty-state">
        <h2>Welcome 👋</h2>
        <p>You haven’t added your timetable yet.</p>
        <button onClick={() => navigate("/timetable-setup")}>
          Setup My Timetable
        </button>
      </div>
    );
  }

  const overall = overallPercentage();
  console.log("FINAL ATTENDANCE:", attendance);

  return (
    <div className="dashboard">
      <div className="top-card">
        <h2>Hi, {auth.currentUser?.email}! 👋</h2>
        <h1>{overall}%</h1>
        <p>{getStatus(overall)}</p>
        <p>
          Overall Trend: {getOverallTrend(overall)}
        </p>
      </div>

      <div className="subjects">
        {Object.values(attendance).map((sub) => {
          const percent = Number(sub.percentage) || 0;
          const bunk = getBunk(sub.attendedClasses, sub.totalClasses);
          const required = getRequired(
            sub.attendedClasses,
            sub.totalClasses
          );

          return (
            <div className="subject-card" key={sub.subjectName}>
              <h3>{sub.subjectName}</h3>
              <h2 style={{ color: getColor(percent) }}>{percent}%</h2>

              <div className="progress">
                <div
                  className="progress-bar"
                  style={{
                    width: `${percent}%`,
                    background: getColor(percent),
                  }}
                />
              </div>

              {bunk > 0 ? (
                <p>Can safely bunk {bunk} classes</p>
              ) : (
                <p style={{ color: "red" }}>🔴 DO NOT BUNK</p>
              )}

              {percent < 75 && (
                <p>Must attend next {required} classes</p>
              )}
            </div>
          );
        })}
      </div>
      {/* 🔥 Risk Forecast Section */}
<div className="subjects">
  <h2 style={{ marginTop: "20px" }}>Risk Forecast</h2>

  {Object.values(attendance).map((sub) => {
    const percent = Number(sub.percentage) || 0;
    const risk = getRiskMessage(percent);

    return (
      <div className="subject-card" key={sub.subjectName + "-risk"}>
        <h3>{sub.subjectName}</h3>

        <p style={{ color: risk.color }}>
          {risk.text}
        </p>
      </div>
    );
  })}
</div>

      <div className="today">
        <h2>Today's Classes</h2>

        {todaysClasses.map((cls, i) => {
  const key = cls.subject.trim().toLowerCase();

  return (
    <div key={cls.subject + i} className="today-card">
      <span>{cls.subject}</span>

      <div>
        {/* ✅ PRESENT */}
        <button
          disabled={marked[key]}
          onClick={() => {
            markAttendance(key, "present");
            setMarked((prev) => ({ ...prev, [key]: true }));
          }}
        >
          ✅
        </button>

        {/* ⛔ CANCEL */}
        <button
          disabled={marked[key]}
          onClick={() => handleCancel(key)}
        >
          ⛔
        </button>

        {/* ❌ ABSENT */}
        <button
          disabled={marked[key]}
          onClick={() => {
            markAttendance(key, "absent");
            setMarked((prev) => ({ ...prev, [key]: true }));
          }}
        >
          ❌
        </button>
      </div>
    </div>
  );
})}
      </div>

      <div className="bottom-nav">
        <button onClick={() => navigate("/plan")}>🧠 Plan My Week</button>
        <button onClick={() => navigate("/friends")}>👥 Friends</button>
        <button onClick={() => navigate("/timetable-setup")}>
          ⚙️ Edit
        </button>
        <button
  onClick={async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }}
>
  🚪 Logout
</button>
      </div>
    </div>
  )
}

export default Dashboard;