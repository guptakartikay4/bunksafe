// 🔥 Gemini API helper (simple + safe fallback)

export const getGeminiRecommendation = async ({
  day,
  subjects,
}) => {
  try {
    const prompt = `
You are an assistant helping a college student manage attendance.

Day selected: ${day}

Subjects:
${subjects
  .map(
    (s) =>
      `${s.subject}: ${s.percent}% (${s.safe ? "Safe" : "Risk"})`
  )
  .join("\n")}

Give a short 2-3 line recommendation on whether the student should bunk and what to be careful about.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Plan looks okay. Stay above 75% attendance."
    );

  } catch (error) {
    console.error("Gemini error:", error);

    // ✅ fallback
    return "You can proceed cautiously. Avoid risking low-attendance subjects.";
  }
};