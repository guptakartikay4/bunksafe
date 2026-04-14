import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { getGeminiRecommendation } from "../utils/gemini";

function PlanWeek() {
  const navigate = useNavigate();

  const [timetable, setTimetable] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [aiText, setAiText] = useState("");

  // 🔥 Fetch timetable + attendance
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // timetable
        const timetableDoc = await getDoc(
          doc(db, "users", user.uid, "timetable", "data")
        );

        if (timetableDoc.exists()) {
          setTimetable(timetableDoc.data().classes);
        }

        // attendance
        const attendanceSnap = await getDocs(
          collection(db, "users", user.uid, "attendance")
        );

        const attendanceData = attendanceSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAttendance(attendanceData);

      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      }
    };

    fetchData();
  }, []);

  // 🔥 Main logic
  const generatePlan = async () => {
    if (timetable.length === 0 || attendance.length === 0) {
      setError("Missing timetable or attendance data");
      return;
    }

    // get classes on selected day
    const dayClasses = timetable.filter(
      (cls) => cls.day === selectedDay
    );

    let safe = true;
    const subjectImpact = [];

    dayClasses.forEach((cls) => {
      const subjectData = attendance.find(
        (a) => a.subjectName === cls.subject
      );

      if (!subjectData) return;

      const total = subjectData.totalClasses + 1; // bunk → total increases
      const attended = subjectData.attendedClasses;

      const newPercent = (attended / total) * 100;

      const isSafe = newPercent >= 75;

      if (!isSafe) safe = false;

      subjectImpact.push({
        subject: cls.subject,
        percent: newPercent.toFixed(1),
        safe: isSafe,
      });
    });
    // 🔥 Call Gemini for recommendation
const aiResponse = await getGeminiRecommendation({
  day: selectedDay,
  subjects: subjectImpact,
});

setAiText(aiResponse);

    setResult({
      day: selectedDay,
      safe,
      subjectImpact,
    });
  };

  return (
    <div className="dashboard">
      <div className="top-card">
        <h2>Plan My Week</h2>

        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
          <option>Saturday</option>
        </select>

        <button onClick={generatePlan}>
          Generate Plan
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {/* RESULT */}
      {result && (
        <div className="subject-card">
          <h3>Day: {result.day}</h3>

          <h2 style={{ color: result.safe ? "#4ecca3" : "#e74c3c" }}>
            {result.safe ? "Safe ✅" : "Not Safe 🔴"}
          </h2>

          {result.subjectImpact.map((sub, i) => (
            <p key={i}>
              {sub.subject}: {sub.percent}% →{" "}
              {sub.safe ? "Safe" : "Risk"}
            </p>
          ))}

          <p style={{ marginTop: "10px" }}>
            {result.safe
              ? "You can take this day off safely."
              : "Some subjects may fall below 75%. Avoid bunking."}
          </p>
        </div>
      )}
      {aiText && (
  <div className="subject-card" style={{ marginTop: "15px" }}>
    <h3>AI Recommendation</h3>
    <p>{aiText}</p>
  </div>
)}

      <button onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );
}

export default PlanWeek;