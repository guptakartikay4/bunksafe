import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../App.css";



function TimetableSetup() {
  const navigate = useNavigate();

  const [day, setDay] = useState("Monday");
  const [subject, setSubject] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState(""); // ✅ added
  const [hour, setHour] = useState("9");
 const [minute, setMinute] = useState("00");
 const [period, setPeriod] = useState("AM");

  useEffect(() => {
  const fetchTimetable = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid, "timetable", "data");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        let rawData = docSnap.exists() ? docSnap.data().classes || [] : [];

// 🔥 ALSO FETCH attendance subjects


const attendanceSnap = await getDocs(
  collection(db, "users", user.uid, "attendance")
);

const attendanceSubjects = attendanceSnap.docs.map(doc => ({
  subject: doc.id,
  day: "Monday", // default fallback
  time: "9:00 AM", // placeholder
}));

// 🔥 Merge both
const merged = [...rawData];

// add missing subjects from attendance
attendanceSubjects.forEach((subj) => {
  const exists = merged.some(
  (cls) =>
    cls.subject.trim().toLowerCase() ===
    subj.subject.trim().toLowerCase()
);

  if (!exists) {
    merged.push(subj);
  }
});

// 🔥 Normalize old + new data
const normalizedData = merged.map((cls) => {
  let time = cls.time;

  // convert old "09:25" → "9:25 AM"
  if (time && !time.includes("AM") && !time.includes("PM")) {
    let [h, m] = time.split(":");
    let hour = parseInt(h);
    let period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    time = `${hour}:${m} ${period}`;
  }

  return {
    day: cls.day || "Monday", // fallback if missing
    subject: cls.subject.trim(),
    time,
  };
});

setTimetable(normalizedData);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
    }
  };

  fetchTimetable();
}, []);

  const handleAddClass = () => {
  if (!subject.trim()) {
    setError("Subject name required");
    return;
  }

  const formattedTime = `${hour}:${minute} ${period}`;
  const normalizedSubject = subject.trim().toLowerCase();

  // 🔴 CHECK DUPLICATE
  const exists = timetable.some(
    (cls) =>
      cls.subject.trim().toLowerCase() === normalizedSubject &&
      cls.day === day &&
      cls.time === formattedTime
  );

  if (exists) {
    setError("Class already exists");
    return;
  }

  // ✅ ADD ONLY IF UNIQUE
  const newClass = {
    day,
    subject: subject.trim(),
    time: formattedTime,
  };

  setTimetable([...timetable, newClass]);

  setSubject("");
  setError(""); // clear old error
};

  const handleDeleteClass = async (index) => {
  const user = auth.currentUser;
  if (!user) return;

  const updated = timetable.filter((_, i) => i !== index);

  try {
    await updateDoc(
      doc(db, "users", user.uid, "timetable", "data"),
      { classes: updated }
    );

    setTimetable(updated);

  } catch (error) {
    console.error(error);
  }
};

const handleDeleteSubject = async (subjectName) => {
  const user = auth.currentUser;
  if (!user) return;

  if (!window.confirm(`Delete ${subjectName} completely?`)) return;

  const updated = timetable.filter(
    (cls) => cls.subject !== subjectName
  );

  try {
    await updateDoc(
      doc(db, "users", user.uid, "timetable", "data"),
      { classes: updated }
    );

    const key = subjectName.trim().toLowerCase();

await deleteDoc(
  doc(db, "users", user.uid, "attendance", key)
);

    setTimetable(updated);

  } catch (error) {
    console.error(error);
  }
};
  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) {
      setError("User not logged in"); // ✅ updated
      return;
    }

    try {
      await setDoc(doc(db, "users", user.uid, "timetable", "data"), {
        classes: timetable,
        updatedAt: new Date(),
      });

      alert("Timetable saved!");
      navigate("/attendance-setup");

    } catch (err) {
      console.error(err);
      setError("Failed to save timetable"); // ✅ updated
    }
  };

  const grouped = timetable.reduce((acc, item, index) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push({ ...item, index });
    return acc;
  }, {});

  return (
    <div className="timetable-container">
      <div className="timetable-card">
        <h2>Setup Your Timetable</h2>

        <div className="form-row">
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
          </select>

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <div className="time-input">
  {/* Hour */}
  <select value={hour} onChange={(e) => setHour(e.target.value)}>
    {[...Array(12)].map((_, i) => (
      <option key={i} value={i + 1}>
        {i + 1}
      </option>
    ))}
  </select>

  :

  {/* Minute */}
  <select value={minute} onChange={(e) => setMinute(e.target.value)}>
    {[...Array(60)].map((_, i) => (
      <option key={i} value={i.toString().padStart(2, "0")}>
        {i.toString().padStart(2, "0")}
      </option>
    ))}
  </select>

  {/* AM/PM */}
  <select value={period} onChange={(e) => setPeriod(e.target.value)}>
    <option value="AM">AM</option>
    <option value="PM">PM</option>
  </select>
</div>

          <button onClick={handleAddClass}>Add Class</button>
        </div>

        <div className="timetable-list">
          {Object.keys(grouped).map((day) => (
            <div key={day} className="day-group">
              <h3>{day}</h3>

              {grouped[day].map((cls) => (
                <div key={cls.index} className="class-item">
                  <span>
                    {cls.subject} - {cls.time}
                  </span>

                  <button onClick={() => handleDeleteClass(cls.index)}>
                    ❌
                  </button>
                  {/* delete full subject */}
  <button
    style={{ color: "red", marginLeft: "8px" }}
    onClick={() => handleDeleteSubject(cls.subject)}
  >
    🗑
  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ✅ error display */}
        {error && <p className="error">{error}</p>}

        <button className="save-btn" onClick={handleSave}>
          Save Timetable
        </button>
      </div>
    </div>
  );
}

export default TimetableSetup;