import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StaggeredGrid from '../components/StaggeredGrid';

export default function Profile() {
  const { profile, user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [selectedTech, setSelectedTech] = useState([]);
  const [role, setRole] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [gmail, setGmail] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setSelectedTech(profile.tech_stack || []);
      setRole(profile.primary_role || '');
      setLinkedin(profile.linkedin || '');
      setGithub(profile.github || '');
      setGmail(profile.gmail || '');
    }
  }, [profile]);

  return (
    <div className="main-content" style={{ padding: '0px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <StaggeredGrid 
        techStack={selectedTech} 
        centerText={fullName || "KAIROS"} 
        role={role}
        scroller=".main-content" 
        socials={{ linkedin, github, gmail }}
      />
    </div>
  );
}
