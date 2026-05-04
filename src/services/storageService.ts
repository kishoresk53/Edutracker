import { Student, Performance } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'edutrack_students',
  PERFORMANCES: 'edutrack_performances',
};

// Initial data for demo
const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Alex Johnson', rollNo: 'CS101', department: 'Computer Science', year: 2, batch: '2022', semester: 4, cgpa: 8.5 },
  { id: '2', name: 'Sarah Miller', rollNo: 'CS102', department: 'Computer Science', year: 2, batch: '2022', semester: 4, cgpa: 9.1 },
  { id: '3', name: 'David Chen', rollNo: 'EC101', department: 'Electronics', year: 1, batch: '2023', semester: 2, cgpa: 7.8 },
];

const MOCK_PERFORMANCES: Performance[] = [
  { id: 'p1', studentId: '1', subject: 'Data Structures', marks: 85, totalMarks: 100, semester: 4 },
  { id: 'p2', studentId: '1', subject: 'Algorithms', marks: 78, totalMarks: 100, semester: 4 },
  { id: 'p3', studentId: '2', subject: 'Data Structures', marks: 92, totalMarks: 100, semester: 4 },
  { id: 'p4', studentId: '2', subject: 'Algorithms', marks: 88, totalMarks: 100, semester: 4 },
  { id: 'p5', studentId: '3', subject: 'Physics', marks: 65, totalMarks: 100, semester: 2 },
];

export const storageService = {
  getStudents: (): Student[] => {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(MOCK_STUDENTS));
      return MOCK_STUDENTS;
    }
    return JSON.parse(data);
  },

  saveStudent: (student: Student) => {
    const students = storageService.getStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index > -1) {
      students[index] = student;
    } else {
      students.push(student);
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getPerformances: (): Performance[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PERFORMANCES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PERFORMANCES, JSON.stringify(MOCK_PERFORMANCES));
      return MOCK_PERFORMANCES;
    }
    return JSON.parse(data);
  },

  savePerformance: (performance: Performance) => {
    const perfs = storageService.getPerformances();
    const index = perfs.findIndex(p => p.id === performance.id);
    if (index > -1) {
      perfs[index] = performance;
    } else {
      perfs.push(performance);
    }
    localStorage.setItem(STORAGE_KEYS.PERFORMANCES, JSON.stringify(perfs));
  },

  deleteStudent: (id: string) => {
    const students = storageService.getStudents().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    
    // Also cleanup performances
    const perfs = storageService.getPerformances().filter(p => p.studentId !== id);
    localStorage.setItem(STORAGE_KEYS.PERFORMANCES, JSON.stringify(perfs));
  }
};
