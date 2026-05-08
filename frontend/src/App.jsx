import { useEffect, useState } from "react";

function App() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/topics")
      .then(res => res.json())
      .then(data => setTopics(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📚 Tutorial Platform</h1>

      {topics.map(topic => (
        <div key={topic.id} style={{ margin: "10px 0" }}>
          <h2>{topic.title}</h2>
          <p>{topic.description}</p>
        </div>
      ))}
    </div>
  );
}

export default App;