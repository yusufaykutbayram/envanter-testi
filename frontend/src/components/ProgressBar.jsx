export default function ProgressBar({ progress }) {
  return (
    <div className="progress-bar-container" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
