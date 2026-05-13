import { useEffect, useState, useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import ReactMarkdown from "react-markdown";

function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/topics")
      .then(res => res.json())
      .then(data => setTopics(data));
  }, []);

  // 👉 MAIN PAGE (TOPIC SELECTION)
  if (!selectedTopic) {
    return (
      <div style={{ padding: 40 }}>
        <h1>📚 Select a Topic</h1>

        <div style={{ display: "flex", gap: 20 }}>
          {topics.map(topic => (
            <div
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              style={{
                padding: 20,
                border: "1px solid #ccc",
                cursor: "pointer",
                borderRadius: 10
              }}
            >
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 👉 TOPIC VIEW
  return (
    <TopicPage
      topic={selectedTopic}
      goBack={() => setSelectedTopic(null)}
    />
  );
}

function TopicPage({ topic, goBack }) {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [onChapterCreated, setOnChapterCreated] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* LEFT SIDEBAR */}
      <Sidebar
        topic={topic}
        setSelectedChapter={setSelectedChapter}
        setSelectedModuleId={setSelectedModuleId}
        setShowCreateChapter={setShowCreateChapter}
        setOnChapterCreated={setOnChapterCreated}
      />
      

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: 20 }}>

        <button onClick={goBack}>⬅ Back</button>

        {selectedChapter ? (
          <ChapterView chapter={selectedChapter} />
        ) : (
          <h2>Select a chapter</h2>
        )}

{showCreateChapter && (
  <CreateChapterModal
    moduleId={selectedModuleId}
    onClose={() => setShowCreateChapter(false)}
    onChapterCreated={onChapterCreated}
  />
)}
      </div>
    </div>
  );
}

function Sidebar({ topic, setSelectedChapter, setSelectedModuleId, setShowCreateChapter, setOnChapterCreated }){
  const [modules, setModules] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/topics/${topic.id}/modules`)
      .then(res => res.json())
      .then(data => setModules(data));
  }, [topic]);

  return (
    <div style={{ width: 300, borderRight: "1px solid #ddd" }}>
      <h3>{topic.title}</h3>

      {modules.map(module => (
        <ModuleItem
            key={module.id}
  module={module}
  setSelectedChapter={setSelectedChapter}
  setSelectedModuleId={setSelectedModuleId}
  setShowCreateChapter={setShowCreateChapter}
  setOnChapterCreated={setOnChapterCreated}
        />
      ))}
    </div>
  );
}

function ModuleItem({
  module,
  setSelectedChapter,
  setSelectedModuleId,
  setShowCreateChapter,
  setOnChapterCreated
}){
  const [chapters, setChapters] = useState([]);

  const loadChapters = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/chapters/by-module/${module.id}`
      );

      const data = await res.json();

      console.log(data);

      setChapters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setChapters([]);
    }
  };

  // Load chapters on component mount
  useEffect(() => {
    loadChapters();
  }, [module.id]);

  const loadFullChapter = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/chapters/${id}`
      );

      const data = await res.json();

      setSelectedChapter(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ marginTop: "5px" }}>
      
      <div
        onClick={loadChapters}
        style={{
          cursor: "pointer",
          color: "#333"
        }}
      >
        📁 {module.title}
      </div>

      <button onClick={() => {
  setSelectedModuleId(module.id);
  setOnChapterCreated(() => loadChapters);
  setShowCreateChapter(true);
}}>
  + Add Chapter
</button>

      {/* CHAPTERS */}
      <div style={{ marginLeft: "15px" }}>
        {Array.isArray(chapters) &&
          chapters.map(chapter => (
            <div
              key={chapter.id}
              onClick={() => loadFullChapter(chapter.id)}
              style={{
                cursor: "pointer",
                color: "blue",
                fontSize: "14px"
              }}
            >
              📄 {chapter.title}
            </div>
          ))}
      </div>

    </div>
  );
}

function ChapterView({ chapter }) {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(chapter);

  // Update currentChapter whenever the chapter prop changes
  useEffect(() => {
    setCurrentChapter(chapter);
  }, [chapter.id]);

  const reloadChapter = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/chapters/${chapter.id}`);
      const data = await res.json();
      setCurrentChapter(data);
    } catch (err) {
      console.error("Error reloading chapter:", err);
    }
  };

  return (
    <div>
      <h1>{currentChapter.title}</h1>

      <div style={{
  background: "#f5f5f5",
  padding: 20,
  borderRadius: 10
}}>
  <ReactMarkdown>
    {currentChapter.content}
  </ReactMarkdown>
</div>

<button onClick={() => setShowQuizModal(true)}>
  + Add Quiz Question
</button>
{showQuizModal && (
  <CreateQuizModal
    chapterId={chapter.id}
    onClose={() => setShowQuizModal(false)}
    onQuizCreated={reloadChapter}
  />
)}
      <Quiz chapter={currentChapter} />
    </div>
  );
}

function Quiz({ chapter }) {
  const questions = chapter?.quiz_questions || [];

  const [answers, setAnswers] = useState({});

  const submitQuiz = () => {
    let score = 0;

    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) {
        score++;
      }
    });

    alert(`Score: ${score}/${questions.length}`);
  };

  return (
    <div>
      <h2>Quiz</h2>

      {questions.map((q, i) => (
        <div key={q.id}>
          <p>{q.question}</p>

          {q.options.map((opt, idx) => (
            <div key={idx}>
              <input
                type="radio"
                name={i}
                onChange={() =>
                  setAnswers({ ...answers, [i]: idx })
                }
              />
              {opt}
            </div>
          ))}
        </div>
      ))}

      <button onClick={submitQuiz}>Submit</button>
    </div>
  );
}

function CreateChapterModal({ onClose, moduleId, onChapterCreated }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const editorOptions = useMemo(() => ({
    spellChecker: false,
    placeholder: "Write Markdown here..."
  }), []);

  const createChapter = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: moduleId,
          title,
          content
        })
      });

      if (!response.ok) {
        console.error(`Error creating chapter: ${response.status}`);
        alert("Failed to create chapter. Check console for details.");
        return;
      }

      if (onChapterCreated) {
        await onChapterCreated();
      }

      onClose();
    } catch (error) {
      console.error("Error creating chapter:", error);
      alert("Error creating chapter");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)"
    }}>
      
      <div style={{
        background: "white",
        padding: 20,
        margin: "5% auto",
        width: 700,
        borderRadius: 10
      }}>

        <h3>Create Chapter</h3>

        <input
          placeholder="Chapter Title"
          onChange={e => setTitle(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />

        <div style={{ marginTop: 10 }}>
          <SimpleMDE
            value={content}
            onChange={setContent}
            options={editorOptions}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <button onClick={createChapter}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>

      </div>
    </div>
  );
}

function CreateQuizModal({ chapterId, onClose, onQuizCreated }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    "",
    "",
    "",
    ""
  ]);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const createQuiz = async () => {
    const token = localStorage.getItem('token');
    
    await fetch("http://localhost:5000/api/quiz/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        chapter_id: chapterId,
        question,
        options,
        correct_answer: correctAnswer
      })
    });

    // Reload chapter data after creating quiz
    if (onQuizCreated) {
      await onQuizCreated();
    }

    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)"
    }}>
      <div style={{
        background: "white",
        width: 500,
        margin: "10% auto",
        padding: 20
      }}>

        <h2>Create Quiz Question</h2>

        <input
          placeholder="Question"
          onChange={e => setQuestion(e.target.value)}
        />

        {options.map((opt, i) => (
          <div key={i}>
            <input
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={e => {
                const newOptions = [...options];
                newOptions[i] = e.target.value;
                setOptions(newOptions);
              }}
            />

            <input
              type="radio"
              checked={correctAnswer === i}
              onChange={() => setCorrectAnswer(i)}
            />

            Correct
          </div>
        ))}

        <button onClick={createQuiz}>
          Save Quiz
        </button>

        <button onClick={onClose}>
          Cancel
        </button>

      </div>
    </div>
  );
}

export default App;