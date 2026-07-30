import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Check, Plus, X, User, Edit3, Sparkles } from 'lucide-react';
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import StaggeredGrid from '../components/StaggeredGrid';

const PREDEFINED_TECH = {
  "Languages": ["Python", "JavaScript", "TypeScript", "Rust", "Go", "C++", "HTML/CSS", "Solidity"],
  "Frameworks": ["React", "Next.js", "FastAPI", "Django", "Node.js", "Express", "Svelte", "Flask"],
  "Databases": ["PostgreSQL", "Supabase", "MongoDB", "Redis", "MySQL", "DynamoDB"],
  "AI/ML": ["PyTorch", "TensorFlow", "OpenAI API", "Hugging Face", "LangChain", "Gemini API"],
  "Tools": ["Docker", "Kubernetes", "Git", "AWS", "GitHub Actions", "Vercel"]
};

export default function Profile() {
  const { profile, refreshProfile, API_BASE, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab state: view profile vs edit profile
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Frontend Developer');
  const [experience, setExperience] = useState('Intermediate');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState([]);
  const [customTech, setCustomTech] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRole(profile.primary_role || 'Frontend Developer');
      setExperience(profile.experience_level || 'Intermediate');
      setSelectedTech(profile.tech_stack || []);
      setLinkedinUrl(profile.linkedin_url || '');
      setGithubUrl(profile.github_url || '');
    }
  }, [profile]);

  const toggleMode = (edit) => {
    setIsEditMode(edit);
    if (edit) {
      setSearchParams({ edit: 'true' });
    } else {
      setSearchParams({});
    }
  };

  const handleTechSelect = (tech) => {
    if (!selectedTech.includes(tech)) {
      setSelectedTech([...selectedTech, tech]);
    }
  };

  const handleTechRemove = (tech) => {
    setSelectedTech(selectedTech.filter(t => t !== tech));
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (customTech.trim() && !selectedTech.includes(customTech.trim())) {
      setSelectedTech([...selectedTech, customTech.trim()]);
      setCustomTech('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert("Name is required.");
      return;
    }
    
    setUpdating(true);
    try {
      await axios.post(`${API_BASE}/profiles`, {
        id: user.id,
        full_name: fullName,
        primary_role: role,
        experience_level: experience,
        tech_stack: selectedTech,
        linkedin_url: linkedinUrl,
        github_url: githubUrl
      });
      await refreshProfile();
      alert("Profile updated successfully!");
      toggleMode(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert("Error updating profile.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="main-content flex-1 p-6 md:p-10 flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Top Header & Toggle Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>{isEditMode ? 'Edit Profile' : 'User Profile'}</span>
            <Sparkles className="text-purple-400 w-6 h-6 animate-pulse" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {isEditMode 
              ? 'Update your bio, tech stack, and social connections' 
              : 'Overview of your developer identity and integrated tech stack'}
          </p>
        </div>

        {/* Tab Switcher Button */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-md">
          <button
            onClick={() => toggleMode(false)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              !isEditMode 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User size={14} />
            <span>View Profile</span>
          </button>
          <button
            onClick={() => toggleMode(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isEditMode 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* VIEW PROFILE PAGE */}
      {!isEditMode ? (
        <div className="flex flex-col items-center gap-10 w-full animate-in fade-in zoom-in-95 duration-300">
          
          {/* Top Center: User Name & Role Banner */}
          <div className="flex flex-col items-center text-center gap-3 bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 rounded-3xl p-8 w-full max-w-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
            
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 p-1 shadow-[0_0_35px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full rounded-full bg-[#0d0c14] flex items-center justify-center text-2xl font-black text-white font-mono">
                {fullName ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {fullName || "Anonymous Hackathoner"}
            </h2>

            <div className="flex items-center gap-3 flex-wrap justify-center mt-1">
              <span className="px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                {role}
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium">
                {experience}
              </span>
            </div>
          </div>

          {/* Center: Staggered Tech Stack UI Animation */}
          <div className="w-full">
            <StaggeredGrid 
              items={selectedTech} 
              centerText="MY TECH STACK" 
            />
          </div>

          {/* Bottom Center: Social Cards (LinkedIn & GitHub) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mt-2">
            
            {/* LinkedIn Card */}
            {linkedinUrl ? (
              <a
                href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-4 p-5 rounded-2xl border border-blue-500/30 bg-blue-950/20 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-blue-900/30 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] text-decoration-none"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <FaLinkedin size={26} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-blue-400 uppercase font-mono tracking-wider">LinkedIn</span>
                  <span className="text-sm font-semibold text-white truncate group-hover:text-blue-200 transition-colors">
                    {linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                  </span>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md opacity-60">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
                  <FaLinkedin size={26} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-500 uppercase font-mono tracking-wider">LinkedIn</span>
                  <span className="text-sm text-zinc-400 italic">Not connected</span>
                </div>
              </div>
            )}

            {/* GitHub Card */}
            {githubUrl ? (
              <a
                href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-4 p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-purple-900/30 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] text-decoration-none"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <FaGithub size={26} />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-purple-400 uppercase font-mono tracking-wider">GitHub</span>
                  <span className="text-sm font-semibold text-white truncate group-hover:text-purple-200 transition-colors">
                    {githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                  </span>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md opacity-60">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
                  <FaGithub size={26} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-500 uppercase font-mono tracking-wider">GitHub</span>
                  <span className="text-sm text-zinc-400 italic">Not connected</span>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* EDIT PROFILE PAGE (COMPLETELY SEPARATE EDIT FORM) */
        <div className="w-full max-w-3xl mx-auto bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider text-purple-400">
                /// PERSONAL IDENTITY
              </h3>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Parth Gupta"
                required
              />
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <FaLinkedin className="text-blue-400" /> LinkedIn URL
                </label>
                <input
                  type="url"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <FaGithub className="text-white" /> GitHub URL
                </label>
                <input
                  type="url"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <div className="border-b border-white/10 pb-4 pt-4">
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider text-pink-400">
                /// ROLE & EXPERIENCE
              </h3>
            </div>

            {/* Primary Role */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Primary Role</label>
              <select 
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Research & Pitch">Research & Pitch</option>
              </select>
            </div>

            {/* Experience Level */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Experience Level</label>
              <select 
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                value={experience} 
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="Beginner">Beginner (1st/2nd Hackathon)</option>
                <option value="Intermediate">Intermediate (Experienced coder)</option>
                <option value="Advanced">Advanced (Hackathon winner / Professional)</option>
              </select>
            </div>

            <div className="border-b border-white/10 pb-4 pt-4">
              <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider text-indigo-400">
                /// TECH STACK SELECTION
              </h3>
            </div>

            {/* Search & Select Tech */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Search Technologies</label>
              <input
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Type to filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl p-4 bg-black/40 flex flex-col gap-4 mt-2">
                {Object.entries(PREDEFINED_TECH).map(([category, items]) => {
                  const filtered = items.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
                  if (filtered.length === 0) return null;
                  return (
                    <div key={category} className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase font-mono">{category}</span>
                      <div className="flex flex-wrap gap-2">
                        {filtered.map(tech => (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => handleTechSelect(tech)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 ${
                              selectedTech.includes(tech)
                                ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {tech}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Tech */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Add Custom Technology</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="e.g. Web3.js, Polkadot"
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Selected Tech Chips */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Selected ({selectedTech.length})
              </label>
              <div className="flex flex-wrap gap-2 p-4 bg-black/40 border border-white/10 rounded-xl min-h-[60px] items-center">
                {selectedTech.length === 0 ? (
                  <span className="text-xs text-zinc-500 italic">No technologies selected yet.</span>
                ) : (
                  selectedTech.map(tech => (
                    <div
                      key={tech}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-mono"
                    >
                      <span>{tech}</span>
                      <X
                        size={14}
                        className="cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleTechRemove(tech)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={updating}
              className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-500/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              <span>{updating ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}