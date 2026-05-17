import { useEffect, useState, useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./components/CodeBlock";

function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showCreateTopic, setShowCreateTopic] = useState(false);

  const reloadTopics = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/topics");
      const data = await res.json();
      console.log("TOPICS API RESPONSE:", data);
      if (Array.isArray(data)) {
        setTopics(data);
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error(err);
      setTopics([]);
    }
  };

  useEffect(() => {
    reloadTopics();
  }, []);

  // 👉 MAIN PAGE (TOPIC SELECTION)
  if (!selectedTopic) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <h1>📚 Select a Topic</h1>
          <button
            onClick={() => setShowCreateTopic(true)}
            style={{
              padding: "10px 20px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            + Add Topic
          </button>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {topics.map(topic => (
            <div
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              style={{
                padding: 20,
                border: "1px solid #ccc",
                cursor: "pointer",
                borderRadius: 10,
                flex: "0 1 calc(33.333% - 14px)",
                minWidth: 250
              }}
            >
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </div>
          ))}
        </div>

        {showCreateTopic && (
          <CreateTopicModal
            onClose={() => setShowCreateTopic(false)}
            onTopicCreated={() => {
              reloadTopics();
              setShowCreateTopic(false);
            }}
          />
        )}
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
  const [showCreateModule, setShowCreateModule] = useState(false);

  const loadModules = async () => {
    try {
      const res = await fetch(`https://codeverse-backend-05ko.onrender.com/api/topics/${topic.id}/modules`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setModules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading modules:", err);
      setModules([]);
    }
  };

  useEffect(() => {
    loadModules();
  }, [topic]);

  return (
    <div style={{ width: 300, borderRight: "1px solid #ddd", padding: 10 }}>
      <h3 style={{ marginBottom: 10 }}>{topic.title}</h3>
      <button
        onClick={() => setShowCreateModule(true)}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          marginBottom: 15,
          fontSize: "14px"
        }}
      >
        + Add Module
      </button>

      {modules.length === 0 && <p style={{ color: "#999" }}>No modules yet</p>}
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

      {showCreateModule && (
        <CreateModuleModal
          topicId={topic.id}
          onClose={() => setShowCreateModule(false)}
          onModuleCreated={() => {
            loadModules();
            setShowCreateModule(false);
          }}
        />
      )}
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
        `https://codeverse-backend-05ko.onrender.com/api/chapters/by-module/${module.id}`
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
        `https://codeverse-backend-05ko.onrender.com/api/chapters/${id}`
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
      const res = await fetch(`https://codeverse-backend-05ko.onrender.com/api/chapters/${chapter.id}`);
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

// Helper component to render content (text or code)
function ContentRenderer({ content }) {
  // Check if content is an object with code
  if (typeof content === 'object' && content?.type === 'code') {
    return (
      <div style={{ marginBottom: 10 }}>
        <CodeBlock className={`language-${content.language || 'javascript'}`}>
          {content.content}
        </CodeBlock>
      </div>
    );
  }
  
  // If content is a plain string, render as text
  return <p>{content}</p>;
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
        <div key={q.id} style={{ marginBottom: 20, padding: 15, border: '1px solid #ddd', borderRadius: 8 }}>
          <ContentRenderer content={q.question} />

          {q.options.map((opt, idx) => (
            <div key={idx} style={{ marginBottom: 10, paddingLeft: 20 }}>
              <input
                type="radio"
                name={i}
                onChange={() =>
                  setAnswers({ ...answers, [i]: idx })
                }
              />
              <span style={{ marginLeft: 8 }}>
                {typeof opt === 'object' && opt?.type === 'code' ? (
                  <div style={{ display: 'inline-block', marginLeft: 10 }}>
                    <CodeBlock className={`language-${opt.language || 'javascript'}`}>
                      {opt.content}
                    </CodeBlock>
                  </div>
                ) : (
                  opt
                )}
              </span>
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
      const response = await fetch("https://codeverse-backend-05ko.onrender.com/api/chapters", {
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
  const [questionType, setQuestionType] = useState("text"); // "text" or "code"
  const [questionLanguage, setQuestionLanguage] = useState("javascript");
  
  const [options, setOptions] = useState([
    { type: "text", content: "" },
    { type: "text", content: "" },
    { type: "text", content: "" },
    { type: "text", content: "" }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const createQuiz = async () => {
    const token = localStorage.getItem('token');
    
    // Format question based on type
    const formattedQuestion = questionType === "code"
      ? { type: "code", content: question, language: questionLanguage }
      : question;

    await fetch("https://codeverse-backend-05ko.onrender.com/api/quiz/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        chapter_id: chapterId,
        question: formattedQuestion,
        options,
        correct_answer: correctAnswer
      })
    });

    if (onQuizCreated) {
      await onQuizCreated();
    }

    onClose();
  };

  const updateOption = (index, type, content, language = "javascript") => {
    const newOptions = [...options];
    newOptions[index] = { type, content, language };
    setOptions(newOptions);
  };

  const toggleOptionType = (index) => {
    const newOptions = [...options];
    const currentType = newOptions[index].type;
    newOptions[index].type = currentType === "text" ? "code" : "text";
    newOptions[index].language = currentType === "text" ? "javascript" : "javascript";
    setOptions(newOptions);
  };

  const programmingLanguages = [
    "javascript",
    "python",
    "java",
    "cpp",
    "csharp",
    "ruby",
    "go",
    "typescript"
  ];

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      overflowY: "auto"
    }}>
      <div style={{
        background: "white",
        width: 600,
        margin: "5% auto",
        padding: 20,
        borderRadius: 10
      }}>

        <h2>Create Quiz Question</h2>

        {/* Question Section */}
        <div style={{ marginBottom: 20, padding: 15, background: "#f9f9f9", borderRadius: 8 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontWeight: "bold" }}>Question Type:</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              style={{ marginLeft: 10, padding: 5 }}
            >
              <option value="text">Text</option>
              <option value="code">Code</option>
            </select>
          </div>

          {questionType === "text" ? (
            <textarea
              placeholder="Enter question text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                minHeight: 80,
                fontFamily: "Arial, sans-serif",
                borderRadius: 4,
                border: "1px solid #ddd"
              }}
            />
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={{ marginRight: 10 }}>Language:</label>
                <select
                  value={questionLanguage}
                  onChange={(e) => setQuestionLanguage(e.target.value)}
                  style={{ padding: 5 }}
                >
                  {programmingLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Enter code"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  minHeight: 120,
                  fontFamily: "monospace",
                  fontSize: "12px",
                  borderRadius: 4,
                  border: "1px solid #ddd"
                }}
              />
            </>
          )}
        </div>

        {/* Options Section */}
        <h3>Options</h3>
        {options.map((opt, i) => (
          <div
            key={i}
            style={{
              marginBottom: 15,
              padding: 12,
              background: correctAnswer === i ? "#e3f2fd" : "#fafafa",
              border: correctAnswer === i ? "2px solid #2196f3" : "1px solid #ddd",
              borderRadius: 8
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
              <input
                type="radio"
                checked={correctAnswer === i}
                onChange={() => setCorrectAnswer(i)}
                style={{ marginRight: 10, cursor: "pointer" }}
              />
              <label style={{ marginRight: 10, fontWeight: "bold" }}>Correct</label>
              
              <button
                onClick={() => toggleOptionType(i)}
                style={{
                  marginLeft: "auto",
                  padding: "5px 10px",
                  background: opt.type === "code" ? "#4caf50" : "#9e9e9e",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                {opt.type === "text" ? "Switch to Code" : "Switch to Text"}
              </button>
            </div>

            {opt.type === "text" ? (
              <textarea
                placeholder={`Option ${i + 1}`}
                value={opt.content}
                onChange={(e) => updateOption(i, "text", e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  minHeight: 50,
                  fontFamily: "Arial, sans-serif",
                  borderRadius: 4,
                  border: "1px solid #ddd"
                }}
              />
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ marginRight: 10 }}>Language:</label>
                  <select
                    value={opt.language || "javascript"}
                    onChange={(e) => updateOption(i, "code", opt.content, e.target.value)}
                    style={{ padding: 5 }}
                  >
                    {programmingLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder={`Option ${i + 1} code`}
                  value={opt.content}
                  onChange={(e) => updateOption(i, "code", e.target.value, opt.language)}
                  style={{
                    width: "100%",
                    padding: 8,
                    minHeight: 80,
                    fontFamily: "monospace",
                    fontSize: "12px",
                    borderRadius: 4,
                    border: "1px solid #ddd"
                  }}
                />
              </>
            )}
          </div>
        ))}

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button
            onClick={createQuiz}
            style={{
              padding: "10px 20px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Save Quiz
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

function CreateTopicModal({ onClose, onTopicCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createTopic = async () => {
    if (!title.trim()) {
      alert("Please enter a topic title");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("https://codeverse-backend-05ko.onrender.com/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description
        })
      });

      if (!response.ok) {
        throw new Error(`Error creating topic: ${response.status}`);
      }

      alert("Topic created successfully!");
      if (onTopicCreated) {
        await onTopicCreated();
      }
      onClose();
    } catch (error) {
      console.error("Error creating topic:", error);
      alert("Failed to create topic. Check console for details.");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "white",
        padding: 30,
        borderRadius: 10,
        width: 400,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h2>Create New Topic</h2>

        <input
          placeholder="Topic Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 15,
            border: "1px solid #ddd",
            borderRadius: 4,
            fontSize: "14px",
            boxSizing: "border-box"
          }}
        />

        <textarea
          placeholder="Topic Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 15,
            border: "1px solid #ddd",
            borderRadius: 4,
            fontSize: "14px",
            minHeight: 80,
            boxSizing: "border-box"
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={createTopic}
            style={{
              flex: 1,
              padding: "10px 20px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            Create Topic
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 20px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateModuleModal({ topicId, onClose, onModuleCreated }) {
  const [title, setTitle] = useState("");

  const createModule = async () => {
    if (!title.trim()) {
      alert("Please enter a module title");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("https://codeverse-backend-05ko.onrender.com/api/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          topic_id: topicId,
          title
        })
      });

      if (!response.ok) {
        throw new Error(`Error creating module: ${response.status}`);
      }

      alert("Module created successfully!");
      if (onModuleCreated) {
        await onModuleCreated();
      }
      onClose();
    } catch (error) {
      console.error("Error creating module:", error);
      alert("Failed to create module. Check console for details.");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "white",
        padding: 30,
        borderRadius: 10,
        width: 400,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h2>Create New Module</h2>

        <input
          placeholder="Module Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") createModule();
          }}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 15,
            border: "1px solid #ddd",
            borderRadius: 4,
            fontSize: "14px",
            boxSizing: "border-box"
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={createModule}
            style={{
              flex: 1,
              padding: "10px 20px",
              background: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            Create Module
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 20px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;