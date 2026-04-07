import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, collection, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../App.css";

function AttendanceSetup() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [error, setError] = useState(""); // ✅ added

  useEffect(() => {
    const fetchTimetable = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid, "timetable", "data");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data().classes;

          const uniqueSubjects = [
            ...new Set(data.map((item) => item.subject)),
          ];

          setSubjects(uniqueSubjects);

          const initial = {};
          uniqueSubjects.forEach((sub) => {
            initial[sub] = {
              total: "",
              attended: "",
            };
          });

          setAttendance(initial);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load timetable"); // ✅ added
      }
    };

    fetchTimetable();
  }, []);

  const handleChange = (subject, field, value) => {
    setAttendance({
      ...attendance,
      [subject]: {
        ...attendance[subject],
        [field]: value === "" ? "" : Number(value),
      },
    });
  };

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
        const total = attendance[subject].total;
        const attended = attendance[subject].attended;

        if (attended > total) {
          setError(`Error in ${subject}: Attended cannot exceed total`); // ✅ updated
          return;
        }

        const percentage = getPercentage(total, attended);

        await setDoc(doc(attendanceRef, subject), {
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
          const total = attendance[subject]?.total || "";
          const attended = attendance[subject]?.attended || "";
          const percent = getPercentage(total, attended);

          return (
            <div key={subject} className="attendance-row">
              <h3>{subject}</h3>

              <label>Total Classes</label>
              <input
                type="number"
                placeholder="Enter total classes"
                value={total}
                onChange={(e) =>
                  handleChange(subject, "total", e.target.value)
                }
              />

              <label>Classes Attended</label>
              <input
                type="number"
                placeholder="Enter attended classes"
                value={attended}
                onChange={(e) =>
                  handleChange(subject, "attended", e.target.value)
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