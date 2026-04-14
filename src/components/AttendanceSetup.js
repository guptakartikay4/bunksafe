import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, setDoc,getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../App.css";

function AttendanceSetup() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(""); // ✅ added
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 🔥 get timetable
      const docRef = doc(db, "users", user.uid, "timetable", "data");
      const docSnap = await getDoc(docRef);

      let timetableSubjects = [];

      if (docSnap.exists()) {
        timetableSubjects = docSnap
          .data()
          .classes.map((item) => item.subject);
      }

      // 🔥 get attendance subjects
      const attendanceSnap = await getDocs(
        collection(db, "users", user.uid, "attendance")
      );

      const attendanceSubjects = attendanceSnap.docs.map(
        (doc) => doc.id
      );

      // 🔥 merge BOTH
      const normalize = (s) => s.trim().toLowerCase();

const allSubjects = [
  ...new Map(
    [...timetableSubjects, ...attendanceSubjects].map((s) => [
      normalize(s),
      s.trim(), // keep clean display
    ])
  ).values(),
];

      setSubjects(allSubjects);

    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    }
  };

  fetchData();
}, []);
  useEffect(() => {
  const fetchAttendance = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const snap = await getDocs(
        collection(db, "users", user.uid, "attendance")
      );

      const data = {};

     snap.forEach((doc) => {
  const key = doc.id.trim().toLowerCase();
  data[key] = doc.data();
});

      setAttendanceData(data);

    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  fetchAttendance();
}, []);

  

  const getPercentage = (total, attended) => {
    if (!total || total === 0) return 0;
    return ((attended / total) * 100).toFixed(1);
  };

  const getColor = (percent) => {
    if (percent >= 85) return "green";
    if (percent >= 75) return "yellow";
    return "red";
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError("User not logged in"); // ✅ added
      return;
    }

    try {
      const attendanceRef = collection(
        db,
        "users",
        user.uid,
        "attendance"
      );

      for (let subject of subjects) {
        const key = subject.trim().toLowerCase();

const total = attendanceData[key]?.totalClasses ?? 0;
const attended = attendanceData[key]?.attendedClasses ?? 0;
        if (attended > total) {
          setError(`Error in ${subject}: Attended cannot exceed total`); // ✅ updated
          return;
        }

        const percentage = getPercentage(total, attended);
        await setDoc(doc(attendanceRef, key), {
          subjectName: subject,
          totalClasses: Number(total),
          attendedClasses: Number(attended),
          percentage: Number(percentage),
        });
      }

      alert("Attendance saved!");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Failed to save attendance"); // ✅ updated
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-card">
        <h2>Enter Your Attendance</h2>

        {subjects.map((subject) => {

          const key = subject.trim().toLowerCase();

          const total = attendanceData[key]?.totalClasses || 0;
          const attended = attendanceData[key]?.attendedClasses || 0;
          const percent = getPercentage(total, attended);

          return (
            <div key={subject} className="attendance-row">
              <h3>{subject}</h3>

              <label>Total Classes</label>
              <input
                type="number"
                placeholder="Enter total classes"
                value={attendanceData[key]?.totalClasses || ""}
                onChange={(e) =>
                   setAttendanceData({
                     ...attendanceData,
                     [key]: {
                       ...attendanceData[key],
                       totalClasses: Number(e.target.value)
                     },
  })
}
              />

              <label>Classes Attended</label>
              <input
                type="number"
                placeholder="Enter attended classes"
                value={attendanceData[key]?.attendedClasses || ""}
                onChange={(e) =>
  setAttendanceData({
    ...attendanceData,
    [key]: {
      ...attendanceData[key],
      attendedClasses: Number(e.target.value)
    },
  })
}
              />

              <span
                className="percentage"
                style={{ color: getColor(percent) }}
              >
                {percent}%
              </span>
            </div>
          );
        })}

        {/* ✅ error display */}
        {error && <p className="error">{error}</p>}

        <button className="save-btn" onClick={handleSave}>
          Save & Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default AttendanceSetup;