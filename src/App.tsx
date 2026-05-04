import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  GraduationCap, 
  Settings, 
  Plus, 
  Search, 
  TrendingUp,
  BrainCircuit,
  LogOut,
  ChevronRight,
  BookOpen,
  Trash2,
  ArrowLeft,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from './lib/utils';
import { Student, Performance } from './types';
import { storageService } from './services/storageService';
import { aiService } from './services/aiService';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "group-hover:text-blue-600")} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: { title: string, value: string | number, icon: any, trend?: string, color: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "data-card overflow-hidden relative text-left w-full",
      onClick && "cursor-pointer hover:border-blue-200"
    )}
  >
    <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10", color)} />
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-lg bg-opacity-10", color.replace('bg-', 'text-'))}>
        <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </button>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'analysis'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState<string | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', department: '', year: 1, batch: '2024', cgpa: '' });

  useEffect(() => {
    setStudents(storageService.getStudents());
    setPerformances(storageService.getPerformances());
  }, []);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const student: Student = {
      id: Math.random().toString(36).substr(2, 9),
      ...newStudent,
      cgpa: parseFloat(newStudent.cgpa) || 0,
      semester: newStudent.year * 2, // approximation
      batch: newStudent.batch
    };
    storageService.saveStudent(student);
    setStudents(prev => [...prev, student]);
    setIsModalOpen(false);
    setNewStudent({ name: '', rollNo: '', department: '', year: 1, batch: '2024', cgpa: '' });
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const performDelete = (id: string) => {
    storageService.deleteStudent(id);
    setStudents(prev => prev.filter(s => s.id !== id));
    setPerformances(prev => prev.filter(p => p.studentId !== id));
    if (selectedStudent?.id === id) {
      setSelectedStudent(null);
      setAiAnalysis(null);
    }
    setDeletingId(null);
  };

  const handleDeleteStudent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const getStudentStats = (studentId: string) => {
    const studentPerfs = performances.filter(p => p.studentId === studentId);
    if (studentPerfs.length === 0) {
      const student = students.find(s => s.id === studentId);
      if (student && student.cgpa) {
        return { avg: Math.round(student.cgpa * 10), total: 0 };
      }
      return { avg: 0, total: 0 };
    }
    const total = studentPerfs.reduce((acc, curr) => acc + curr.marks, 0);
    const avg = (total / (studentPerfs.length * 100)) * 100; // assuming total marks 100 per subject
    return { avg: Math.round(avg), total };
  };

  const [newPerf, setNewPerf] = useState({ subject: '', marks: '' });

  const handleAddPerformance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newPerf.subject || !newPerf.marks) return;

    const perf: Performance = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: selectedStudent.id,
      subject: newPerf.subject,
      marks: parseInt(newPerf.marks),
      totalMarks: 100,
      semester: selectedStudent.semester
    };

    storageService.savePerformance(perf);
    setPerformances(prev => [...prev, perf]);
    setNewPerf({ subject: '', marks: '' });
  };

  const filteredStudents = selectedBatch === 'all' 
    ? students 
    : students.filter(s => s.batch === selectedBatch);

  const chartData = filteredStudents.map(s => {
    return { name: s.name, cgpa: s.cgpa };
  });

  const departmentData = Array.from(new Set(filteredStudents.map(s => s.department))).map(dept => ({
    name: dept,
    count: filteredStudents.filter(s => s.department === dept).length
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleRunAI = async (student: Student) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const studentPerfs = performances.filter(p => p.studentId === student.id);
    const analysis = await aiService.analyzePerformance(student, studentPerfs);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">EduTrack</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">Analytics Pro</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={BarChart3} 
            label="Dashboard Overview" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Student Records" 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')} 
          />
          <SidebarItem 
            icon={BrainCircuit} 
            label="AI Diagnostics" 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group">
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {activeTab !== 'dashboard' && (
              <motion.button 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  if (activeTab === 'analysis') {
                    setActiveTab('students');
                    setSelectedStudent(null);
                  } else {
                    setActiveTab('dashboard');
                  }
                }}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center justify-center"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
            <div>
              <h2 className="text-3xl font-bold text-slate-900 capitalize italic">
                {activeTab === 'dashboard' ? 'Academic Hub' : activeTab}
              </h2>
              <p className="text-slate-500 mt-1 font-medium italic opacity-80">Performance Analysis</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 bg-white"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Filter and Stats Grid */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-2xl w-fit shadow-sm overflow-x-auto max-w-full">
                   <span className="text-xs font-mono text-slate-400 uppercase tracking-widest pl-3 pr-2 whitespace-nowrap">Filter Batch:</span>
                   <div className="flex gap-1">
                      {['all', ...Array.from(new Set(students.map(s => s.batch))).sort()].map(b => (
                        <button
                          key={b}
                          onClick={() => setSelectedBatch(b as any)}
                          className={cn(
                            "px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                            selectedBatch === b 
                              ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                              : "text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          {b === 'all' ? 'All Batches' : `${b} Batch`}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Students in Batch" 
                    value={filteredStudents.length} 
                    icon={Users} 
                    trend={selectedBatch === 'all' ? "+12% vs last sem" : undefined} 
                    color="bg-blue-500" 
                    onClick={() => setActiveTab('students')}
                  />
                  <StatCard 
                    title="Batch CGPA Avg" 
                    value={filteredStudents.length > 0 ? (filteredStudents.reduce((acc, curr) => acc + curr.cgpa, 0) / filteredStudents.length).toFixed(2) : '0.00'} 
                    icon={TrendingUp} 
                    trend="Stable" 
                    color="bg-emerald-500" 
                  />
                  <StatCard 
                    title="Departments" 
                    value={departmentData.length} 
                    icon={BookOpen} 
                    color="bg-amber-500" 
                  />
                  <StatCard 
                    title="AI Insights Generated" 
                    value="24" 
                    icon={BrainCircuit} 
                    color="bg-purple-500" 
                  />
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart */}
                <div className="lg:col-span-2 data-card">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-lg">Class CGPA Overview</h3>
                      <p className="text-xs text-slate-400 font-mono">DISTRIBUTION BY STUDENT CGPA (Scale 0-10)</p>
                    </div>
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-blue-600" />
                       <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CGPA</span>
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                          domain={[0, 10]}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '12px'
                          }}
                        />
                        <Bar 
                          dataKey="cgpa" 
                          fill="url(#barGradient)" 
                          radius={[6, 6, 0, 0]} 
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distribution Chart */}
                <div className="data-card">
                  <div className="mb-6">
                    <h3 className="font-bold text-lg italic">Department Mix</h3>
                    <p className="text-xs text-slate-400 font-mono">ENROLLMENT ANALYSIS</p>
                  </div>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departmentData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 mt-4">
                    {departmentData.map((dept, index) => (
                      <div key={dept.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm font-medium text-slate-600">{dept.name}</span>
                        </div>
                        <span className="text-sm font-bold">{dept.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div 
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="data-card !p-0 overflow-hidden"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-mono text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-xs font-mono text-slate-400 uppercase tracking-widest">Roll No</th>
                    <th className="px-6 py-4 text-xs font-mono text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-6 py-4 text-xs font-mono text-slate-400 uppercase tracking-widest">Avg Performance</th>
                    <th className="px-6 py-4 text-xs font-mono text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const stats = getStudentStats(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-semibold text-slate-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">{student.rollNo}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            {student.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-24 bg-blue-50 rounded-full overflow-hidden">
                                   <div 
                                     className="h-full rounded-full bg-blue-700"
                                     style={{ width: `${stats.avg}%` }}
                                   />
                                </div>
                                <span className="text-xs font-bold text-slate-600">{stats.avg}%</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-mono text-slate-400">CGPA: {student.cgpa}</span>
                               <span className="text-[10px] font-mono text-blue-500 font-bold bg-blue-50 px-1 rounded">{student.batch} Batch</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {deletingId === student.id ? (
                              <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100"
                              >
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                  className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                >
                                  NO
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); performDelete(student.id); }}
                                  className="px-2 py-1 text-[10px] font-bold bg-red-600 text-white rounded-md shadow-sm"
                                >
                                  YES
                                </button>
                              </motion.div>
                            ) : (
                              <button 
                                onClick={(e) => handleDeleteStudent(student.id, e)}
                                className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                                title="Delete Student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedStudent(student);
                                setActiveTab('analysis');
                              }}
                              className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-blue-600 transition-all"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Selector */}
                <div className="lg:col-span-1 space-y-4">
                   <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-lg">Select Student</h3>
                   <div className="space-y-1">
                      {students.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setAiAnalysis(null);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl transition-all",
                            selectedStudent?.id === s.id 
                             ? "bg-white shadow-sm border border-slate-200 text-blue-600 font-bold" 
                             : "text-slate-500 hover:bg-slate-100"
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Analysis Area */}
                <div className="lg:col-span-3 space-y-6">
                  {selectedStudent ? (
                    <>
                      <div className="data-card !p-8 bg-linear-to-br from-white to-slate-50 border-blue-100">
                        <div className="flex justify-between items-start mb-8">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-100">
                              {selectedStudent.name[0]}
                            </div>
                            <div>
                               <h3 className="text-2xl font-bold text-slate-900">{selectedStudent.name}</h3>
                               <p className="text-slate-500">{selectedStudent.department} • Year {selectedStudent.year}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRunAI(selectedStudent)}
                            disabled={isAnalyzing}
                            className={cn(
                              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95",
                              isAnalyzing 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200"
                            )}
                          >
                            <BrainCircuit className={cn("w-5 h-5", isAnalyzing && "animate-pulse")} />
                            {isAnalyzing ? 'DIAGNOSING...' : 'RUN ANALYTICS'}
                          </button>
                        </div>

                        <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 px-2">Record Subject Marks</h4>
                           <form onSubmit={handleAddPerformance} className="flex gap-3">
                              <input 
                                required
                                type="text"
                                placeholder="Subject (e.g. Physics)"
                                value={newPerf.subject}
                                onChange={e => setNewPerf({...newPerf, subject: e.target.value})}
                                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                              />
                              <input 
                                required
                                type="number"
                                placeholder="Marks"
                                min="0"
                                max="100"
                                value={newPerf.marks}
                                onChange={e => setNewPerf({...newPerf, marks: e.target.value})}
                                className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                              />
                              <button 
                                type="submit"
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                              >
                                ADD
                              </button>
                           </form>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mb-8">
                           {performances.filter(p => p.studentId === selectedStudent.id).map(p => (
                             <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 group">
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{p.subject}</p>
                               <div className="flex items-end gap-1">
                                  <span className="text-2xl font-bold text-slate-900">{p.marks}</span>
                                  <span className="text-slate-400 text-sm pb-1">/ {p.totalMarks}</span>
                               </div>
                             </div>
                           ))}
                        </div>

                        <AnimatePresence>
                          {aiAnalysis && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                <BrainCircuit className="w-20 h-20 text-blue-600" />
                              </div>
                              <h4 className="text-blue-900 font-bold flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4" />
                                Smart Performance Logic
                              </h4>
                              <p className="text-blue-800/80 leading-relaxed italic">
                                "{aiAnalysis}"
                              </p>
                              <div className="mt-4 flex gap-2">
                                <span className="px-2 py-1 bg-white border border-blue-100 text-[10px] font-mono rounded-md text-blue-600">PREDICTIVE: POSITIVE</span>
                                <span className="px-2 py-1 bg-white border border-blue-100 text-[10px] font-mono rounded-md text-blue-600">CONFIDENCE: 94.2%</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Performance Chart for Selected Student */}
                      <div className="data-card">
                         <h3 className="font-bold text-lg mb-6">Subject Proficiency Index</h3>
                         <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={performances.filter(p => p.studentId === selectedStudent.id)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="subject" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip />
                                <Line 
                                  type="monotone" 
                                  dataKey="marks" 
                                  stroke="#3b82f6" 
                                  strokeWidth={3} 
                                  dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                                  activeDot={{ r: 8 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                       <Users className="w-12 h-12 mb-4 opacity-20" />
                       <p>Select a student to begin diagnostic analysis</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Student Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-blue-500 rounded-full opacity-5" />
               
               <h3 className="text-2xl font-bold text-slate-900 mb-2">Enroll New Student</h3>
               <p className="text-slate-500 text-sm mb-8">Maintain college data records with accuracy.</p>

               <form onSubmit={handleAddStudent} className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Student Name</label>
                    <input 
                      required
                      type="text" 
                      value={newStudent.name}
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      placeholder="e.g. Kishore Saravanan"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Roll Number</label>
                      <input 
                        required
                        type="text" 
                        value={newStudent.rollNo}
                        onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        placeholder="CS105"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Academic Batch</label>
                      <input 
                        required
                        type="text" 
                        value={newStudent.batch}
                        onChange={e => setNewStudent({...newStudent, batch: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                        placeholder="e.g. 2018"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Academic Department</label>
                    <input 
                      required
                      type="text" 
                      value={newStudent.department}
                      onChange={e => setNewStudent({...newStudent, department: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      placeholder="Computer Science"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Current Year</label>
                      <select 
                        value={newStudent.year}
                        onChange={e => setNewStudent({...newStudent, year: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                      >
                        {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Overall CGPA</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        min="0"
                        max="10"
                        value={newStudent.cgpa}
                        onChange={e => setNewStudent({...newStudent, cgpa: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        placeholder="e.g. 8.5"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                      Save Profile
                    </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
