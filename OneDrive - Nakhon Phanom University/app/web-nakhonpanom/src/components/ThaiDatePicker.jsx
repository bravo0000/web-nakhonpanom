import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import './ThaiDatePicker.css';

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function ThaiDatePicker({ value, onChange, placeholder = "เลือกวันที่" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date()); // For calendar navigation
    const containerRef = useRef(null);

    // Initial sync
    useEffect(() => {
        if (value) {
            setCurrentMonth(new Date(value));
        }
    }, []); // Only on mount/value invalidation if we wanted, but keep valid ISO check implies simple init

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDisplay = (isoDate) => {
        if (!isoDate) return "";
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return "";
        return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handleDateClick = (day) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Adjust for timezone offset to ensure "YYYY-MM-DD" is correct for local time
        // Simple trick: formatted in YYYY-MM-DD local
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        const isoString = `${year}-${month}-${d}`;

        onChange(isoString);
        setIsOpen(false);
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevYear = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    };

    const nextYear = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const totalSlots = [...blanks, ...days];

        // Highlight selected day
        let selectedDay = null;
        if (value) {
            const d = new Date(value);
            if (d.getFullYear() === year && d.getMonth() === month) {
                selectedDay = d.getDate();
            }
        }

        return (
            <div className="calendar-grid">
                {DAYS.map(day => <div key={day} className="calendar-day-header">{day}</div>)}
                {totalSlots.map((day, index) => (
                    <div
                        key={index}
                        className={`calendar-day ${!day ? 'empty' : ''} ${day === selectedDay ? 'selected' : ''}`}
                        onClick={() => day && handleDateClick(day)}
                    >
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="thai-date-picker" ref={containerRef}>
            <div className="input-display" onClick={() => setIsOpen(!isOpen)}>
                <input
                    type="text"
                    readOnly
                    value={formatDisplay(value)}
                    placeholder={placeholder}
                    className="date-input"
                />
            </div>

            {isOpen && (
                <div className="calendar-popup">
                    <div className="calendar-header">
                        <button onClick={prevYear} className="nav-btn">&laquo;</button>
                        <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={18} /></button>
                        <div className="current-month">
                            {THAI_MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
                        </div>
                        <button onClick={nextMonth} className="nav-btn"><ChevronRight size={18} /></button>
                        <button onClick={nextYear} className="nav-btn">&raquo;</button>
                    </div>
                    {renderCalendar()}
                </div>
            )}
        </div>
    );
}
