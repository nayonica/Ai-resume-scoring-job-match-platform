import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Cpu,
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Loader2,
  FileCheck2,
  ListRestart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Resume, Analysis, TARGET_ROLES, TARGET_ROLES as TargetRolesList, ROLE_REQUIREMENTS, TargetRole } from "./types";

export default function App() {
  // Navigation & Authentication States
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem("resume_auth_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<"landing" | "login" | "signup" | "dashboard">("landing");

  // Dynamic Interaction States
  const [selectedRole, setSelectedRole] = useState<string>("Full Stack Developer");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Loaded Data States
  const [latestResume, setLatestResume] = useState<Resume | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form Fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate session on load
  useEffect(() => {
    if (authToken) {
      fetchUserProfile(authToken);
    } else {
      setCurrentView("landing");
    }
  }, [authToken]);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setCurrentView("dashboard");
        // Pull latest analysis and uploaded resume
        fetchLatestData(token);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("Profile check failed", err);
    }
  };

  const fetchLatestData = async (token: string) => {
    try {
      // 1. Fetch Latest Resume
      const resResponse = await fetch("/api/resume/my-latest", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resResponse.ok) {
        const resData = await resResponse.json();
        setLatestResume(resData.resume);
      }

      // 2. Fetch Latest Analysis
      const anlResponse = await fetch("/api/analysis/latest", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (anlResponse.ok) {
        const anlData = await anlResponse.json();
        setLatestAnalysis(anlData.analysis);
      }
    } catch (err) {
      console.error("Data fetch failed", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("resume_auth_token");
    setAuthToken(null);
    setCurrentUser(null);
    setLatestResume(null);
    setLatestAnalysis(null);
    setCurrentView("landing");
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!signupName || !signupEmail || !signupPassword) {
      setAuthError("All fields are required");
      return;
    }
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: signupName,
          email: signupEmail,
          password: signupPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Registration failed");
        return;
      }
      localStorage.setItem("resume_auth_token", data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      setAuthError("Server communication failed. Please try again.");
    }
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!loginEmail || !loginPassword) {
      setAuthError("Email and password are required");
      return;
    }
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Login credentials invalid");
        return;
      }
      localStorage.setItem("resume_auth_token", data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      setAuthError("Server communication failed. Please try again.");
    }
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setActionError("Only PDF files are supported in Tier 1 of this platform!");
      return;
    }
    setSelectedFile(file);
    setActionError(null);
    setActionSuccess(null);
  };

  // File analysis initiation triggers both upload + analyze sequential steps
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setActionError("Please select a valid PDF file first");
      return;
    }
    if (!authToken) return;

    setIsUploading(true);
    setActionError(null);
    setActionSuccess(null);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("targetRole", selectedRole);

    try {
      setUploadProgress(50);
      const uploadRes = await fetch("/api/resume/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: formData
      });
      setUploadProgress(90);
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setActionError(uploadData.error || "Failed to upload file");
        setIsUploading(false);
        return;
      }

      setLatestResume(uploadData.resume);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setIsAnalyzing(true);
      }, 500);

      // Perform Analysis
      const analysisRes = await fetch(`/api/analysis/run/${uploadData.resume.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ selectedRole })
      });
      const analysisData = await analysisRes.json();
      if (!analysisRes.ok) {
        setActionError(analysisData.error || "Analysis computation failed");
        setIsAnalyzing(false);
        return;
      }

      setLatestAnalysis(analysisData.analysis);
      setActionSuccess("Resume analyzed successfully!");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setActionError("Server processing error. Please check your network.");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* GLOBAL HEADER */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => authToken ? setCurrentView("dashboard") : setCurrentView("landing")}>
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center font-bold shadow-md shadow-indigo-600/10">
              <Cpu size={18} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-lg text-slate-950">ATS Matcher</span>
              <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold font-mono leading-none">Tier 1 MVP</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {authToken ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-900">{currentUser?.fullName}</span>
                  <span className="text-xs text-slate-500 font-mono">{currentUser?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm transition-all cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => { setAuthError(null); setCurrentView("login"); }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthError(null); setCurrentView("signup"); }}
                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-slate-900 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/15 hover:shadow-lg cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* PORTAL BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* LANDING PAGE */}
        {currentView === "landing" && (
          <div className="flex flex-col justify-center py-10 md:py-16">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-3.5 py-1.5 text-indigo-700 text-xs font-semibold">
                <Sparkles size={12} className="text-indigo-600" />
                <span>Automatic Skills & Relevance Matchmaker</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none">
                Score your resume against <span className="text-indigo-600">Target Role</span> requirements.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Our lightweight AI scoring simulator evaluates job relevance, extracts skills, detects missing credentials, and computes your precise ATS match score instantly.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <button
                  onClick={() => { setAuthError(null); setCurrentView("signup"); }}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center space-x-2 cursor-pointer"
                >
                  <span>Build Your Profile</span>
                  <ChevronRight size={16} className="stroke-[2.5]" />
                </button>
                <button
                  onClick={() => { setAuthError(null); setCurrentView("login"); }}
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 hover:-translate-y-0.5 border border-slate-200 transition-all duration-200 text-slate-700 font-bold text-sm rounded-xl cursor-pointer"
                >
                  Existing Account Sign In
                </button>
              </div>
            </div>

            {/* PRE-DEFINED ROLES GRID */}
            <div className="mt-16 sm:mt-24 max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-xs uppercase tracking-widest text-indigo-600 font-bold font-mono">Supported Targets & Mapped Skills</h2>
                <p className="text-sm text-slate-500 mt-1">Preconfigured mappings built into the Tier 1 evaluator</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.keys(ROLE_REQUIREMENTS).map((role) => (
                  <div key={role} className="border border-slate-200/80 bg-white p-5 rounded-2xl relative overflow-hidden group shadow-sm hover:shadow transition-shadow">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/25 to-transparent"></div>
                    <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center space-x-1.5">
                      <Briefcase size={14} className="text-indigo-600" />
                      <span>{role}</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLE_REQUIREMENTS[role as any].slice(0, 6).map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 bg-slate-50 text-[10px] font-mono text-slate-600 rounded border border-slate-200">
                          {skill}
                        </span>
                      ))}
                      {ROLE_REQUIREMENTS[role as any].length > 6 && (
                        <span className="text-[9px] text-slate-400 px-1 font-mono flex items-center">
                          +{ROLE_REQUIREMENTS[role as any].length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUTH PAGES (LOGIN / SIGNUP) */}
        {(currentView === "login" || currentView === "signup") && (
          <div className="min-h-[70vh] flex items-center justify-center py-10">
            <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-md shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{currentView === "login" ? "Sign In" : "Register Account"}</h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  {currentView === "login" ? "Enter credentials to access your dashboard" : "Submit registration to set up your analysis environment"}
                </p>
              </div>

              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 p-3.5 rounded-xl text-xs mb-5 flex items-start space-x-2 font-medium">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              {currentView === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono font-bold text-slate-500 mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono font-bold text-slate-500 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all mt-2 cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    Authenticate
                  </button>

                  <p className="text-center text-xs text-slate-500 pt-3">
                    Don't have an profile yet?{" "}
                    <button
                      type="button"
                      onClick={() => { setAuthError(null); setCurrentView("signup"); }}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Create Profile
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono font-bold text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono font-bold text-slate-500 mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono font-bold text-slate-500 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl text-sm transition-all mt-2 cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    Register Profile
                  </button>

                  <p className="text-center text-xs text-slate-500 pt-3">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => { setAuthError(null); setCurrentView("login"); }}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Authenticate Now
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {currentView === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* INTRO TITLE BANNER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border border-slate-250/60 bg-white p-6 rounded-3xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                  <span>Welcome back, {currentUser?.fullName}!</span>
                </h1>
                <p className="text-slate-500 text-xs mt-1 font-medium">Upload and score dynamic resumes based on pre-vetted metrics.</p>
              </div>
              <div className="mt-4 md:mt-0 font-mono text-xs flex items-center space-x-3 text-slate-600 border border-slate-100 bg-slate-50 px-4 py-2.5 rounded-xl">
                <CheckCircle size={14} className="text-emerald-600" />
                <span className="font-semibold">DB Status: Connected (Local JSON mode)</span>
              </div>
            </div>

            {/* TWO COLUMN INTERACTIVE BODY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: UPLOAD & ROLE CHOOSE CONTROL */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white border border-slate-205/80 p-6 rounded-3xl space-y-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <Upload size={16} className="text-indigo-600" />
                    <span>Analysis Input</span>
                  </h2>

                  {/* System Error Notification in dashboard */}
                  {actionError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs flex items-start space-x-2 font-medium">
                      <ShieldAlert size={15} className="mt-0.5 shrink-0 text-rose-600" />
                      <span>{actionError}</span>
                    </div>
                  )}

                  {actionSuccess && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl text-xs flex items-start space-x-2 font-medium">
                      <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  {/* INPUT DROPDOWN - Target Job Role */}
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-mono font-bold text-slate-500">Target Role Selection</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer transition-colors font-medium shadow-sm"
                    >
                      {TARGET_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  {/* FILE DROP ZONE FIELD */}
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-mono font-bold text-slate-500">Resume Upload (PDF Only)</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        selectedFile
                          ? "border-indigo-500/50 bg-indigo-50/10 text-slate-900 hover:bg-indigo-50/20"
                          : "border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf"
                      />
                      <FileText size={32} className={selectedFile ? "text-indigo-600" : "text-slate-400 mb-2"} />
                      {selectedFile ? (
                        <div className="text-center mt-2">
                          <span className="text-sm font-bold text-slate-800 block truncate max-w-xs">{selectedFile.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB • Click to swap file</span>
                        </div>
                      ) : (
                        <div className="text-center mt-2">
                          <span className="text-sm font-semibold text-slate-700 block">Click or Drop PDF resume</span>
                          <span className="text-[10px] text-slate-400 block mt-1">Accepts PDF files up to 10MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ANALYZE BUTTON ACTION */}
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || isUploading || isAnalyzing}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                      selectedFile && !isUploading && !isAnalyzing
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md shadow-indigo-600/10"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-indigo-500" />
                        <span>Uploading Resume ({uploadProgress}%)</span>
                      </>
                    ) : isAnalyzing ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-indigo-500" />
                        <span>AI Parsing & Computing Match...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Run Relevance Assessment</span>
                      </>
                    )}
                  </button>
                </div>

                {/* TARGET ROLE SKILLS REFERENCE BOX */}
                <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
                  <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-500 mb-3 flex items-center space-x-1 border-b border-slate-55/70 pb-2">
                    <TrendingUp size={12} className="text-indigo-600" />
                    <span>Required Competencies for {selectedRole}</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_REQUIREMENTS[selectedRole as TargetRole]?.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-slate-50 text-xs font-mono rounded-lg border border-slate-200 text-slate-600 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: CORE SUMMARY / OUTCOMES */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  {latestAnalysis ? (
                    <motion.div
                      key={latestAnalysis.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      
                      {/* SCORE CARDS ROW */}
                      <div className="grid grid-cols-3 gap-4">
                        
                        {/* CARD 1: OVERALL SCORE */}
                        <div className="bg-white border border-slate-200/85 p-4 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center shadow-sm">
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
                          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500 mb-2">Overall Score</span>
                          <div className="relative flex items-center justify-center h-20 w-20">
                            {/* Radial background placeholder style */}
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="40" cy="40" r="32" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                              <circle cx="40" cy="40" r="32" className="stroke-emerald-500 transition-all duration-1000" strokeWidth="6" fill="transparent"
                                strokeDasharray={2 * Math.PI * 32}
                                strokeDashoffset={2 * Math.PI * 32 * (1 - latestAnalysis.overallScore / 100)} />
                            </svg>
                            <span className="absolute text-xl font-bold text-slate-900">{latestAnalysis.overallScore}%</span>
                          </div>
                          <span className="text-[9px] text-emerald-600 font-mono mt-2 font-bold uppercase tracking-widest">Weighted 100%</span>
                        </div>

                        {/* CARD 2: ATS SCORE */}
                        <div className="bg-white border border-slate-200/85 p-4 rounded-3xl relative flex flex-col items-center justify-center text-center shadow-sm">
                          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500 mb-2">ATS Score</span>
                          <div className="relative flex items-center justify-center h-20 w-20">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="40" cy="40" r="32" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                              <circle cx="40" cy="40" r="32" className="stroke-indigo-600 transition-all duration-1000" strokeWidth="6" fill="transparent"
                                strokeDasharray={2 * Math.PI * 32}
                                strokeDashoffset={2 * Math.PI * 32 * (1 - latestAnalysis.atsScore / 100)} />
                            </svg>
                            <span className="absolute text-xl font-bold text-slate-900">{latestAnalysis.atsScore}%</span>
                          </div>
                          <span className="text-[9px] text-indigo-600 font-mono mt-2 font-bold uppercase tracking-widest">Weight: 40%</span>
                        </div>

                        {/* CARD 3: ROLE MATCH */}
                        <div className="bg-white border border-slate-200/85 p-4 rounded-3xl relative flex flex-col items-center justify-center text-center shadow-sm">
                          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500 mb-2">Role Match</span>
                          <div className="relative flex items-center justify-center h-20 w-20">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="40" cy="40" r="32" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                              <circle cx="40" cy="40" r="32" className="stroke-emerald-500 transition-all duration-1000" strokeWidth="6" fill="transparent"
                                strokeDasharray={2 * Math.PI * 32}
                                strokeDashoffset={2 * Math.PI * 32 * (1 - latestAnalysis.roleMatchScore / 100)} />
                            </svg>
                            <span className="absolute text-xl font-bold text-slate-900">{latestAnalysis.roleMatchScore}%</span>
                          </div>
                          <span className="text-[9px] text-emerald-600 font-mono mt-2 font-bold uppercase tracking-widest">Weight: 60%</span>
                        </div>

                      </div>

                      {/* SUMMARY BRIEF DETAILS */}
                      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                          <h3 className="font-bold text-sm text-slate-800">Analysis Metadata</h3>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(latestAnalysis.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="flex justify-between items-center bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-500">File Analyzed</span>
                            <span className="text-slate-950 font-bold max-w-[140px] truncate" title={latestResume?.fileName}>{latestResume?.fileName}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
                            <span className="text-slate-500">Selected Target</span>
                            <span className="text-indigo-600 font-bold">{latestAnalysis.selectedRole}</span>
                          </div>
                        </div>
                      </div>

                      {/* DUAL COLUMN SKILL REFILL PANEL */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        
                        {/* MET REQUIRED SKILLS */}
                        <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col shadow-sm">
                          <h4 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-500 mb-3 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                            <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                            <span>Matched Skills ({latestAnalysis.matchedSkills.length})</span>
                          </h4>
                          {latestAnalysis.matchedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 align-start">
                              {latestAnalysis.matchedSkills.map(skill => (
                                <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold rounded-lg">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic py-2">No key matching skills detected for role.</span>
                          )}
                        </div>

                        {/* MISSING REQUIRED SKILLS */}
                        <div className="bg-white border border-slate-200 p-5 rounded-3xl flex flex-col shadow-sm">
                          <h4 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-400 mb-3 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                            <AlertCircle size={13} className="text-rose-600 shrink-0" />
                            <span>Missing Skills ({latestAnalysis.missingSkills.length})</span>
                          </h4>
                          {latestAnalysis.missingSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 align-start">
                              {latestAnalysis.missingSkills.map(skill => (
                                <span key={skill} className="px-2.5 py-1 bg-rose-50 text-rose-850 border border-rose-100 text-xs font-semibold rounded-lg">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-700 italic font-bold py-2">Awesome! Full requirements met!</span>
                          )}
                        </div>

                      </div>

                      {/* GENERAL DETECTED SKILLS FROM MASTER LIST */}
                      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                        <h4 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-500 mb-3 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                          <FileCheck2 size={13} className="text-indigo-600" />
                          <span>All Extracted Dictionary Skills ({latestAnalysis.extractedSkills.length})</span>
                        </h4>
                        {latestAnalysis.extractedSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {latestAnalysis.extractedSkills.map(skill => (
                              <span key={skill} className="px-2 py-1 bg-slate-50 text-slate-700 border border-slate-200 text-xs font-mono rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No master dictionary keywords detected.</span>
                        )}
                      </div>

                    </motion.div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center space-y-4 shadow-sm">
                      <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                        <FileText size={36} />
                      </div>
                      <div className="max-w-md">
                        <h3 className="font-bold text-sm text-slate-700">No Assessment Loaded</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">Please select your target job role, upload your PDF format resume on the left portal form, and push "Run Relevance Assessment" to compute results.</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER METRICS INFO */}
      <footer className="border-t border-slate-200 py-6 mt-12 bg-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="font-medium">AI Resume Scoring & Job Match Platform • Tier 1 MVP Build</span>
          <span className="mt-2 sm:mt-0 font-medium">Node.js Express React Full-Stack Environment</span>
        </div>
      </footer>
    </div>
  );
}
