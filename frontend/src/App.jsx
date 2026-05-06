import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import InfoForm        from './components/InfoForm';
import QuestionScreen  from './components/QuestionScreen';
import LoadingScreen   from './components/LoadingScreen';
import SuccessScreen   from './components/SuccessScreen';
import ResultScreen    from './components/ResultScreen';
import { submitTest }  from './services/api';
import AdminLogin      from './pages/AdminLogin';
import AdminLayout     from './pages/AdminLayout';
import Dashboard       from './pages/Dashboard';
import PersonnelList   from './pages/PersonnelList';
import PersonnelDetail from './pages/PersonnelDetail';
import PersonnelCompare from './pages/PersonnelCompare';
import { genericQuestions, sahaQuestions } from './data/questions';

const STEPS = { INFO: 'info', TEST: 'test', LOADING: 'loading', RESULT: 'result', ERROR: 'error' };

const SAHA_POSITIONS = [
  "Görevli",
  "Operatör Yardımcısı",
  "Operatör",
  "Teknisyen Yardımcısı",
  "Teknisyen",
  "Tekniker",
  "Lider",
  "Vardiya Amiri",
  "Uzman Yardımcısı(Saha)",
  "Uzman(Saha)"
];

function TestFlow() {
  const [step,     setStep]     = useState(STEPS.INFO);
  const [userInfo, setUserInfo] = useState(null);
  const [results,  setResults]  = useState(null);
  const [error,    setError]    = useState(null);

  const handleInfoSubmit = (info) => { 
    setUserInfo(info); 
    setStep(STEPS.TEST); 
  };

  const activeQuestions = (userInfo && SAHA_POSITIONS.includes(userInfo.position))
    ? sahaQuestions
    : genericQuestions;

  const handleTestComplete = async (answers) => {
    setStep(STEPS.LOADING);
    setError(null);
    try {
      const data = await submitTest({ ...userInfo, answers });
      setResults(data);
      setStep(STEPS.RESULT);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ECONNABORTED' ? 'AI yanıt vermedi. Lütfen tekrar deneyin.' : null) ||
        err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
      setError(msg);
      setStep(STEPS.ERROR);
    }
  };

  const handleRestart = () => { setStep(STEPS.INFO); setResults(null); setError(null); };

  if (step === STEPS.INFO)    return <InfoForm onSubmit={handleInfoSubmit} />;
  if (step === STEPS.TEST)    return <QuestionScreen questions={activeQuestions} onComplete={handleTestComplete} />;
  if (step === STEPS.LOADING) return <LoadingScreen />;
  if (step === STEPS.RESULT)  return <SuccessScreen onRestart={handleRestart} />;

  return (
    <div className="page-center">
      <div className="card error-card">
        <div className="error-icon">⚠️</div>
        <h2>Bir Hata Oluştu</h2>
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={handleRestart}>Tekrar Dene</button>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  return localStorage.getItem('adminToken')
    ? children
    : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TestFlow />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={<PrivateRoute><AdminLayout /></PrivateRoute>}
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"       element={<Dashboard />} />
        <Route path="personnel"       element={<PersonnelList />} />
        <Route path="personnel/:id"   element={<PersonnelDetail />} />
        <Route path="compare"         element={<PersonnelCompare />} />
      </Route>
    </Routes>
  );
}
