/**
 * TimePicker — select jam & menit dalam format 24 jam.
 * Props:
 *   value    : string "HH:MM" atau ""
 *   onChange : (value: string) => void
 *   required : boolean
 *   disabled : boolean
 */
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function TimePicker({ value, onChange, required, disabled }: TimePickerProps) {
  const [hh, mm] = value ? value.split(':') : ['', ''];

  const handleHour = (h: string) => {
    const m = mm || '00';
    onChange(`${h}:${m}`);
  };

  const handleMinute = (m: string) => {
    const h = hh || '00';
    onChange(`${h}:${m}`);
  };

  const selectClass =
    'px-2 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono disabled:bg-gray-50 disabled:text-gray-400';

  return (
    <div className="flex items-center gap-1">
      {/* Jam */}
      <select
        value={hh ?? ''}
        onChange={e => handleHour(e.target.value)}
        required={required}
        disabled={disabled}
        className={`${selectClass} w-[70px]`}
      >
        <option value="" disabled>HH</option>
        {HOURS.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>

      <span className="text-gray-500 font-bold text-base select-none">:</span>

      {/* Menit */}
      <select
        value={mm ?? ''}
        onChange={e => handleMinute(e.target.value)}
        required={required}
        disabled={disabled}
        className={`${selectClass} w-[70px]`}
      >
        <option value="" disabled>MM</option>
        {MINUTES.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
