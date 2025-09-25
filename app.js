// keep a global reference to the currently playing audio
let currentAudio = null;

function AudioPlayer({ src }) {
  const audioRef = React.useRef(null);
  const [duration, setDuration] = React.useState(0);
  const [time, setTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setTime(a.currentTime || 0);
    const onPlay = () => {
      // pause and reset previously playing audio if exists
      if (currentAudio && currentAudio !== a) {
        currentAudio.pause();
        currentAudio.currentTime = 0;  // reset to start
      }
      currentAudio = a;
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);

    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const seek = (seconds) => {
    const a = audioRef.current;
    if (!a) return;
    const target = Math.max(0, Math.min(a.duration || 0, a.currentTime + seconds));
    a.currentTime = target;
  };

  const togglePlayPause = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
    } else {
      // stop and reset any other audio before starting this one
      if (currentAudio && currentAudio !== a) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      a.play();
    }
  };

  return (
    <div>
      <audio ref={audioRef} src={src} style={{ width: "100%" }} />
      <div className="controls small">
        <button onClick={() => seek(-5)}>⏪ -5s</button>
        <button onClick={togglePlayPause} style={{ margin: "0 6px" }}>
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button onClick={() => seek(5)}>+5s ⏩</button>
        <span style={{ marginLeft: 8 }}>
          {Math.floor(time)} / {Math.floor(duration)} s
        </span>
      </div>
    </div>
  );
}

function QuizApp() {
  const [selectedParts, setSelectedParts] = React.useState([]);
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [submittedTime, setSubmittedTime] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [showCorrect, setShowCorrect] = React.useState(false);
  const [showWrong, setShowWrong] = React.useState(false);
  const [showUnanswered, setShowUnanswered] = React.useState(false);
  const [showTranscript, setShowTranscript] = React.useState({});

  const allParts = Array.from(new Set(quizData.map(q => q.part))).sort((a,b)=>a-b);

  const filteredQuestions = selectedParts.length === 0
    ? []
    : quizData.filter(q => selectedParts.includes(q.part));

  const handlePartToggle = (part) => {
    setSelectedParts(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  const handleChange = (qId, option) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmit = () => {
    if (filteredQuestions.length === 0) {
      alert("Please choose the part(s) that you want to practice！");
      return;
    }

    let newScore = 0;
    filteredQuestions.forEach(q => {
      const selected = answers[q.id];
      if (selected && selected[1] === q.answer) newScore++;
    });

    setScore(newScore);
    setSubmittedTime(new Date().toLocaleString());
    setSubmitted(true);
    setShowModal(true);
  };

  const correctQuestions = filteredQuestions.filter(q => answers[q.id] && answers[q.id][1] === q.answer);
  const wrongQuestions = filteredQuestions.filter(q => answers[q.id] && answers[q.id][1] !== q.answer);
  const unansweredQuestions = filteredQuestions.filter(q => !answers[q.id]);

  return (
    <div className="quiz-container">
      <h1>MOCK 5 Listening</h1>

      {!submitted && (
        <div className="part-selection">
          <p> Choose the part(s) that you want to practice：</p>
          {allParts.map(part => (
            <label key={part} style={{ marginRight: '15px' }}>
              <input
                type="checkbox"
                checked={selectedParts.includes(part)}
                onChange={() => handlePartToggle(part)}
              />
              Part {part}
            </label>
          ))}
        </div>
      )}

      {!submitted && filteredQuestions.map(q => (
        <div key={q.id} className="question">
          <p><strong>{q.id}.</strong> {q.question}</p>

          {q.image && <img src={q.image} alt={`q-${q.id}`} />}

          <AudioPlayer src={q.audio} />

          <div style={{ marginTop: 8 }}>
            <button onClick={() => setShowTranscript(prev => ({ ...prev, [q.id]: !prev[q.id] }))}>
              {showTranscript[q.id] ? 'Hide Transcript' : 'Show Transcript'}
            </button>
            {showTranscript[q.id] && <div className="transcript">{q.transcript}</div>}
          </div>

          <div className="options" style={{ marginTop: 8 }}>
            {q.options.map((opt, idx) => (
              <label key={opt}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => handleChange(q.id, opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      {!submitted && filteredQuestions.length > 0 && (
        <button onClick={handleSubmit} style={{ marginTop: 10 }}>Submit</button>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Results</h2>
            <p className="small">Scores：{score} / {filteredQuestions.length}</p>
            <p className="small">Submission time：{submittedTime}</p>

            <div className="modal-buttons">
              <button onClick={() => { setShowCorrect(!showCorrect); setShowWrong(false); setShowUnanswered(false); }}>Correct</button>
              <button onClick={() => { setShowWrong(!showWrong); setShowCorrect(false); setShowUnanswered(false); }}>Wrong</button>
              <button onClick={() => { setShowUnanswered(!showUnanswered); setShowCorrect(false); setShowWrong(false); }}>Unanswered</button>
            </div>

            {showCorrect && (
              <div style={{ marginTop: 10 }}>
                {correctQuestions.length === 0 ? <p>No correct answer</p> : correctQuestions.map(q => (
                  <div key={q.id} className="result-item">
                    <p><strong>{q.id}.</strong> {q.question} ✅</p>
                    <p style={{ color: 'green' }}>{q.remark}</p>
                  </div>
                ))}
              </div>
            )}

            {showWrong && (
              <div style={{ marginTop: 10 }}>
                {wrongQuestions.length === 0 ? <p>No wrong answer</p> : wrongQuestions.map(q => (
                  <div key={q.id} className="result-item">
                    <p><strong>{q.id}.</strong> {q.question} ❌ Correct: {q.answer}</p>
                    <p style={{ color: 'red' }}>{q.remark}</p>
                  </div>
                ))}
              </div>
            )}

            {showUnanswered && (
              <div style={{ marginTop: 10 }}>
                {unansweredQuestions.length === 0 ? <p>All questions answered</p> : unansweredQuestions.map(q => (
                  <div key={q.id} className="result-item">
                    <p><strong>{q.id}.</strong> {q.question} ⚠️ Unanswered</p>
                    <p style={{ color: 'orange' }}>{q.remark}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="footer-actions">
              <button onClick={() => {
                setShowModal(false);
                if (window.confirm('Wanna retake the test？')) {
                  window.location.reload();
                } else {
                  // do nothing (stay)
                }
              }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<QuizApp />);
