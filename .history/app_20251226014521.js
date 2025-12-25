// Global audio reference
let currentAudio = null;

const PART_NAMES = {
  1: "Part 1: Picture Description",
  2: "Part 2: Question Response",
  3: "Part 3: Short Conversations",
  4: "Part 4: Short Talks"
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
  const [currentPartIndex, setCurrentPartIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [partPerformance, setPartPerformance] = React.useState({});
  const [submittedTime, setSubmittedTime] = React.useState(null);
  
  const [started, setStarted] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [filterType, setFilterType] = React.useState('all');
  const [showTranscript, setShowTranscript] = React.useState({});

  const allParts = Array.from(new Set(quizData.map(q => q.part))).sort((a,b)=>a-b);

  const sortedSelectedParts = React.useMemo(() => {
    return [...selectedParts].sort((a, b) => a - b);
  }, [selectedParts]);

  const allSelectedQuestions = React.useMemo(() => {
     return sortedSelectedParts.length === 0
      ? []
      : quizData.filter(q => sortedSelectedParts.includes(q.part));
  }, [sortedSelectedParts]);

  const currentPartQuestions = React.useMemo(() => {
    if (sortedSelectedParts.length === 0) return [];
    const activePart = sortedSelectedParts[currentPartIndex];
    return quizData.filter(q => q.part === activePart);
  }, [sortedSelectedParts, currentPartIndex]);

  React.useEffect(() => {
    if (started) {
      setTimeout(() => {
        const el = document.getElementById('quiz-area');
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 0);
    }
  }, [started, currentPartIndex]);

  const handlePartToggle = (part) => {
    setSelectedParts(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
    setAnswers({});
    setSubmitted(false);
    setStarted(false);
    setCurrentPartIndex(0);
  };

  const handleChange = (qId, letterCode) => {
    if (submitted) return;
    // Store the LETTER CODE (A, B, C) instead of the option text
    setAnswers(prev => ({ ...prev, [qId]: letterCode }));
  };

  const handleNextPart = () => {
      if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
      }
      setCurrentPartIndex(prev => prev + 1);
  };

  const handleSubmit = () => {
    if (allSelectedQuestions.length === 0) {
      alert("Please choose the part(s) that you want to practice!");
      return;
    }

    let totalScore = 0;
    const performance = {};

    sortedSelectedParts.forEach(part => {
        performance[part] = { correct: 0, total: 0 };
    });

    allSelectedQuestions.forEach(q => {
      // answers[q.id] now contains "A", "B", etc.
      // q.answer contains "A", "B", etc.
      const selected = answers[q.id];
      const isCorrect = selected === q.answer;
      
      if (performance[q.part]) {
          performance[q.part].total += 1;
          if (isCorrect) performance[q.part].correct += 1;
      }

      if (isCorrect) totalScore++;
    });

    setScore(totalScore);
    setPartPerformance(performance);
    setSubmittedTime(new Date().toLocaleString());
    setSubmitted(true);
    setShowModal(true);
  };

  const getFilteredResults = () => {
    const source = allSelectedQuestions;
    switch(filterType) {
      case 'correct':
        return source.filter(q => answers[q.id] && answers[q.id] === q.answer);
      case 'wrong':
        return source.filter(q => answers[q.id] && answers[q.id] !== q.answer);
      case 'unanswered':
        return source.filter(q => !answers[q.id]);
      default:
        return source;
    }
  };

  // Helper for percentage
  const totalQuestions = allSelectedQuestions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const renderResultItem = (q) => {
    const selected = answers[q.id];
    const isCorrect = selected === q.answer;
    const isUnanswered = !selected;
    
    let statusClass = '';
    if (isCorrect) statusClass = 'correct';
    else if (isUnanswered) statusClass = 'unanswered';
    else statusClass = 'incorrect';

    let statusText = isCorrect ? "✅ Correct" : (isUnanswered ? "⚠️ Unanswered" : `❌ Incorrect`);

    return (
      <div key={q.id} className={`result-item ${statusClass}`}>
        <div className="result-question">
          {q.id}. {q.question}
        </div>
        <div className="result-answer">
           <p style={{ fontWeight: 'bold' }}>{statusText}</p>
           {!isCorrect && <p>Your Answer: {selected || "None"}</p>}
           {!isCorrect && <p>Correct Answer: {q.answer}</p>}
           {q.remark && <p style={{ marginTop: 5, fontSize: '0.9em' }}>💡 {q.remark}</p>}
        </div>
      </div>
    );
  };

  const isLastPart = currentPartIndex === sortedSelectedParts.length - 1;

  return (
    <div className="container">
      <header>
        <h1>MOCK 5 Listening</h1>
        <p>TOCFL Listening Practice</p>
      </header>

      {!submitted && !started && (
        <div className="part-selection">
          <h2>Choose the part(s) that you want to practice：</h2>
          <div className="part-checkboxes">
            {allParts.map(part => (
              <label key={part} className="part-checkbox">
                <input
                  type="checkbox"
                  checked={selectedParts.includes(part)}
                  onChange={() => handlePartToggle(part)}
                />
                <span className="checkmark"></span>
                <span>{PART_NAMES[part]}</span>
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

      {started && !submitted && (
        <div id="quiz-area" className="quiz-container">
          
          <h2 className="current-part-header">
            {PART_NAMES[sortedSelectedParts[currentPartIndex]]}
          </h2>

          {currentPartQuestions.map(q => (
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
                  // Determine the letter (A, B, C...) based on index
                  const letterCode = String.fromCharCode(65 + idx);
                  // Check if this option is selected by comparing the Letter Code
                  const isSelected = answers[q.id] === letterCode; 
                  
                  return (
                    <div 
                      key={opt} 
                      className={`option ${isSelected ? 'selected' : ''}`}
                      // Pass the letterCode ("A", "B"...) to handleChange
                      onClick={() => handleChange(q.id, letterCode)}
                    >
                      {/* Removed the 'option-letter' div as requested */}
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

          <div className="quiz-footer">
            {!isLastPart ? (
               <button className="nav-btn next-part-btn" onClick={handleNextPart}>
                 Next Part
               </button>
            ) : (
               <button className="submit-btn" onClick={handleSubmit}>
                 Submit Answers
               </button>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content results-container">
            <h2 style={{ marginBottom: 20 }}>Results</h2>
            
            {/* 1. Score Summary */}
            <div className="score">
               <p>Score: <span id="score">{score}</span> / {totalQuestions}</p>
               <p>Accuracy: <span id="percentage">{percentage}</span>%</p>
               <p style={{ fontSize: '1em' }}>Submitted: {submittedTime}</p>
            </div>

            {/* 2. Actions (Retake / Home) */}
            <div className="result-actions">
              <button className="restart-btn" onClick={() => window.location.reload()}>
                Retake Test
              </button>
              <button className="home-btn" onClick={() => window.location.href = "https://fangdongyzu.github.io/tocflmock/"}>
                Go to Home Page
              </button>
            </div>

            {/* 3. Performance Breakdown */}
            <div className="part-breakdown">
                {sortedSelectedParts.map(part => {
                    const stats = partPerformance[part] || { correct: 0, total: 0 };
                    const pPercent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                    return (
                        <div key={part} className="breakdown-item">
                            <h4>{PART_NAMES[part]}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                                <span>Score: {stats.correct} / {stats.total}</span>
                                <span>{pPercent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', marginTop: '5px' }}>
                                <div style={{ 
                                    width: `${pPercent}%`, 
                                    height: '100%', 
                                    background: pPercent >= 80 ? '#27ae60' : (pPercent >= 60 ? '#f39c12' : '#e74c3c'),
                                    borderRadius: '4px' 
                                }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 4. Filters */}
            <div className="filter-section">
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

            {/* 5. Detailed List */}
            <div className="results-details">
               {getFilteredResults().length === 0 ? (
                 <p style={{ textAlign: 'center', padding: 20 }}>No questions found for this filter.</p>
               ) : (
                 getFilteredResults().map(renderResultItem)
               )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<QuizApp />);