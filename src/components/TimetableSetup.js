import React, { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../App.css";

function TimetableSetup() {
  const navigate = useNavigate();

  const [day, setDay] = useState("Monday");
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState(""); // ✅ added

  const handleAddClass = () => {
    if (!subject || !time) return;

    const newClass = { day, subject, time };
    setTimetable([...timetable, newClass]);

    setSubject("");
    setTime("");
  };

  const handleDelete = (index) => {
    const updated = timetable.filter((_, i) => i !== index);
    setTimetable(updated);
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

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

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

                  <button onClick={() => handleDelete(cls.index)}>
                    ❌
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