// Global audio reference
let currentAudio = null;

const PART_NAMES = {
  1: "Part 1 Picture Description",
  2: "Part 2 Question Response",
  3: "Part 3 Short Conversations",
  4: "Part 4 Short Talks"
};

function AudioPlayer({ src }) {
  const audioRef = React.useRef(null);
  const progressRef = React.useRef(null);
  const [duration, setDuration] = React.useState(0);
  const [time, setTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setTime(a.currentTime || 0);
    const onPlay = () => {
      if (currentAudio && currentAudio !== a) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
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

  const handleProgressClick = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, x / width));

    a.currentTime = percent * duration;
  };

  const togglePlayPause = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
    } else {
      if (currentAudio && currentAudio !== a) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      a.play();
    }
  };

  const progressPercent = duration ? (time / duration) * 100 : 0;

  return (
    <div className="audio-wrapper">
      <audio ref={audioRef} src={src} style={{ width: "100%" }} />
      
      <div 
        className="audio-progress-container" 
        ref={progressRef} 
        onClick={handleProgressClick}
        title="Click to seek"
      >
        <div 
          className="audio-progress-fill" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="audio-controls">
        <button className="audio-btn" onClick={() => seek(-5)}>⏪ -5s</button>
        <button className="audio-btn" onClick={togglePlayPause}>
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button className="audio-btn" onClick={() => seek(5)}>+5s ⏩</button>
        <span style={{ marginLeft: "auto", fontSize: "0.9em", color: "#666" }}>
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
  
  // Controls visibility of questions vs selection panel
  const [started, setStarted] = React.useState(false);
  
  const [showModal, setShowModal] = React.useState(false);
  const [filterType, setFilterType] = React.useState('all');
  const [showTranscript, setShowTranscript] = React.useState({});

  const allParts = Array.from(new Set(quizData.map(q => q.part))).sort((a,b)=>a-b);

  const filteredQuestions = selectedParts.length === 0
    ? []
    : quizData.filter(q => selectedParts.includes(q.part));

  const totalQuestions = filteredQuestions.length;

  // Scroll to questions when practice starts
  React.useEffect(() => {
    if (started) {
      setTimeout(() => {
        const el = document.getElementById('quiz-area');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [started]);

  const handlePartToggle = (part) => {
    setSelectedParts(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
    setAnswers({});
    setSubmitted(false);
    setStarted(false);
  };

  const handleChange = (qId, option) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = () => {
    if (filteredQuestions.length === 0) {
      alert("Please choose the part(s) that you want to practice!");
      return;
    }

    if (!window.confirm("Are you sure you want to submit?")) return;

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

  const getFilteredResults = () => {
    switch(filterType) {
      case 'correct':
        return filteredQuestions.filter(q => answers[q.id] && answers[q.id][1] === q.answer);
      case 'wrong':
        return filteredQuestions.filter(q => answers[q.id] && answers[q.id][1] !== q.answer);
      case 'unanswered':
        return filteredQuestions.filter(q => !answers[q.id]);
      default:
        return filteredQuestions;
    }
  };

  const renderResultItem = (q) => {
    const selected = answers[q.id];
    const isCorrect = selected && selected[1] === q.answer;
    const isUnanswered = !selected;
    
    let statusColor = isCorrect ? '#d5f4e6' : (isUnanswered ? '#f4f6f6' : '#fadbd8');
    let borderColor = isCorrect ? '#27ae60' : (isUnanswered ? '#95a5a6' : '#e74c3c');

    return (
      <div key={q.id} className="result-item" style={{ backgroundColor: statusColor, borderLeftColor: borderColor }}>
        <p><strong>{q.id}.</strong> {q.question}</p>
        <p>
           {isCorrect && "✅ Correct"}
           {isUnanswered && "⚠️ Unanswered"}
           {!isCorrect && !isUnanswered && `❌ Your Answer: ${selected}`}
        </p>
        {!isCorrect && <p><strong>Correct Answer:</strong> {q.answer}</p>}
        {q.remark && <p style={{ marginTop: 5, fontSize: '0.9em', color: '#555' }}>💡 {q.remark}</p>}
      </div>
    );
  };

  return (
    <div className="container">
      <header>
        <h1>MOCK 5 Listening</h1>
        <p>TOEIC Listening Practice</p>
      </header>

      {/* Part Selection - Hides when started or submitted */}
      {!submitted && !started && (
        <div className="part-selection">
          <h2>Select Parts</h2>
          <div className="part-checkboxes">
            {allParts.map(part => (
              <label key={part} className="part-checkbox">
                <input
                  type="checkbox"
                  checked={selectedParts.includes(part)}
                  onChange={() => handlePartToggle(part)}
                />
                <span className="checkmark"></span>
                <span>{PART_NAMES[part] || `Part ${part}`}</span>
              </label>
            ))}
          </div>
          
          {selectedParts.length > 0 && (
             <button className="start-btn" onClick={() => setStarted(true)}>
               Start Practice
             </button>
          )}
        </div>
      )}

      {/* Quiz Area - Shows when started */}
      {started && !submitted && (
        <div id="quiz-area" className="quiz-container">
          
          {filteredQuestions.map(q => (
            <div key={q.id} className="question-item">
              <div className="question-text">
                {q.id}. {q.question}
              </div>

              {q.image && (
                <div className="question-image">
                   <img src={q.image} alt={`Question ${q.id}`} />
                </div>
              )}

              <AudioPlayer src={q.audio} />

              <div className="options">
                {q.options.map((opt, idx) => {
                  const isSelected = answers[q.id] === opt;
                  const letter = ['A','B','C','D'][idx];
                  return (
                    <div 
                      key={opt} 
                      className={`option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleChange(q.id, opt)}
                    >
                      <div className="option-letter">{letter}</div>
                      <div className="option-text">{opt}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 15 }}>
                <button 
                  className="transcript-btn"
                  onClick={() => setShowTranscript(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                >
                  {showTranscript[q.id] ? 'Hide Transcript' : 'Show Transcript'}
                </button>
                {showTranscript[q.id] && (
                  <div className="transcript-content">{q.transcript}</div>
                )}
              </div>
            </div>
          ))}

          <button className="submit-btn" onClick={handleSubmit}>
            Submit Answers
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Results</h2>
            
            <div style={{ textAlign: 'center', padding: 20, background: '#f8f9fa', borderRadius: 10, marginBottom: 20 }}>
               <h3 style={{ fontSize: '2em', color: '#27ae60' }}>{score} / {totalQuestions}</h3>
               <p style={{ color: '#7f8c8d' }}>Submitted: {submittedTime}</p>
            </div>

            <div className="modal-buttons" style={{ justifyContent: 'center' }}>
              <button 
                className={`result-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All
              </button>
              <button 
                className={`result-filter-btn ${filterType === 'correct' ? 'active' : ''}`}
                onClick={() => setFilterType('correct')}
              >
                Correct
              </button>
              <button 
                className={`result-filter-btn ${filterType === 'wrong' ? 'active' : ''}`}
                onClick={() => setFilterType('wrong')}
              >
                Wrong
              </button>
              <button 
                className={`result-filter-btn ${filterType === 'unanswered' ? 'active' : ''}`}
                onClick={() => setFilterType('unanswered')}
              >
                Unanswered
              </button>
            </div>

            <div className="results-list">
               {getFilteredResults().length === 0 ? (
                 <p style={{ textAlign: 'center', padding: 20 }}>No questions found for this filter.</p>
               ) : (
                 getFilteredResults().map(renderResultItem)
               )}
            </div>

            <div className="modal-buttons" style={{ justifyContent: 'center', marginTop: 30, borderTop: '1px solid #eee', paddingTop: 20 }}>
              <button className="submit-btn" style={{ background: '#95a5a6' }} onClick={() => setShowModal(false)}>
                Close Review
              </button>
              <button className="submit-btn" style={{ background: '#e67e22' }} onClick={() => window.location.reload()}>
                Retake Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<QuizApp />);