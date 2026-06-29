import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Check, Plus, X } from 'lucide-react';
import { getTechIconUrl } from '../utils/techIcons';

const PREDEFINED_TECH = {
  "Languages": ["Python", "JavaScript", "TypeScript", "Rust", "Go", "C++", "HTML/CSS", "Solidity"],
  "Frameworks": ["React", "Next.js", "FastAPI", "Django", "Node.js", "Express", "Svelte", "Flask"],
  "Databases": ["PostgreSQL", "Supabase", "MongoDB", "Redis", "MySQL", "DynamoDB"],
  "AI/ML": ["PyTorch", "TensorFlow", "OpenAI API", "Hugging Face", "LangChain", "Gemini API"],
  "Tools": ["Docker", "Kubernetes", "Git", "AWS", "GitHub Actions", "Vercel"]
};

export default function EditProfile() {
  const { profile, refreshProfile, API_BASE, user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Frontend Developer');
  const [experience, setExperience] = useState('Intermediate');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState([]);
  const [customTech, setCustomTech] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [gmail, setGmail] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRole(profile.primary_role || 'Frontend Developer');
      setExperience(profile.experience_level || 'Intermediate');
      setSelectedTech(profile.tech_stack || []);
      setLinkedin(profile.linkedin || '');
      setGithub(profile.github || '');
      setGmail(profile.gmail || '');
    }
  }, [profile]);

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
        linkedin: linkedin,
        github: github,
        gmail: gmail
      });
      await refreshProfile();
      alert("Profile updated successfully!");
    } catch (err) {
      console.error('Error saving profile:', err);
      alert("Error updating profile.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="main-content" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-header" style={{ marginBottom: '16px', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#fff' }}>Edit Profile Settings</h1>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
            Update your role, experience level, social details, and programming tech stack.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        {/* Right Column: Settings Form */}
        <div className="profile-card-right">
          <form onSubmit={handleSubmit}>
            <div className="profile-section-header">/// USER_IDENTITY</div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Full Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Azhaan Ali Siddiqui"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>LinkedIn (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="e.g. https://linkedin.com/in/username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>GitHub (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="e.g. https://github.com/username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Gmail (Optional)</label>
              <input
                type="email"
                className="form-input"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="e.g. username@gmail.com"
              />
            </div>

            <div className="profile-section-header">/// PROFESSIONAL_LEVEL</div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Primary Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Research & Pitch">Research & Pitch</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Experience Level</label>
              <select className="form-select" value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="Beginner">Beginner (1st/2nd Hackathon)</option>
                <option value="Intermediate">Intermediate (Experienced coder)</option>
                <option value="Advanced">Advanced (Hackathon winner / Professional)</option>
              </select>
            </div>

            <div className="profile-section-header">/// KERNEL_INTEGRATION</div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Search & Select Tech Stack</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search technologies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', marginTop: '8px' }}>
                {Object.entries(PREDEFINED_TECH).map(([category, items]) => {
                  const filtered = items.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
                  if (filtered.length === 0) return null;
                  return (
                    <div key={category} style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 'bold', marginBottom: '6px', fontFamily: 'monospace' }}>{category}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {filtered.map(tech => (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => handleTechSelect(tech)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: selectedTech.includes(tech) ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.03)',
                              color: selectedTech.includes(tech) ? '#ffffff' : '#9ca3af',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontFamily: 'monospace'
                            }}
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

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Add Custom Technology</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flexGrow: 1 }}
                  placeholder="e.g. Web3.js"
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                />
                <button type="button" onClick={handleAddCustom} className="btn btn-secondary" style={{ padding: '0 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Selected Technologies</label>
              <div className="tag-input-container" style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {selectedTech.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#6b7280', padding: '4px' }}>No skills integrated yet.</span>
                ) : (
                  selectedTech.map(tech => (
                    <div key={tech} className="tag" style={{ background: 'rgba(236, 72, 153, 0.05)', borderColor: 'rgba(236, 72, 153, 0.15)', color: '#ffffff' }}>
                      {tech}
                      <X size={12} className="tag-remove" onClick={() => handleTechRemove(tech)} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} disabled={updating}>
              <Check size={18} /> {updating ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
