import { db, doc, setDoc } from "./firebase.js";
import { updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const EXAM_ID = "monroe_intelligence_eval";

// --- 1. SINGLE-DOCUMENT DATABASE SEEDING ---
export async function seedSingleDocumentExam() {
  await setDoc(doc(db, "exam", EXAM_ID), {
    title: "Monroe Corporation Standardized General Intelligence Evaluation",
    requiredPassPercentage: 85,
    totalPoints: 150,
    questions: [
      { id: "q1", number: 1, questionText: "What is the sum of the following equation?\n“2+((3+4)^2)”", type: "written", maxPoints: 8 },
      { id: "q2", number: 2, questionText: "Name all grammatical issues in the following sentence:\n“Want to eat john?”", type: "written", maxPoints: 8 },
      { id: "q3", number: 3, questionText: "Write a paragraph about your believed outcome and status of humanity by the year 2035 and explain your answer.", type: "written", maxPoints: 8 },
      { id: "q4", number: 4, questionText: "Break the following equation into blocks, solve it and explain the order of operations in relation to this equation:\n“2^2/(5+3-2)*4”", type: "written", maxPoints: 8 },
      { id: "q5", number: 5, questionText: "To the best of your ability, in one paragraph or less, explain Einstein's Theory of Relativity.", type: "written", maxPoints: 8 },
      { id: "q6", number: 6, questionText: "Explain inflation as if you were speaking to a 2nd Grader in one paragraph or less.", type: "written", maxPoints: 8 },
      { id: "q7", number: 7, questionText: "What is the quotient of the following equation:\n“3/(3^4-3)”", type: "written", maxPoints: 8 },
      { id: "q8", number: 8, questionText: "Name all grammatical issues in the following sentence:\n“security It’s the best In the world?”", type: "written", maxPoints: 8 },
      { id: "q9", number: 9, questionText: "Name all common units of measurement currently in the metric system.", type: "written", maxPoints: 8 },
      { id: "q10", number: 10, questionText: "In a paragraph or less, explain why Artificial Intelligence may or may not be a leading factor in the decline of humanity.", type: "written", maxPoints: 8 },
      { id: "q11", number: 11, questionText: "What is the correct demonstration Order of Operations", type: "multiple_choice", maxPoints: 5, options: ["a. ()^*/+-", "b. *-/+^()", "c. -+/*^()", "d. *()^/-+"], correctAnswer: "a" },
      { id: "q12", number: 12, questionText: "What is the correct extended-name of “DVD”", type: "multiple_choice", maxPoints: 5, options: ["a. Disc Video Deletion", "b. Digital Video Disc", "c. Disc Version Delta", "d. Digital Versatile Disc"], correctAnswer: "d" },
      { id: "q13", number: 13, questionText: "Which is the correct statement (In terms of quality and capacity)?", type: "multiple_choice", maxPoints: 5, options: ["a. “DVD is superior to CD and Laser Disc”", "b. “Laser Disc is superior to DVD”", "c. “Compact Disc is superior to DVD”", "d. “DVD is superior to Blue-Ray”"], correctAnswer: "a" },
      { id: "q14", number: 14, questionText: "Name the correct quotient of 3/(3^3-(3*2))", type: "multiple_choice", maxPoints: 5, options: ["a. 9", "b. 8", "c. 7", "d. 6"], correctAnswer: "c" },
      { id: "q15", number: 15, questionText: "What is the correct term for a singular octopus?", type: "multiple_choice", maxPoints: 5, options: ["a. Octopi", "b. Octi", "c. Opctopus", "d. Octpi"], correctAnswer: "a" },
      { id: "q16", number: 16, questionText: "What is the fifth president of the United States?", type: "multiple_choice", maxPoints: 5, options: ["a. James Monroe", "b. Aberham Lincoln", "c. George Washington", "d. Thomas Jefferson"], correctAnswer: "a" },
      { id: "q17", number: 17, questionText: "What is the name of a large, high-volume capacity, high-speed limit road?", type: "multiple_choice", maxPoints: 5, options: ["a. Street", "b. Highway", "c. Avenue", "d. Boulevard"], correctAnswer: "b" },
      { id: "q18", number: 18, questionText: "A Leucectomy is another term for what Medical Procedure", type: "multiple_choice", maxPoints: 5, options: ["a. Kidney Transplant", "b. Gallbladder Removal", "c. OCD Shock Therapy", "d. Lobotmy"], correctAnswer: "d" },
      { id: "q19", number: 19, questionText: "What Does “OLED” Stand For?", type: "multiple_choice", maxPoints: 5, options: ["a. Organic-Light Emitting Diode", "b. On-Light Essential Display", "c. Organic-Longevity Environmental Display", "d. On-Light Emitting Display"], correctAnswer: "a" },
      { id: "q20", number: 20, questionText: "What is the correct term to describe the sentence “I like David Bowie”?", type: "multiple_choice", maxPoints: 5, options: ["a. Opinion", "b. Fact", "c. Evidence", "d. Not True"], correctAnswer: "a" },
      { id: "q21", number: 21, questionText: "Place the dot on -3\n———————————————————————————————\n-5 -4 -2 -1 0 1 2 4 5", type: "other", maxPoints: 2 },
      { id: "q22", number: 22, questionText: "Solve\n93, 463\n34, 698. 65\n ×——————", type: "other", maxPoints: 2 },
      { id: "q23", number: 23, questionText: "Solve\n32, 304. 54\n13. 591\n ×——————", type: "other", maxPoints: 2 },
      { id: "q24", number: 24, questionText: "Circle the rectangle", type: "other", maxPoints: 2 },
      { id: "q25", number: 25, questionText: "Demonstrate the Mathematical Order of Operations in an equation:", type: "other", maxPoints: 2 },
      { id: "q26", number: 26, questionText: "Divide 32,604 by 8", type: "other", maxPoints: 2 },
      { id: "q27", number: 27, questionText: "Draw a house", type: "other", maxPoints: 2 },
      { id: "q28", number: 28, questionText: "Name 6 or more Presidents of the United States", type: "other", maxPoints: 2 },
      { id: "q29", number: 29, questionText: "Provide an example of gravity", type: "other", maxPoints: 2 },
      { id: "q30", number: 30, questionText: "Draw a male human aged 40", type: "other", maxPoints: 2 }
    ]
  });
}

// --- 2. STUDENT SUBMISSION FUNCTION ---
export async function submitStudentExam(studentId, studentName, answers) {
  const grades = {};
  const MC_ANSWER_KEY = {
    q11: "a", q12: "d", q13: "a", q14: "c", q15: "a", q16: "a", q17: "b", q18: "d", q19: "a", q20: "a"
  };

  for (let i = 11; i <= 20; i++) {
    const qId = `q${i}`;
    const studentAnswer = answers[qId]?.toLowerCase();
    const isCorrect = studentAnswer === MC_ANSWER_KEY[qId];
    grades[qId] = {
      score: isCorrect ? 5 : 0,
      feedback: isCorrect ? "Auto-graded: Correct" : `Auto-graded: Incorrect. (Correct was ${MC_ANSWER_KEY[qId].toUpperCase()})`,
      gradedBy: "system"
    };
  }

  const manualQuestions = [
    ...Array.from({ length: 10 }, (_, i) => `q${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `q${i + 21}`)
  ];
  
  manualQuestions.forEach((qId) => {
    grades[qId] = { score: null, feedback: null, gradedBy: null };
  });

  const submissionRef = doc(db, "exam", EXAM_ID, "submissions", studentId);
  await setDoc(submissionRef, {
    studentId,
    studentName,
    answers,
    grades,
    status: "pending_review",
    submittedAt: new Date()
  });
}

// --- 3. ADMIN GRADING FUNCTION ---
export async function gradeSubmission(studentId, adminId, manualScores) {
  const subRef = doc(db, "exam", EXAM_ID, "submissions", studentId);
  const updates = {};

  Object.entries(manualScores).forEach(([qId, grade]) => {
    updates[`grades.${qId}`] = {
      score: grade.score,
      feedback: grade.feedback,
      gradedBy: adminId
    };
  });

  updates.status = "graded";
  await updateDoc(subRef, updates);
}
