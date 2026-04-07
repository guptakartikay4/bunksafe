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

  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // ✅ added

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const attendanceSnap = await getDocs(
          collection(db, "users", user.uid, "attendance")
        );

        const attendanceData = attendanceSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAttendance(attendanceData);

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
    if (attendance.length === 0) return 0;

    let total = 0;
    let attended = 0;

    attendance.forEach((sub) => {
      total += sub.totalClasses;
      attended += sub.attendedClasses;
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
      const ref = doc(db, "users", user.uid, "attendance", subject);
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

      window.location.reload();

    } catch (err) {
      console.error(err);
      setError("Failed to update attendance"); // ✅ added
    }
  };

  const today = new Date().toLocaleString("en-US", { weekday: "long" });
  const todaysClasses = timetable.filter((cls) => cls.day === today);

  if (loading) {
    return <div className="spinner"></div>;
  }

  // ✅ show error if exists
  if (error) {
    return <p className="error">{error}</p>;
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

  return (
    <div className="dashboard">
      <div className="top-card">
        <h2>Hi, {auth.currentUser?.email}! 👋</h2>
        <h1>{overall}%</h1>
        <p>{getStatus(overall)}</p>
      </div>

      <div className="subjects">
        {attendance.map((sub) => {
          const percent = sub.percentage;
          const bunk = getBunk(sub.attendedClasses, sub.totalClasses);
          const required = getRequired(
            sub.attendedClasses,
            sub.totalClasses
          );

          return (
            <div className="subject-card" key={sub.id}>
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

      <div className="today">
        <h2>Today's Classes</h2>

        {todaysClasses.map((cls, i) => (
          <div key={i} className="today-card">
            <span>{cls.subject}</span>

            <div>
              <button onClick={() => markAttendance(cls.subject, "present")}>
                ✅
              </button>
              <button onClick={() => markAttendance(cls.subject, "absent")}>
                ❌
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-nav">
        <button onClick={() => navigate("/plan")}>🧠 Plan</button>
        <button onClick={() => navigate("/friends")}>👥 Friends</button>
        <button onClick={() => navigate("/timetable-setup")}>
          ⚙️ Edit
        </button>
        <button onClick={() => auth.signOut()}>🚪 Logout</button>
      </div>
    </div>
  );
}

export default Dashboard;