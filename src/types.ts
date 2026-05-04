export interface Student {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  year: number;
  batch: string;
  semester: number;
  cgpa: number;
}

export interface Performance {
  id: string;
  studentId: string;
  subject: string;
  marks: number;
  totalMarks: number;
  semester: number;
}

export interface StudentStats {
  gpa: number;
  totalMarks: number;
  attendance: number;
  rank: number;
}
