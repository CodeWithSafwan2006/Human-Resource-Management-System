import { useState, useEffect, useRef } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';

const baseUrl = process.env.REACT_APP_API_URL || 'https://human-resource-management-system-1rfq.onrender.com';

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const INITIAL_EMPLOYEES = [
  { id: "E001", name: "Priya Sharma", email: "priya@acmecorp.com", role: "employee", department: "Engineering", designation: "Senior Developer", joinDate: "2021-03-15", phone: "9876543210", password: "pass123", managerId: "HR001" },
  { id: "E002", name: "Rahul Mehta", email: "rahul@acmecorp.com", role: "employee", department: "Marketing", designation: "Marketing Analyst", joinDate: "2022-07-01", phone: "9876543211", password: "pass123", managerId: "HR001" },
  { id: "E003", name: "Anjali Nair", email: "anjali@acmecorp.com", role: "employee", department: "Engineering", designation: "QA Engineer", joinDate: "2020-11-20", phone: "9876543212", password: "pass123", managerId: "HR001" },
  { id: "E004", name: "Vikram Singh", email: "vikram@acmecorp.com", role: "employee", department: "Sales", designation: "Sales Lead", joinDate: "2019-06-10", phone: "9876543213", password: "pass123", managerId: "HR001" },
  { id: "HR001", name: "Meena Kapoor", email: "hr@acmecorp.com", role: "hr", department: "Human Resources", designation: "HR Manager", joinDate: "2018-01-05", phone: "9876543214", password: "hr123", managerId: null },
  { id: "F001", name: "Suresh Iyer", email: "finance@acmecorp.com", role: "finance", department: "Finance", designation: "Finance Head", joinDate: "2017-09-01", phone: "9876543215", password: "fin123", managerId: null },
];

const INITIAL_SALARY_STRUCTURES = {
  "E001": { basic: 85000, hra: 34000, bonus: 12000, transport: 5000, medical: 3000, pf: 10200, tax: 8500, other_deductions: 2000 },
  "E002": { basic: 60000, hra: 24000, bonus: 8000, transport: 4000, medical: 2500, pf: 7200, tax: 5500, other_deductions: 1500 },
  "E003": { basic: 70000, hra: 28000, bonus: 9000, transport: 4500, medical: 2800, pf: 8400, tax: 6800, other_deductions: 1800 },
  "E004": { basic: 75000, hra: 30000, bonus: 15000, transport: 5000, medical: 3000, pf: 9000, tax: 7200, other_deductions: 2000 },
  "HR001": { basic: 90000, hra: 36000, bonus: 10000, transport: 6000, medical: 3500, pf: 10800, tax: 9000, other_deductions: 2500 },
  "F001": { basic: 95000, hra: 38000, bonus: 12000, transport: 6000, medical: 3500, pf: 11400, tax: 9800, other_deductions: 2500 },
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const genAttendance = (empId) => {
  const records = {};
  [0,1,2].forEach(mOffset => {
    const d = new Date(); d.setMonth(d.getMonth() - mOffset);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const working = mOffset === 0 ? Math.floor(Math.random()*5)+16 : Math.floor(Math.random()*3)+22;
    records[key] = { workingDays: 26, present: working, absent: 26-working, late: Math.floor(Math.random()*3) };
  });
  return records;
};

const INITIAL_ATTENDANCE = Object.fromEntries(
  INITIAL_EMPLOYEES.filter(e=>e.role==="employee").map(e=>[e.id, genAttendance(e.id)])
);

const INITIAL_LEAVES = {
  "E001": { annual: 15, sick: 10, casual: 7, used_annual: 3, used_sick: 2, used_casual: 1 },
  "E002": { annual: 15, sick: 10, casual: 7, used_annual: 5, used_sick: 0, used_casual: 2 },
  "E003": { annual: 15, sick: 10, casual: 7, used_annual: 1, used_sick: 3, used_casual: 0 },
  "E004": { annual: 15, sick: 10, casual: 7, used_annual: 7, used_sick: 1, used_casual: 3 },
};

const INITIAL_LEAVE_REQUESTS = [
  { id: "LR001", empId: "E001", type: "annual", from: "2025-04-10", to: "2025-04-12", days: 3, reason: "Family vacation", status: "approved", appliedOn: "2025-04-01" },
  { id: "LR002", empId: "E002", type: "sick", from: "2025-04-15", to: "2025-04-16", days: 2, reason: "Fever", status: "pending", appliedOn: "2025-04-14" },
  { id: "LR003", empId: "E003", type: "casual", from: "2025-04-20", to: "2025-04-20", days: 1, reason: "Personal work", status: "pending", appliedOn: "2025-04-18" },
  { id: "LR004", empId: "E004", type: "annual", from: "2025-03-05", to: "2025-03-08", days: 4, reason: "Travel", status: "rejected", appliedOn: "2025-03-01" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const calcNetSalary = (s, attendance, monthKey) => {
  if (!s) return 0;
  const gross = s.basic + s.hra + s.bonus + s.transport + s.medical;
  const deductions = s.pf + s.tax + s.other_deductions;
  const att = attendance && monthKey ? attendance[monthKey] : null;
  let absentDeduction = 0;
  if (att) { const daily = s.basic / att.workingDays; absentDeduction = Math.round(daily * att.absent); }
  return Math.max(0, gross - deductions - absentDeduction);
};

const fmtCurrency = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '-';
const getCurrentMonthKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const getMonthLabel = (key) => { const [y,m]=key.split('-'); return `${MONTHS[parseInt(m)-1]} ${y}`; };
const getInitials = (name) => name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || 'XX';
const avatarColor = (name) => { const colors=['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#0369a1','#065f46']; const i=name?.charCodeAt(0)%colors.length||0; return colors[i]; };

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Avatar = ({name,size=36}) => (
  <div style={{width:size,height:size,borderRadius:'50%',background:`linear-gradient(145deg, ${avatarColor(name)}, #111827)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:size*0.35,flexShrink:0,boxShadow:'0 8px 20px rgba(17,24,39,0.22)'}}>
    {getInitials(name)}
  </div>
);

const Badge = ({children,color='gray',style={}}) => {
  const colors = {
    green:{bg:'#dcfce7',text:'#166534',border:'#86efac'}, red:{bg:'#fee2e2',text:'#991b1b',border:'#fca5a5'},
    yellow:{bg:'#fef9c3',text:'#854d0e',border:'#fde047'}, blue:{bg:'#dbeafe',text:'#1e40af',border:'#93c5fd'},
    gray:{bg:'#f3f4f6',text:'#374151',border:'#d1d5db'}, purple:{bg:'#ede9fe',text:'#5b21b6',border:'#c4b5fd'},
    orange:{bg:'#ffedd5',text:'#9a3412',border:'#fdba74'},
  };
  const c = colors[color]||colors.gray;
  return <span style={{background:c.bg,color:c.text,padding:'3px 10px',borderRadius:999,border:`1px solid ${c.border}`,fontSize:11,fontWeight:700,whiteSpace:'nowrap',letterSpacing:0.2,textTransform:'uppercase',...style}}>{children}</span>;
};

const Card = ({children,style={}}) => (
  <div style={{background:'linear-gradient(180deg,#ffffff 0%,#fcfcff 100%)',border:'1px solid #e5e7eb',borderRadius:18,padding:'1.25rem',boxShadow:'0 10px 30px rgba(15,23,42,0.06)',...style}}>{children}</div>
);

const StatCard = ({label,value,icon,color='#4f46e5',sub}) => (
  <Card style={{display:'flex',flexDirection:'column',gap:4}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <span style={{fontSize:13,color:'#6b7280',fontWeight:500}}>{label}</span>
      <span style={{fontSize:22}}>{icon}</span>
    </div>
    <div style={{fontSize:28,fontWeight:700,color,letterSpacing:-1}}>{value}</div>
    {sub && <div style={{fontSize:12,color:'#9ca3af'}}>{sub}</div>}
  </Card>
);

const Modal = ({open,onClose,title,children,width=500}) => {
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:width,maxHeight:'90vh',overflow:'auto',boxShadow:'0 25px 50px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:'#111827'}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:'#6b7280',padding:0,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:'1.5rem'}}>{children}</div>
      </div>
    </div>
  );
};

const Input = ({label,type='text',value,onChange,placeholder,required,disabled,min,max,step}) => (
  <div style={{display:'flex',flexDirection:'column',gap:4}}>
    {label && <label style={{fontSize:12,fontWeight:700,color:'#374151',letterSpacing:0.3,textTransform:'uppercase'}}>{label}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled} min={min} max={max} step={step}
      style={{padding:'11px 12px',border:'1.5px solid #d1d5db',borderRadius:12,fontSize:14,outline:'none',background:disabled?'#f9fafb':'#fff',color:'#111827',transition:'all 0.2s ease'}} />
  </div>
);

const Select = ({label,value,onChange,options,required}) => (
  <div style={{display:'flex',flexDirection:'column',gap:4}}>
    {label && <label style={{fontSize:12,fontWeight:700,color:'#374151',letterSpacing:0.3,textTransform:'uppercase'}}>{label}{required&&<span style={{color:'#ef4444'}}> *</span>}</label>}
    <select value={value} onChange={onChange} required={required} style={{padding:'11px 12px',border:'1.5px solid #d1d5db',borderRadius:12,fontSize:14,outline:'none',background:'#fff',color:'#111827'}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Btn = ({children,onClick,color='primary',size='md',disabled,style={}}) => {
  const colors = {
    primary:{bg:'linear-gradient(135deg,#4f46e5,#7c3aed)',text:'#fff',border:'none'},
    danger:{bg:'#ef4444',text:'#fff'},
    success:{bg:'#10b981',text:'#fff'},
    ghost:{bg:'#eef2ff',text:'#4338ca',border:'1px solid #c7d2fe'},
    gray:{bg:'#f3f4f6',text:'#374151',border:'1px solid #e5e7eb'},
  };
  const c=colors[color]||colors.primary;
  const sz={sm:{padding:'6px 12px',fontSize:12},md:{padding:'9px 16px',fontSize:14},lg:{padding:'11px 24px',fontSize:15}}[size]||{};
  return (
    <button onClick={onClick} disabled={disabled} style={{...sz,background:c.bg,color:c.text,border:c.border||'none',borderRadius:12,fontWeight:700,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,boxShadow:disabled?'none':'0 8px 18px rgba(79,70,229,0.16)',transition:'all 0.2s ease',...style}}>
      {children}
    </button>
  );
};

const Tabs = ({tabs,active,onChange}) => (
  <div style={{display:'flex',gap:6,background:'#eef2ff',padding:6,borderRadius:14,overflowX:'auto',border:'1px solid #dbe2ff'}}>
    {tabs.map(t=>(
      <button key={t.id} onClick={()=>onChange(t.id)} style={{padding:'8px 16px',borderRadius:10,border:'none',background:active===t.id?'linear-gradient(135deg,#ffffff,#f8faff)':'transparent',color:active===t.id?'#312e81':'#4b5563',fontWeight:active===t.id?700:600,cursor:'pointer',fontSize:13,whiteSpace:'nowrap',boxShadow:active===t.id?'0 8px 18px rgba(37,99,235,0.15)':'none'}}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

// ─── AI CHATBOT ───────────────────────────────────────────────────────────────
const AIChatbot = ({user, employees, salaryStructures, attendance, leaves, leaveRequests, setLeaveRequests, setLeaves, dailyPunches, setDailyPunches}) => {
  const [messages, setMessages] = useState([
    {role:'assistant', content:`Hi ${user.name.split(' ')[0]}! 👋 I'm your HRMS AI assistant. I can help you with salary queries, leave balance, attendance records, payroll analytics, and more. What would you like to know?`}
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  const buildContext = () => {
    const emp = employees.find(e=>e.id===user.id)||user;
    const sal = salaryStructures[user.id];
    const att = attendance[user.id]||{};
    const lv = leaves[user.id];
    const myLeaves = leaveRequests.filter(r=>r.empId===user.id);
    const monthKey = getCurrentMonthKey();
    const net = sal ? calcNetSalary(sal, att, monthKey) : null;

    if (user.role === 'employee') {
      return `Employee: ${emp.name}, Dept: ${emp.department}, Designation: ${emp.designation}.
Salary: Basic=${fmtCurrency(sal?.basic)}, HRA=${fmtCurrency(sal?.hra)}, Bonus=${fmtCurrency(sal?.bonus)}, Net this month=${net?fmtCurrency(net):'N/A'}.
Leave Balance: Annual=${lv?(lv.annual-lv.used_annual):0}/${lv?.annual||0}, Sick=${lv?(lv.sick-lv.used_sick):0}/${lv?.sick||0}, Casual=${lv?(lv.casual-lv.used_casual):0}/${lv?.casual||0}.
Recent Leave Requests: ${myLeaves.slice(-3).map(r=>`${r.type} from ${r.from} to ${r.to} (${r.status})`).join('; ')||'None'}.
Attendance this month: Present=${att[monthKey]?.present||0}, Absent=${att[monthKey]?.absent||0} days.`;
    }
    if (user.role === 'hr') {
      const emps = employees.filter(e=>e.role==='employee');
      const pending = leaveRequests.filter(r=>r.status==='pending');
      return `HR Manager: ${user.name}. Total employees: ${emps.length}. Pending leave requests: ${pending.length}.
Departments: ${[...new Set(emps.map(e=>e.department))].join(', ')}.
Recent leave requests: ${pending.map(r=>{const e=employees.find(x=>x.id===r.empId); return `${e?.name} requests ${r.type} leave (${r.from} to ${r.to})`}).join('; ')||'None pending'}.`;
    }
    if (user.role === 'finance') {
      const emps = employees.filter(e=>e.role==='employee');
      const totalPayroll = emps.reduce((sum,e)=>{ const s=salaryStructures[e.id]; return sum+(s?s.basic+s.hra+s.bonus+s.transport+s.medical:0); },0);
      const totalDeductions = emps.reduce((sum,e)=>{ const s=salaryStructures[e.id]; return sum+(s?s.pf+s.tax+s.other_deductions:0); },0);
      return `Finance Head: ${user.name}. Total payroll gross: ${fmtCurrency(totalPayroll)}/month. Total deductions: ${fmtCurrency(totalDeductions)}/month. Net payroll: ${fmtCurrency(totalPayroll-totalDeductions)}/month.
Employees count: ${emps.length}. Avg salary: ${fmtCurrency(Math.round(totalPayroll/emps.length))}.
Departments: ${[...new Set(emps.map(e=>e.department))].map(d=>{const de=emps.filter(e=>e.department===d);const dp=de.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.basic:0);},0);return `${d}(${de.length} employees, ₹${Math.round(dp/1000)}k basic total)`;}).join('; ')}.`;
    }
    return '';
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const context = buildContext();
      const systemPrompt = `You are an intelligent HRMS AI assistant for AcmeCorp. You have access to real company HR data.
Current user role: ${user.role}. Context: ${context}
Guidelines:
- Answer concisely and helpfully using the provided data
- Format currency as Indian Rupees (₹)
- Be professional but friendly
      const systemPrompt = `You are a helpful HRMS AI assistant for AcmeCorp. 
  You can access the user's data and help them with queries.
  Current User: ${user.name} (Role: ${user.role}, ID: ${user.id})
  Context: ${context}
  
  SPECIAL COMMANDS:
  1. To download a salary slip: [DOWNLOAD_SLIP:month] (e.g. [DOWNLOAD_SLIP:March])
  2. To apply for leave: [APPLY_LEAVE:days:startDate:reason] (e.g. [APPLY_LEAVE:2:2024-05-10:Family Function])
  3. To mark attendance for today (punch in/start work): [PUNCH_IN]
  4. To mark end of day (punch out/leave work): [PUNCH_OUT]
  Include these tokens anywhere in your reply.`;

      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
        systemPrompt: systemPrompt,
        messages: [...messages, userMsg].map(m=>({role:m.role, content:m.content}))
      })
      });
      const data = await response.json();
      let reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      
      let hasDownloadBtn = false;
      let downloadMonth = null;
      if (reply.includes('[DOWNLOAD_SLIP:')) {
        const match = reply.match(/\[DOWNLOAD_SLIP:([^\]]+)\]/);
        downloadMonth = match ? match[1] : null;
        reply = reply.replace(/\[DOWNLOAD_SLIP:[^\]]+\]/g, '').trim();
        hasDownloadBtn = true;
      }

      // Handle Apply Leave
      let isPunchIn = false, isPunchOut = false;
      if (reply.includes("[APPLY_LEAVE:")) {
        const match = reply.match(/\[APPLY_LEAVE:(\d+):([\d-]+):([^\]]+)\]/);
        if (match) {
          const [_, days, date, reason] = match;
          setLeaveRequests(prev => [
            { id: `LR${Date.now()}`, empId: user.id, type: 'casual', from: date, to: date, days: parseInt(days), reason: reason, status: 'pending', appliedOn: new Date().toISOString().split('T')[0] },
            ...prev
          ]);
          reply = reply.replace(/\[APPLY_LEAVE:[^\]]+\]/, `✅ Leave request for ${days} days starting ${date} has been submitted.`);
        }
      }

      // Handle Punch In
      if (reply.includes('[PUNCH_IN]') && setDailyPunches) {
        reply = reply.replace(/\[PUNCH_IN\]/g, '').trim();
        const today = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        setDailyPunches(prev => ({...prev, [user.id]: {...(prev[user.id]||{}), [today]: {punchIn: time, ...(prev[user.id]?.[today]||{})}}}));
        reply += `\n\n✅ Auto-Action: You have been punched in successfully for today at ${time}. Have a great workday!`;
        isPunchIn = true;
      }

      // Handle Punch Out
      if (reply.includes('[PUNCH_OUT]') && setDailyPunches) {
        reply = reply.replace(/\[PUNCH_OUT\]/g, '').trim();
        const today = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        setDailyPunches(prev => ({...prev, [user.id]: {...(prev[user.id]||{}), [today]: {...(prev[user.id]?.[today]||{}), punchOut: time}}}));
        reply += `\n\n✅ Auto-Action: You have been punched out successfully at ${time}. See you tomorrow!`;
        isPunchOut = true;
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: reply, hasDownloadBtn, downloadMonth, isPunchIn, isPunchOut }]);
    } catch(e) {
      setMessages(prev=>[...prev, {role:'assistant', content:"I'm having trouble connecting right now. Please try again shortly."}]);
    }
    setLoading(false);
  };

  const quickQuestions = user.role==='employee'
    ? ["What's my net salary this month?","How many leave days do I have left?","Show my attendance summary"]
    : user.role==='hr'
    ? ["How many leave requests are pending?","Which department has the most employees?","Give me a headcount summary"]
    : ["What's the total monthly payroll?","Which department costs the most?","Suggest bonus optimization strategies"];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',minHeight:500}}>
      <div style={{flex:1,overflowY:'auto',padding:'1rem',display:'flex',flexDirection:'column',gap:12}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',flexDirection:m.role==='user'?'row-reverse':'row'}}>
            {m.role==='assistant'
              ? <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🤖</div>
              : <Avatar name={user.name} size={32}/>}
            <div style={{maxWidth:'75%',padding:'10px 14px',borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',background:m.role==='user'?'#4f46e5':'#f3f4f6',color:m.role==='user'?'#fff':'#1f2937',fontSize:14,lineHeight:1.6,whiteSpace:'pre-wrap'}}>
              {m.content}
              {m.hasDownloadBtn && (
                <div style={{marginTop:10}}>
                  <Btn onClick={() => {
                    const monthKey = getCurrentMonthKey();
                    const emp = employees.find(e=>e.id===user.id)||user;
                    const sal = salaryStructures[user.id];
                    const att = attendance[user.id]||{};
                    downloadSlip(emp, sal, att[monthKey]||null, monthKey);
                  }} size="sm" color="primary">⬇ Download PDF</Btn>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#4f46e5,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🤖</div>
            <div style={{padding:'10px 14px',borderRadius:'18px 18px 18px 4px',background:'#f3f4f6'}}>
              <div style={{display:'flex',gap:4,alignItems:'center'}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#9ca3af',animation:`pulse 1s ${i*0.2}s infinite`}}/>)}</div>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{padding:'0.75rem 1rem',borderTop:'1px solid #e5e7eb',background:'#fafafa'}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
          {quickQuestions.map((q,i)=>(
            <button key={i} onClick={()=>{setInput(q);}} style={{padding:'4px 10px',background:'#ede9fe',color:'#5b21b6',border:'none',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:500}}>{q}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}}
            placeholder="Ask about salary, leaves, payroll..." style={{flex:1,padding:'10px 14px',border:'1.5px solid #d1d5db',borderRadius:24,fontSize:14,outline:'none',background:'#fff'}}/>
          <button onClick={sendMessage} disabled={loading||!input.trim()} style={{padding:'10px 18px',background:'#4f46e5',color:'#fff',border:'none',borderRadius:24,fontWeight:700,cursor:'pointer',fontSize:14,opacity:loading||!input.trim()?0.5:1}}>Send</button>
        </div>
      </div>
    </div>
  );
};

// ─── PDF SALARY SLIP GENERATOR ────────────────────────────────────────────────
const generateSalarySlipHTML = (employee, sal, att, monthKey) => {
  const net = calcNetSalary(sal, att, monthKey);
  const gross = sal.basic + sal.hra + sal.bonus + sal.transport + sal.medical;
  const totalDed = sal.pf + sal.tax + sal.other_deductions;
  const absentDed = att ? Math.round((sal.basic/att.workingDays)*att.absent) : 0;
  const [year, month] = monthKey.split('-');
  const monthName = MONTHS[parseInt(month)-1];

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
body{font-family:Arial,sans-serif;padding:40px;color:#1f2937;margin:0}
.header{text-align:center;border-bottom:3px solid #4f46e5;padding-bottom:20px;margin-bottom:24px}
.company{font-size:24px;font-weight:800;color:#4f46e5}
.slip-title{font-size:16px;color:#6b7280;margin-top:4px}
.emp-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;background:#f9fafb;padding:16px;border-radius:8px}
.info-row{display:flex;flex-direction:column}
.info-label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px}
.info-val{font-size:14px;font-weight:600;color:#1f2937}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#4f46e5;color:#fff;padding:10px 14px;text-align:left;font-size:13px}
td{padding:9px 14px;font-size:13px;border-bottom:1px solid #f3f4f6}
tr:nth-child(even) td{background:#f9fafb}
.net-row{background:#ede9fe!important;font-weight:800;font-size:15px}
.footer{text-align:center;margin-top:32px;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb;padding-top:16px}
.sign{display:flex;justify-content:space-between;margin-top:40px;font-size:12px;color:#6b7280}
</style></head><body>
<div class="header">
  <div class="company">AcmeCorp Pvt. Ltd.</div>
  <div class="slip-title">SALARY SLIP — ${monthName.toUpperCase()} ${year}</div>
</div>
<div class="emp-info">
  <div class="info-row"><span class="info-label">Employee ID</span><span class="info-val">${employee.id}</span></div>
  <div class="info-row"><span class="info-label">Employee Name</span><span class="info-val">${employee.name}</span></div>
  <div class="info-row"><span class="info-label">Department</span><span class="info-val">${employee.department}</span></div>
  <div class="info-row"><span class="info-label">Designation</span><span class="info-val">${employee.designation}</span></div>
  <div class="info-row"><span class="info-label">Date of Joining</span><span class="info-val">${fmtDate(employee.joinDate)}</span></div>
  <div class="info-row"><span class="info-label">Pay Period</span><span class="info-val">${monthName} ${year}</span></div>
  ${att?`<div class="info-row"><span class="info-label">Days Present</span><span class="info-val">${att.present}/${att.workingDays}</span></div>
  <div class="info-row"><span class="info-label">Days Absent</span><span class="info-val">${att.absent}</span></div>`:''}
</div>
<table>
  <tr><th>Earnings</th><th>Amount (₹)</th><th>Deductions</th><th>Amount (₹)</th></tr>
  <tr><td>Basic Salary</td><td>₹${sal.basic.toLocaleString('en-IN')}</td><td>Provident Fund</td><td>₹${sal.pf.toLocaleString('en-IN')}</td></tr>
  <tr><td>House Rent Allowance</td><td>₹${sal.hra.toLocaleString('en-IN')}</td><td>Income Tax</td><td>₹${sal.tax.toLocaleString('en-IN')}</td></tr>
  <tr><td>Bonus</td><td>₹${sal.bonus.toLocaleString('en-IN')}</td><td>Other Deductions</td><td>₹${sal.other_deductions.toLocaleString('en-IN')}</td></tr>
  <tr><td>Transport Allowance</td><td>₹${sal.transport.toLocaleString('en-IN')}</td>${absentDed?`<td>Absent Deduction</td><td>₹${absentDed.toLocaleString('en-IN')}</td>`:'<td></td><td></td>'}</tr>
  <tr><td>Medical Allowance</td><td>₹${sal.medical.toLocaleString('en-IN')}</td><td></td><td></td></tr>
  <tr style="font-weight:700;background:#f0fdf4"><td>Gross Earnings</td><td>₹${gross.toLocaleString('en-IN')}</td><td>Total Deductions</td><td>₹${(totalDed+absentDed).toLocaleString('en-IN')}</td></tr>
</table>
<table><tr class="net-row"><td colspan="3" style="padding:14px;background:#ede9fe;border-radius:8px">NET SALARY PAYABLE</td><td style="padding:14px;background:#ede9fe;font-size:18px">₹${net.toLocaleString('en-IN')}</td></tr></table>
<div class="sign"><span>Employee Signature: ________________</span><span>HR Manager Signature: ________________</span><span>Generated: ${new Date().toLocaleDateString('en-IN')}</span></div>
<div class="footer">This is a computer-generated salary slip. AcmeCorp Pvt. Ltd. | hr@acmecorp.com | CIN: U12345MH2015PTC123456</div>
</body></html>`;
};

const downloadSlip = (employee, sal, att, monthKey) => {
  const html = generateSalarySlipHTML(employee, sal, att, monthKey);
  
  // Create a temporary container for the HTML string so html2pdf can parse it better
  const element = document.createElement('div');
  element.innerHTML = html;

  // We only need the body content since html2pdf processes the DOM
  const opt = {
    margin:       10,
    filename:     `SalarySlip_${employee.name.replace(' ','_')}_${monthKey}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  import('html2pdf.js').then((html2pdf) => {
    html2pdf.default().set(opt).from(element).save();
  });
};

// ─── EMPLOYEE DASHBOARD ───────────────────────────────────────────────────────
const EmployeeDashboard = ({user, employees, salaryStructures, attendance, leaves, leaveRequests, setLeaveRequests, setLeaves, dailyPunches, setDailyPunches}) => {
  const [tab, setTab] = useState(() => localStorage.getItem('hrms_tab_emp') || 'overview');
  useEffect(() => { localStorage.setItem('hrms_tab_emp', tab); }, [tab]);
  const [leaveForm, setLeaveForm] = useState({type:'annual',from:'',to:'',reason:''});
  const [leaveMsg, setLeaveMsg] = useState('');
  const monthKey = getCurrentMonthKey();
  const sal = salaryStructures[user.id];
  const att = attendance[user.id]||{};
  const lv = leaves[user.id]||{};
  const myLeaves = leaveRequests.filter(r=>r.empId===user.id);
  const net = calcNetSalary(sal, att[monthKey] ? att : null, monthKey);
  const prevMonthDate = new Date(); prevMonthDate.setMonth(prevMonthDate.getMonth()-1);
  const prevKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth()+1).padStart(2,'0')}`;
  const prevNet = calcNetSalary(sal, att[prevKey]?att:null, prevKey);

  const submitLeave = () => {
    if (!leaveForm.from||!leaveForm.to||!leaveForm.reason) { setLeaveMsg('Please fill all fields'); return; }
    const days = Math.ceil((new Date(leaveForm.to)-new Date(leaveForm.from))/(1000*60*60*24))+1;
    const avail = (lv[leaveForm.type]||0) - (lv[`used_${leaveForm.type}`]||0);
    if (days > avail) { setLeaveMsg(`Insufficient ${leaveForm.type} leave balance (${avail} days available)`); return; }
    const newReq = { id:`LR${Date.now()}`, empId:user.id, ...leaveForm, days, status:'pending', appliedOn:new Date().toISOString().split('T')[0] };
    setLeaveRequests(prev=>[...prev, newReq]);
    setLeaveMsg(`Leave request submitted for ${days} day(s)!`);
    setLeaveForm({type:'annual',from:'',to:'',reason:''});
  };

  const months3 = [0,1,2].map(i=>{ const d=new Date(); d.setMonth(d.getMonth()-i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }).reverse();

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Tabs active={tab} onChange={setTab} tabs={[
        {id:'overview',label:'Overview',icon:'📊'},{id:'salary',label:'Salary Slips',icon:'💰'},
        {id:'attendance',label:'Attendance',icon:'📅'},{id:'leaves',label:'Leaves',icon:'🌴'},
        {id:'ai',label:'AI Assistant',icon:'🤖'}
      ]}/>

      {tab==='overview' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
            <StatCard label="Net Salary (This Month)" value={fmtCurrency(net)} icon="💸" color="#4f46e5" sub={`prev: ${fmtCurrency(prevNet)}`}/>
            <StatCard label="Leave Balance" value={`${(lv.annual||0)-(lv.used_annual||0)} days`} icon="🌴" color="#10b981" sub="Annual leaves"/>
            <StatCard label="Days Present" value={att[monthKey]?.present||0} icon="✅" color="#0891b2" sub={`Absent: ${att[monthKey]?.absent||0}`}/>
            <StatCard label="Department" value={user.department} icon="🏢" color="#d97706" sub={user.designation}/>
          </div>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15,color:'#374151'}}>3-Month Salary Trend</h4>
            <div style={{display:'flex',gap:8,alignItems:'flex-end',height:120}}>
              {months3.map(mk=>{
                const n=calcNetSalary(sal,att[mk]?att:null,mk);
                const maxN=months3.reduce((m,k)=>Math.max(m,calcNetSalary(sal,att[k]?att:null,k)),1);
                const h=Math.max(20,Math.round((n/maxN)*100));
                return (
                  <div key={mk} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <div style={{fontSize:11,color:'#6b7280',fontWeight:600}}>{fmtCurrency(n)}</div>
                    <div style={{width:'100%',height:h,background:'linear-gradient(to top,#4f46e5,#7c3aed)',borderRadius:'6px 6px 0 0'}}/>
                    <div style={{fontSize:11,color:'#9ca3af'}}>{getMonthLabel(mk).split(' ')[0].slice(0,3)}</div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <h4 style={{margin:'0 0 12px',fontSize:15,color:'#374151'}}>Recent Leave Requests</h4>
            {myLeaves.slice(-3).length===0 ? <p style={{color:'#9ca3af',fontSize:14}}>No leave requests yet.</p> :
              myLeaves.slice(-3).map(r=>(
                <div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #f3f4f6'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,textTransform:'capitalize'}}>{r.type} Leave — {r.days} day{r.days>1?'s':''}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>{fmtDate(r.from)} → {fmtDate(r.to)}</div>
                  </div>
                  <Badge color={r.status==='approved'?'green':r.status==='rejected'?'red':'yellow'}>{r.status}</Badge>
                </div>
              ))}
          </Card>
        </div>
      )}

      {tab==='salary' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15,color:'#374151'}}>Salary Breakdown — {getMonthLabel(monthKey)}</h4>
            {sal ? (
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                  {[['Basic Salary','basic','#4f46e5'],['HRA','hra','#0891b2'],['Bonus','bonus','#10b981'],['Transport','transport','#d97706'],['Medical','medical','#7c3aed']].map(([l,k,c])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'#f0fdf4',borderRadius:8,borderLeft:`3px solid ${c}`}}>
                      <span style={{fontSize:13,color:'#374151'}}>{l}</span>
                      <span style={{fontSize:13,fontWeight:700,color:'#166534'}}>{fmtCurrency(sal[k])}</span>
                    </div>
                  ))}
                  {[['PF','pf','#ef4444'],['Tax','tax','#f59e0b'],['Other','other_deductions','#6b7280']].map(([l,k,c])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:'#fef2f2',borderRadius:8,borderLeft:`3px solid ${c}`}}>
                      <span style={{fontSize:13,color:'#374151'}}>{l}</span>
                      <span style={{fontSize:13,fontWeight:700,color:'#991b1b'}}>-{fmtCurrency(sal[k])}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:'#ede9fe',borderRadius:10,padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,fontSize:15,color:'#5b21b6'}}>Net Salary</span>
                  <span style={{fontWeight:800,fontSize:20,color:'#4f46e5'}}>{fmtCurrency(net)}</span>
                </div>
              </>
            ) : <p style={{color:'#9ca3af'}}>Salary structure not configured.</p>}
          </Card>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15,color:'#374151'}}>Download Salary Slips</h4>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {months3.map(mk=>(
                <div key={mk} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',border:'1px solid #e5e7eb',borderRadius:8}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{getMonthLabel(mk)}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>Net: {fmtCurrency(calcNetSalary(sal,att[mk]?att:null,mk))}</div>
                  </div>
                  <Btn onClick={()=>downloadSlip(user, sal, att[mk]||null, mk)} size="sm" color="ghost">⬇ Download</Btn>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab==='attendance' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h4 style={{margin:'0 0 4px',fontSize:16,color:'#374151'}}>Today's Attendance</h4>
                <div style={{fontSize:13,color:'#6b7280'}}>{new Date().toLocaleDateString('en-IN', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>
              </div>
              <div>
                {!dailyPunches?.[user.id]?.[new Date().toISOString().split('T')[0]]?.punchIn ? (
                  <Btn onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    setDailyPunches(prev => ({...prev, [user.id]: {...(prev[user.id]||{}), [today]: {punchIn: time}}}));
                  }} color="primary" style={{background:'#10b981',borderColor:'#10b981'}}>⏱️ Punch In Now</Btn>
                ) : !dailyPunches?.[user.id]?.[new Date().toISOString().split('T')[0]]?.punchOut ? (
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{fontSize:13,color:'#059669',fontWeight:600}}>Punched in at {dailyPunches[user.id][new Date().toISOString().split('T')[0]].punchIn}</div>
                    <Btn onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                      setDailyPunches(prev => ({...prev, [user.id]: {...prev[user.id], [today]: {...prev[user.id][today], punchOut: time}}}));
                    }} color="primary" style={{background:'#ef4444',borderColor:'#ef4444'}}>🛑 Punch Out</Btn>
                  </div>
                ) : (
                  <div style={{fontSize:13,color:'#374151',fontWeight:600}}>
                    Shift completed. (In: {dailyPunches[user.id][new Date().toISOString().split('T')[0]].punchIn} | Out: {dailyPunches[user.id][new Date().toISOString().split('T')[0]].punchOut})
                  </div>
                )}
              </div>
            </div>
          </Card>
          {months3.map(mk=>{
            const a = att[mk];
            if(!a) return null;
            const pct = Math.round((a.present/a.workingDays)*100);
            return (
              <Card key={mk}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <h4 style={{margin:0,fontSize:15,color:'#374151'}}>{getMonthLabel(mk)}</h4>
                  <Badge color={pct>=90?'green':pct>=75?'yellow':'red'}>{pct}% attendance</Badge>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                  {[['Working Days',a.workingDays,'#374151'],['Present',a.present,'#166534'],['Absent',a.absent,'#991b1b']].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:'center',padding:'12px',background:'#f9fafb',borderRadius:8}}>
                      <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:12,background:'#e5e7eb',borderRadius:99,height:8,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:pct>=90?'#10b981':pct>=75?'#f59e0b':'#ef4444',borderRadius:99}}/>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab==='leaves' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15,color:'#374151'}}>Leave Balance</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
              {[['Annual','annual','#4f46e5'],['Sick','sick','#10b981'],['Casual','casual','#f59e0b']].map(([l,k,c])=>(
                <div key={k} style={{padding:'14px',background:'#f9fafb',borderRadius:10,textAlign:'center',borderTop:`3px solid ${c}`}}>
                  <div style={{fontSize:11,color:'#9ca3af',textTransform:'uppercase',letterSpacing:0.5}}>{l}</div>
                  <div style={{fontSize:26,fontWeight:800,color:c,margin:'4px 0'}}>{(lv[k]||0)-(lv[`used_${k}`]||0)}</div>
                  <div style={{fontSize:11,color:'#6b7280'}}>of {lv[k]||0} days</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15,color:'#374151'}}>Apply for Leave</h4>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Select label="Leave Type" value={leaveForm.type} onChange={e=>setLeaveForm(p=>({...p,type:e.target.value}))}
                options={[{value:'annual',label:'Annual Leave'},{value:'sick',label:'Sick Leave'},{value:'casual',label:'Casual Leave'}]}/>
              <div/>
              <Input label="From Date" type="date" value={leaveForm.from} onChange={e=>setLeaveForm(p=>({...p,from:e.target.value}))}/>
              <Input label="To Date" type="date" value={leaveForm.to} onChange={e=>setLeaveForm(p=>({...p,to:e.target.value}))}/>
              <div style={{gridColumn:'1/-1'}}>
                <Input label="Reason" value={leaveForm.reason} onChange={e=>setLeaveForm(p=>({...p,reason:e.target.value}))} placeholder="Brief reason for leave"/>
              </div>
            </div>
            {leaveMsg && <div style={{marginTop:10,padding:'10px 14px',background:leaveMsg.includes('submitted')?'#dcfce7':'#fee2e2',borderRadius:8,fontSize:13,color:leaveMsg.includes('submitted')?'#166534':'#991b1b'}}>{leaveMsg}</div>}
            <div style={{marginTop:14}}><Btn onClick={submitLeave}>Apply Leave</Btn></div>
          </Card>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15,color:'#374151'}}>Leave History</h4>
            {myLeaves.length===0 ? <p style={{color:'#9ca3af',fontSize:14}}>No leave requests.</p> :
              myLeaves.map(r=>(
                <div key={r.id} style={{padding:'12px 0',borderBottom:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,textTransform:'capitalize'}}>{r.type} Leave — {r.days} day{r.days>1?'s':''}</div>
                    <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{fmtDate(r.from)} → {fmtDate(r.to)}</div>
                    <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{r.reason}</div>
                  </div>
                  <Badge color={r.status==='approved'?'green':r.status==='rejected'?'red':'yellow'}>{r.status}</Badge>
                </div>
              ))}
          </Card>
        </div>
      )}

      {tab==='ai' && (
        <Card style={{padding:0,overflow:'hidden',height:520}}>
          <AIChatbot user={user} employees={employees} salaryStructures={salaryStructures} attendance={attendance} leaves={leaves} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} setLeaves={setLeaves} dailyPunches={dailyPunches} setDailyPunches={setDailyPunches}/>
        </Card>
      )}
    </div>
  );
};

// ─── HR DASHBOARD ─────────────────────────────────────────────────────────────
const HRDashboard = ({user,employees,setEmployees,salaryStructures,setSalaryStructures,attendance,leaves,leaveRequests,setLeaveRequests,setLeaves}) => {
  const [tab, setTab] = useState(() => localStorage.getItem('hrms_tab_hr') || 'employees');
  useEffect(() => { localStorage.setItem('hrms_tab_hr', tab); }, [tab]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [search, setSearch] = useState('');
  const [empForm, setEmpForm] = useState({name:'',email:'',department:'',designation:'',phone:'',joinDate:'',password:''});

  const empList = employees.filter(e=>e.role==='employee');
  const filtered = empList.filter(e=>e.name.toLowerCase().includes(search.toLowerCase())||e.department.toLowerCase().includes(search.toLowerCase())||e.id.toLowerCase().includes(search.toLowerCase()));
  const pending = leaveRequests.filter(r=>r.status==='pending');
  const departments = [...new Set(empList.map(e=>e.department))];

  const openAdd = () => { setEmpForm({name:'',email:'',department:'Engineering',designation:'',phone:'',joinDate:new Date().toISOString().split('T')[0],password:'pass123'}); setEditEmp(null); setShowAddModal(true); };
  const openEdit = (e) => { setEmpForm({...e}); setEditEmp(e); setShowAddModal(true); };

  const saveEmployee = () => {
    if (!empForm.name||!empForm.email||!empForm.department) return;
    if (editEmp) {
      setEmployees(prev=>prev.map(e=>e.id===editEmp.id?{...e,...empForm}:e));
    } else {
      const newId = `E${String(employees.length+1).padStart(3,'0')}`;
      const newEmp = {...empForm,id:newId,role:'employee',managerId:user.id};
      setEmployees(prev=>[...prev,newEmp]);
      setLeaves(prev=>({...prev,[newId]:{annual:15,sick:10,casual:7,used_annual:0,used_sick:0,used_casual:0}}));
    }
    setShowAddModal(false);
  };

  const deleteEmployee = (id) => {
    if(!window.confirm('Delete this employee?')) return;
    setEmployees(prev=>prev.filter(e=>e.id!==id));
  };

  const handleLeave = (id, action) => {
    setLeaveRequests(prev=>prev.map(r=>{
      if(r.id!==id) return r;
      if(action==='approved') {
        setLeaves(lv=>({...lv,[r.empId]:{...lv[r.empId],[`used_${r.type}`]:(lv[r.empId]?.[`used_${r.type}`]||0)+r.days}}));
      }
      return {...r,status:action};
    }));
  };

  const genSlip = (emp) => {
    const sal = salaryStructures[emp.id];
    if(!sal){alert('No salary structure configured for this employee.');return;}
    const mk = getCurrentMonthKey();
    const att = attendance[emp.id]||{};
    downloadSlip(emp, sal, att[mk]||null, mk);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Tabs active={tab} onChange={setTab} tabs={[
        {id:'employees',label:'Employees',icon:'👥'},{id:'leaves',label:'Leave Requests',icon:'🌴'},
        {id:'slips',label:'Salary Slips',icon:'📄'},{id:'ai',label:'AI Assistant',icon:'🤖'}
      ]}/>

      {tab==='employees' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
            <StatCard label="Total Employees" value={empList.length} icon="👥" color="#4f46e5"/>
            <StatCard label="Departments" value={departments.length} icon="🏢" color="#0891b2"/>
            <StatCard label="Pending Leaves" value={pending.length} icon="⏳" color="#d97706"/>
            <StatCard label="Active This Month" value={empList.length} icon="✅" color="#10b981"/>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, department, ID..." style={{flex:1,padding:'9px 14px',border:'1.5px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none'}}/>
            <Btn onClick={openAdd}>+ Add Employee</Btn>
          </div>
          <Card style={{padding:0,overflow:'hidden'}}>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#f9fafb'}}>
                  {['Employee','Department','Designation','Joined','Actions'].map(h=><th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:12,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:0.5,borderBottom:'1px solid #e5e7eb'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map(e=>(
                    <tr key={e.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <Avatar name={e.name} size={36}/>
                          <div><div style={{fontWeight:600,fontSize:14}}>{e.name}</div><div style={{fontSize:12,color:'#6b7280'}}>{e.id} · {e.email}</div></div>
                        </div>
                      </td>
                      <td style={{padding:'12px 16px',fontSize:14}}><Badge color="blue">{e.department}</Badge></td>
                      <td style={{padding:'12px 16px',fontSize:14,color:'#374151'}}>{e.designation}</td>
                      <td style={{padding:'12px 16px',fontSize:13,color:'#6b7280'}}>{fmtDate(e.joinDate)}</td>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',gap:6}}>
                          <Btn onClick={()=>openEdit(e)} size="sm" color="gray">Edit</Btn>
                          <Btn onClick={()=>genSlip(e)} size="sm" color="ghost">⬇ Slip</Btn>
                          <Btn onClick={()=>deleteEmployee(e.id)} size="sm" color="danger">Del</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab==='leaves' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',gap:10}}>
            {[['All',null],['Pending','pending'],['Approved','approved'],['Rejected','rejected']].map(([l,s])=>(
              <Badge key={l} color={s===null?'blue':s==='pending'?'yellow':s==='approved'?'green':'red'}>{l}</Badge>
            ))}
          </div>
          {leaveRequests.length===0 ? <Card><p style={{color:'#9ca3af'}}>No leave requests yet.</p></Card> :
            leaveRequests.map(r=>{
              const emp = employees.find(e=>e.id===r.empId);
              return (
                <Card key={r.id} style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                  <Avatar name={emp?.name||'?'} size={44}/>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:700,fontSize:15}}>{emp?.name}</div>
                    <div style={{fontSize:13,color:'#6b7280',textTransform:'capitalize'}}>{r.type} Leave · {r.days} day{r.days>1?'s':''} · {fmtDate(r.from)} → {fmtDate(r.to)}</div>
                    <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{r.reason}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Badge color={r.status==='approved'?'green':r.status==='rejected'?'red':'yellow'}>{r.status}</Badge>
                    {r.status==='pending' && <>
                      <Btn onClick={()=>handleLeave(r.id,'approved')} size="sm" color="success">✓ Approve</Btn>
                      <Btn onClick={()=>handleLeave(r.id,'rejected')} size="sm" color="danger">✗ Reject</Btn>
                    </>}
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      {tab==='slips' && (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15}}>Generate Salary Slips — {getMonthLabel(getCurrentMonthKey())}</h4>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {empList.map(e=>{
                const sal = salaryStructures[e.id];
                const att = attendance[e.id]||{};
                const mk = getCurrentMonthKey();
                return (
                  <div key={e.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px',border:'1px solid #e5e7eb',borderRadius:8}}>
                    <Avatar name={e.name} size={40}/>
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{e.name}</div><div style={{fontSize:12,color:'#6b7280'}}>{e.designation} · {e.department}</div></div>
                    <div style={{fontSize:14,fontWeight:700,color:'#4f46e5'}}>{sal?fmtCurrency(calcNetSalary(sal,att[mk]?att:null,mk)):'Not configured'}</div>
                    <Btn onClick={()=>genSlip(e)} size="sm" color={sal?'primary':'gray'} disabled={!sal}>⬇ Download</Btn>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab==='ai' && (
        <Card style={{padding:0,overflow:'hidden',height:520}}>
          <AIChatbot user={user} employees={employees} salaryStructures={salaryStructures} attendance={attendance} leaves={leaves} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} setLeaves={setLeaves}/>
        </Card>
      )}

      <Modal open={showAddModal} onClose={()=>setShowAddModal(false)} title={editEmp?'Edit Employee':'Add New Employee'}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Full Name" value={empForm.name} onChange={e=>setEmpForm(p=>({...p,name:e.target.value}))} required/>
          <Input label="Email" type="email" value={empForm.email} onChange={e=>setEmpForm(p=>({...p,email:e.target.value}))} required/>
          <Select label="Department" value={empForm.department} onChange={e=>setEmpForm(p=>({...p,department:e.target.value}))}
            options={['Engineering','Marketing','Sales','Finance','Human Resources','Operations'].map(d=>({value:d,label:d}))} required/>
          <Input label="Designation" value={empForm.designation} onChange={e=>setEmpForm(p=>({...p,designation:e.target.value}))} required/>
          <Input label="Phone" value={empForm.phone} onChange={e=>setEmpForm(p=>({...p,phone:e.target.value}))}/>
          <Input label="Join Date" type="date" value={empForm.joinDate} onChange={e=>setEmpForm(p=>({...p,joinDate:e.target.value}))}/>
          {!editEmp && <Input label="Password" type="password" value={empForm.password} onChange={e=>setEmpForm(p=>({...p,password:e.target.value}))}/>}
        </div>
        <div style={{marginTop:16,display:'flex',gap:10,justifyContent:'flex-end'}}>
          <Btn onClick={()=>setShowAddModal(false)} color="gray">Cancel</Btn>
          <Btn onClick={saveEmployee}>{editEmp?'Save Changes':'Add Employee'}</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ─── FINANCE DASHBOARD ────────────────────────────────────────────────────────
const FinanceDashboard = ({user,employees,salaryStructures,setSalaryStructures,attendance,leaveRequests}) => {
  const [tab, setTab] = useState(() => localStorage.getItem('hrms_tab_fin') || 'payroll');
  useEffect(() => { localStorage.setItem('hrms_tab_fin', tab); }, [tab]);
  const [selEmp, setSelEmp] = useState(null);
  const [salForm, setSalForm] = useState({});
  const [saveMsg, setSaveMsg] = useState('');
  const [aiInsights, setAiInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const empList = employees.filter(e=>e.role==='employee');
  const monthKey = getCurrentMonthKey();

  const totalGross = empList.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.basic+sal.hra+sal.bonus+sal.transport+sal.medical:0);},0);
  const totalDed = empList.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.pf+sal.tax+sal.other_deductions:0);},0);
  const totalNet = empList.reduce((s,e)=>{const sal=salaryStructures[e.id];const att=attendance[e.id]||{};return s+calcNetSalary(sal,att,monthKey);},0);
  const totalBonus = empList.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.bonus:0);},0);

  const deptData = [...new Set(empList.map(e=>e.department))].map(d=>{
    const de = empList.filter(e=>e.department===d);
    const cost = de.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.basic+sal.hra:0);},0);
    return {dept:d,count:de.length,cost};
  }).sort((a,b)=>b.cost-a.cost);
  const maxCost = Math.max(...deptData.map(d=>d.cost),1);

  const openSalaryEditor = (emp) => {
    setSelEmp(emp);
    const existing = salaryStructures[emp.id]||{basic:50000,hra:20000,bonus:5000,transport:3000,medical:2000,pf:6000,tax:5000,other_deductions:1000};
    setSalForm({...existing});
    setSaveMsg('');
  };

  const saveSalary = () => {
    const numForm = Object.fromEntries(Object.entries(salForm).map(([k,v])=>[k,Number(v)||0]));
    setSalaryStructures(prev=>({...prev,[selEmp.id]:numForm}));
    setSaveMsg('Salary structure saved!');
    setTimeout(()=>{setSelEmp(null);setSaveMsg('');},1200);
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const context = `Company payroll data: Total gross=${fmtCurrency(totalGross)}/month, Net=${fmtCurrency(totalNet)}/month, Deductions=${fmtCurrency(totalDed)}/month, Total bonus=${fmtCurrency(totalBonus)}/month. Employees: ${empList.length}. Departments: ${deptData.map(d=>`${d.dept}(${d.count} employees, ₹${Math.round(d.cost/1000)}k/month)`).join(', ')}. Employee salary data: ${empList.map(e=>{const s=salaryStructures[e.id];return s?`${e.name}(${e.department},basic=${fmtCurrency(s.basic)})`:null}).filter(Boolean).join('; ')}.`;
      const resp = await fetch(`${baseUrl}/api/ai/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemPrompt:"You are a finance AI analyst for AcmeCorp. Answer concisely in bullet points.",messages:[{role:"user",content:`Analyze this payroll data and provide 3-4 specific actionable insights including cost optimization, bonus recommendations, and trends.\n\n${context}`}]})});
      const data = await resp.json();
      setAiInsights(data.reply||'No insights available.');
    } catch { setAiInsights('Failed to load insights. Please try again.'); }
    setLoadingInsights(false);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Tabs active={tab} onChange={setTab} tabs={[
        {id:'payroll',label:'Payroll Overview',icon:'💰'},{id:'salary',label:'Salary Structures',icon:'⚙️'},
        {id:'analytics',label:'Analytics',icon:'📈'},{id:'ai',label:'AI Insights',icon:'🤖'}
      ]}/>

      {tab==='payroll' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
            <StatCard label="Gross Payroll" value={fmtCurrency(totalGross)} icon="💼" color="#4f46e5" sub="Monthly"/>
            <StatCard label="Net Payroll" value={fmtCurrency(totalNet)} icon="💸" color="#10b981" sub="After deductions"/>
            <StatCard label="Total Deductions" value={fmtCurrency(totalDed)} icon="📉" color="#ef4444" sub="PF + Tax + Others"/>
            <StatCard label="Total Bonus" value={fmtCurrency(totalBonus)} icon="🎁" color="#d97706" sub="Monthly bonus pool"/>
          </div>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15}}>Monthly Payroll Report — {getMonthLabel(monthKey)}</h4>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:'#f9fafb'}}>
                  {['Employee','Department','Basic','HRA','Bonus','Deductions','Net'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'#6b7280',fontSize:11,textTransform:'uppercase',borderBottom:'1px solid #e5e7eb'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {empList.map(e=>{
                    const s=salaryStructures[e.id]; const att=attendance[e.id]||{};
                    if(!s) return null;
                    const ded=s.pf+s.tax+s.other_deductions; const net=calcNetSalary(s,att,monthKey);
                    return <tr key={e.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:'10px 12px'}}><div style={{fontWeight:600}}>{e.name}</div></td>
                      <td style={{padding:'10px 12px'}}><Badge color="blue">{e.department}</Badge></td>
                      <td style={{padding:'10px 12px',color:'#374151'}}>{fmtCurrency(s.basic)}</td>
                      <td style={{padding:'10px 12px',color:'#374151'}}>{fmtCurrency(s.hra)}</td>
                      <td style={{padding:'10px 12px',color:'#10b981'}}>{fmtCurrency(s.bonus)}</td>
                      <td style={{padding:'10px 12px',color:'#ef4444'}}>-{fmtCurrency(ded)}</td>
                      <td style={{padding:'10px 12px',fontWeight:700,color:'#4f46e5'}}>{fmtCurrency(net)}</td>
                    </tr>;
                  })}
                </tbody>
                <tfoot><tr style={{background:'#ede9fe'}}>
                  <td colSpan={2} style={{padding:'12px',fontWeight:700}}>TOTAL</td>
                  <td style={{padding:'12px',fontWeight:700}}>{fmtCurrency(empList.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.basic:0);},0))}</td>
                  <td style={{padding:'12px',fontWeight:700}}>{fmtCurrency(empList.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.hra:0);},0))}</td>
                  <td style={{padding:'12px',fontWeight:700,color:'#10b981'}}>{fmtCurrency(totalBonus)}</td>
                  <td style={{padding:'12px',fontWeight:700,color:'#ef4444'}}>-{fmtCurrency(totalDed)}</td>
                  <td style={{padding:'12px',fontWeight:700,color:'#4f46e5',fontSize:15}}>{fmtCurrency(totalNet)}</td>
                </tr></tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab==='salary' && (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15}}>Manage Salary Structures</h4>
            {empList.map(e=>{
              const s=salaryStructures[e.id];
              return (
                <div key={e.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px',border:'1px solid #e5e7eb',borderRadius:8,marginBottom:8}}>
                  <Avatar name={e.name} size={40}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14}}>{e.name}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>{e.designation} · {e.department}</div>
                  </div>
                  {s?<div style={{fontSize:13,color:'#6b7280'}}>Basic: {fmtCurrency(s.basic)}</div>:<Badge color="red">Not Set</Badge>}
                  <Btn onClick={()=>openSalaryEditor(e)} size="sm" color="ghost">⚙️ Edit Structure</Btn>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {tab==='analytics' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <h4 style={{margin:'0 0 14px',fontSize:15}}>Department-wise Payroll Cost</h4>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {deptData.map(d=>(
                <div key={d.dept}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600}}>{d.dept} <span style={{color:'#9ca3af',fontWeight:400}}>({d.count} emp)</span></span>
                    <span style={{fontSize:13,fontWeight:700,color:'#4f46e5'}}>{fmtCurrency(d.cost)}/mo</span>
                  </div>
                  <div style={{background:'#e5e7eb',borderRadius:99,height:10,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.round((d.cost/maxCost)*100)}%`,background:'linear-gradient(to right,#4f46e5,#7c3aed)',borderRadius:99}}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Card>
              <h4 style={{margin:'0 0 12px',fontSize:14}}>Salary Distribution</h4>
              {empList.map(e=>{const s=salaryStructures[e.id];if(!s)return null;const net=calcNetSalary(s,attendance[e.id]||{},monthKey);const maxN=Math.max(...empList.map(x=>{const sx=salaryStructures[x.id];return sx?calcNetSalary(sx,attendance[x.id]||{},monthKey):0;}),1);
                return <div key={e.id} style={{marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}><span style={{fontWeight:500}}>{e.name.split(' ')[0]}</span><span style={{color:'#4f46e5',fontWeight:700}}>{fmtCurrency(net)}</span></div>
                  <div style={{background:'#e5e7eb',borderRadius:99,height:6}}><div style={{height:'100%',width:`${Math.round((net/maxN)*100)}%`,background:'#4f46e5',borderRadius:99}}/></div>
                </div>;})}
            </Card>
            <Card>
              <h4 style={{margin:'0 0 12px',fontSize:14}}>Payroll Breakdown</h4>
              {[['Basic Salaries',empList.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.basic:0);},0),'#4f46e5'],['HRA',empList.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.hra:0);},0),'#0891b2'],['Bonuses',totalBonus,'#10b981'],['Allowances',empList.reduce((s,e)=>{const sal=salaryStructures[e.id];return s+(sal?sal.transport+sal.medical:0);},0),'#d97706']].map(([l,v,c])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:10,height:10,borderRadius:'50%',background:c}}/><span style={{fontSize:13}}>{l}</span></div>
                  <span style={{fontSize:13,fontWeight:700,color:c}}>{fmtCurrency(v)}</span>
                </div>
              ))}
              <div style={{borderTop:'1px solid #e5e7eb',paddingTop:10,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:700,fontSize:14}}>Gross Total</span>
                <span style={{fontWeight:800,fontSize:14,color:'#4f46e5'}}>{fmtCurrency(totalGross)}</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab==='ai' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card style={{padding:0,overflow:'hidden',height:520}}>
            <AIChatbot user={user} employees={employees} salaryStructures={salaryStructures} attendance={attendance} leaves={{}} leaveRequests={leaveRequests}/>
          </Card>
          <Card>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <h4 style={{margin:0,fontSize:15}}>🧠 AI Payroll Insights</h4>
              <Btn onClick={fetchInsights} disabled={loadingInsights} size="sm" color="primary">{loadingInsights?'Analyzing...':'Generate Insights'}</Btn>
            </div>
            {aiInsights ? <div style={{fontSize:14,lineHeight:1.8,color:'#374151',whiteSpace:'pre-wrap'}}>{aiInsights}</div>
              : <p style={{color:'#9ca3af',fontSize:14}}>Click "Generate Insights" to get AI-powered payroll analysis and recommendations.</p>}
          </Card>
        </div>
      )}

      <Modal open={!!selEmp} onClose={()=>setSelEmp(null)} title={`Salary Structure — ${selEmp?.name}`} width={560}>
        {selEmp && (
          <>
            <div style={{background:'#f0fdf4',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#166534',fontWeight:500}}>
              Gross: {fmtCurrency(Object.entries(salForm).filter(([k])=>['basic','hra','bonus','transport','medical'].includes(k)).reduce((s,[,v])=>s+Number(v||0),0))} | 
              Deductions: {fmtCurrency(Object.entries(salForm).filter(([k])=>['pf','tax','other_deductions'].includes(k)).reduce((s,[,v])=>s+Number(v||0),0))} | 
              Net: {fmtCurrency(Object.entries(salForm).filter(([k])=>['basic','hra','bonus','transport','medical'].includes(k)).reduce((s,[,v])=>s+Number(v||0),0)-Object.entries(salForm).filter(([k])=>['pf','tax','other_deductions'].includes(k)).reduce((s,[,v])=>s+Number(v||0),0))}
            </div>
            <div style={{marginBottom:12}}><h5 style={{margin:'0 0 8px',fontSize:12,textTransform:'uppercase',color:'#9ca3af',letterSpacing:0.5}}>Earnings</h5>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[['Basic Salary','basic'],['HRA','hra'],['Bonus','bonus'],['Transport','transport'],['Medical','medical']].map(([l,k])=>(
                  <Input key={k} label={l} type="number" value={salForm[k]||''} onChange={e=>setSalForm(p=>({...p,[k]:e.target.value}))} min={0}/>
                ))}
              </div>
            </div>
            <div><h5 style={{margin:'0 0 8px',fontSize:12,textTransform:'uppercase',color:'#9ca3af',letterSpacing:0.5}}>Deductions</h5>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[['Provident Fund','pf'],['Income Tax','tax'],['Other Deductions','other_deductions']].map(([l,k])=>(
                  <Input key={k} label={l} type="number" value={salForm[k]||''} onChange={e=>setSalForm(p=>({...p,[k]:e.target.value}))} min={0}/>
                ))}
              </div>
            </div>
            {saveMsg && <div style={{marginTop:10,padding:'8px 12px',background:'#dcfce7',borderRadius:6,fontSize:13,color:'#166534'}}>{saveMsg}</div>}
            <div style={{marginTop:16,display:'flex',gap:10,justifyContent:'flex-end'}}>
              <Btn onClick={()=>setSelEmp(null)} color="gray">Cancel</Btn>
              <Btn onClick={saveSalary}>Save Structure</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function HRMSApp() {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [salaryStructures, setSalaryStructures] = useState(INITIAL_SALARY_STRUCTURES);
  const [attendance] = useState(INITIAL_ATTENDANCE);
  const [leaves, setLeaves] = useState(INITIAL_LEAVES);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [dailyPunches, setDailyPunches] = useState(() => {
    const saved = localStorage.getItem('hrms_punches');
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => { localStorage.setItem('hrms_punches', JSON.stringify(dailyPunches)); }, [dailyPunches]);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('hrms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginForm, setLoginForm] = useState({email:'',password:''});
  const [loginError, setLoginError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const handleLogin = () => {
    const user = employees.find(e=>e.email===loginForm.email&&e.password===loginForm.password);
    if (user) { 
      setCurrentUser(user); 
      localStorage.setItem('hrms_user', JSON.stringify(user));
      setLoginError(''); 
    }
    else setLoginError('Invalid email or password. Please try again.');
  };




  if (!currentUser) {
    return (
      <div style={{minHeight:'100vh',background:'radial-gradient(circle at 20% 10%, #6366f1 0%, #312e81 35%, #0f172a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:'Inter,system-ui,sans-serif'}}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        <div style={{width:'100%',maxWidth:460}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{width:68,height:68,background:'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.08))',borderRadius:20,margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,boxShadow:'0 10px 28px rgba(30,41,59,0.35)'}}>🏢</div>
            <h1 style={{color:'#fff',fontSize:30,fontWeight:900,margin:0,letterSpacing:-0.4}}>AcmeCorp HRMS</h1>
            <p style={{color:'rgba(255,255,255,0.75)',margin:'10px 0 0',fontSize:14}}>Human Resource Management System</p>
          </div>
          <div style={{background:'rgba(255,255,255,0.09)',backdropFilter:'blur(22px)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:24,padding:34,boxShadow:'0 28px 50px rgba(2,6,23,0.45)'}}>
            <h2 style={{color:'#fff',margin:'0 0 24px',fontSize:20,fontWeight:700}}>Sign In</h2>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:13,color:'rgba(255,255,255,0.7)',display:'block',marginBottom:6}}>Email Address</label>
                <input type="email" value={loginForm.email} onChange={e=>setLoginForm(p=>({...p,email:e.target.value}))}
                  onKeyDown={e=>{if(e.key==='Enter')handleLogin();}} placeholder="your@email.com"
                  style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:12,color:'#fff',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:13,color:'rgba(255,255,255,0.7)',display:'block',marginBottom:6}}>Password</label>
                <input type="password" value={loginForm.password} onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))}
                  onKeyDown={e=>{if(e.key==='Enter')handleLogin();}} placeholder="••••••••"
                  style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:12,color:'#fff',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
              </div>
              {loginError && <div style={{padding:'10px 14px',background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.4)',borderRadius:8,color:'#fca5a5',fontSize:13}}>{loginError}</div>}
              <button onClick={handleLogin} style={{padding:'13px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:12,color:'#fff',fontWeight:800,fontSize:15,cursor:'pointer',marginTop:4,boxShadow:'0 10px 24px rgba(99,102,241,0.38)'}}>Sign In →</button>
            </div>
            <div style={{marginTop:20,borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:16}}>
              <p style={{color:'rgba(255,255,255,0.5)',fontSize:12,margin:'0 0 8px',textTransform:'uppercase',letterSpacing:0.5}}>Demo Credentials</p>
              {[['👤 Employee','priya@acmecorp.com','pass123','employee'],['🎯 HR Manager','hr@acmecorp.com','hr123','hr'],['💰 Finance','finance@acmecorp.com','fin123','finance']].map(([label,email,pwd,role])=>(
                <button key={role} onClick={()=>setLoginForm({email,password:pwd})} style={{display:'block',width:'100%',padding:'9px 12px',marginBottom:6,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.16)',borderRadius:10,color:'rgba(255,255,255,0.88)',fontSize:12,cursor:'pointer',textAlign:'left'}}>
                  {label} — {email}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#f8faff 0%,#f3f6fb 100%)',fontFamily:'Inter,system-ui,-apple-system,sans-serif',display:'flex',flexDirection:'column'}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}*{box-sizing:border-box}`}</style>

      {/* Top Nav */}
      <div style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(8px)',borderBottom:'1px solid #e5e7eb',padding:'0 22px',height:66,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={()=>setSidebarOpen(p=>!p)} style={{background:'#eef2ff',border:'1px solid #c7d2fe',cursor:'pointer',padding:'5px 10px',fontSize:16,color:'#4338ca',borderRadius:10}}>☰</button>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,boxShadow:'0 10px 20px rgba(79,70,229,0.28)'}}>🏢</div>
            <div><span style={{fontWeight:800,fontSize:16,color:'#1f2937'}}>AcmeCorp</span><span style={{fontSize:11,color:'#9ca3af',marginLeft:8}}>HRMS</span></div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Badge color={currentUser.role==='employee'?'purple':currentUser.role==='hr'?'blue':'green'} style={{textTransform:'capitalize'}}>{currentUser.role}</Badge>
          <Avatar name={currentUser.name} size={36}/>
          <div style={{display:'none'}}><div style={{fontWeight:600,fontSize:14,color:'#1f2937'}}>{currentUser.name}</div></div>
          <button onClick={()=>{setCurrentUser(null); localStorage.removeItem('hrms_user');}} style={{padding:'7px 12px',background:'#fee2e2',color:'#991b1b',border:'1px solid #fca5a5',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:700}}>Sign Out</button>
        </div>
      </div>

      <div style={{display:'flex',flex:1}}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{width:248,background:'#ffffff',borderRight:'1px solid #e5e7eb',padding:'18px 0',display:'flex',flexDirection:'column',position:'sticky',top:66,height:'calc(100vh - 66px)',overflow:'auto'}}>
            <div style={{padding:'0 16px 16px',borderBottom:'1px solid #f3f4f6'}}>
              <Avatar name={currentUser.name} size={48}/>
              <div style={{marginTop:10}}><div style={{fontWeight:700,fontSize:14,color:'#1f2937'}}>{currentUser.name}</div><div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{currentUser.designation}</div><div style={{marginTop:6}}><Badge color={currentUser.role==='employee'?'purple':currentUser.role==='hr'?'blue':'green'}>{currentUser.role.toUpperCase()}</Badge></div></div>
            </div>
            <div style={{padding:'16px',flex:1}}>
              <div style={{fontSize:10,textTransform:'uppercase',color:'#9ca3af',letterSpacing:0.5,fontWeight:700,marginBottom:8}}>{roleLabel[currentUser.role]}</div>
              {[
                ...(currentUser.role==='employee'?[['📊','Dashboard'],['💰','Salary Slips'],['📅','Attendance'],['🌴','Leaves'],['🤖','AI Assistant']]:
                currentUser.role==='hr'?[['👥','Employees'],['🌴','Leave Requests'],['📄','Salary Slips'],['📢','Hiring'],['🤖','AI Assistant']]:
                [['💰','Payroll Overview'],['⚙️','Salary Structures'],['📈','Analytics'],['🤖','AI Insights']])
              ].map(([icon,label])=>(
                <div key={label} onClick={()=>setActiveTab(label)} style={{
                  padding:'10px 12px',borderRadius:10,display:'flex',alignItems:'center',gap:8,cursor:'pointer',
                  color: activeTab === label ? '#4f46e5' : '#374151',
                  background: activeTab === label ? '#eef2ff' : '#f8faff',
                  border: activeTab === label ? '1px solid #c7d2fe' : '1px solid #eef2ff',
                  fontSize:13,fontWeight:600,marginBottom:4
                }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
            <div style={{padding:'12px 16px',borderTop:'1px solid #f3f4f6',fontSize:12,color:'#9ca3af'}}>
              <div>{currentUser.id} · {currentUser.department}</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{flex:1,padding:'22px',overflow:'auto',maxWidth:'100%'}}>
          <div style={{marginBottom:16}}>
            <h2 style={{margin:0,fontSize:26,fontWeight:900,color:'#111827',letterSpacing:-0.5}}>{roleLabel[currentUser.role]}</h2>
            <p style={{margin:'6px 0 0',fontSize:13,color:'#6b7280'}}>Welcome back, {currentUser.name.split(' ')[0]}! — {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          {activeTab === 'Dashboard' && currentUser.role==='employee' && (
            <EmployeeDashboard user={currentUser} employees={employees} salaryStructures={salaryStructures} attendance={attendance} leaves={leaves} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} setLeaves={setLeaves} dailyPunches={dailyPunches} setDailyPunches={setDailyPunches}/>
          )}
          {activeTab === 'Dashboard' && currentUser.role==='hr' && (
            <HRDashboard user={currentUser} employees={employees} setEmployees={setEmployees} salaryStructures={salaryStructures} setSalaryStructures={setSalaryStructures} attendance={attendance} leaves={leaves} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} setLeaves={setLeaves}/>
          )}
          {activeTab === 'Dashboard' && currentUser.role==='finance' && (
            <FinanceDashboard user={currentUser} employees={employees} salaryStructures={salaryStructures} setSalaryStructures={setSalaryStructures} attendance={attendance} leaveRequests={leaveRequests}/>
          )}
          {(activeTab === 'Analytics' || activeTab === 'Payroll Overview' || activeTab === 'Analytics') && (
            <AnalyticsDashboard employees={employees} salaryStructures={salaryStructures} />
          )}
          {activeTab === 'AI Assistant' && (
             <div style={{background:'#fff',borderRadius:16,padding:24,border:'1px solid #e5e7eb',boxShadow:'0 10px 15px rgba(0,0,0,0.05)',height:'calc(100vh - 180px)'}}>
                <AIChatbot user={currentUser} employees={employees} salaryStructures={salaryStructures} attendance={attendance} leaves={leaves} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} setLeaves={setLeaves} dailyPunches={dailyPunches} setDailyPunches={setDailyPunches} />
             </div>
          )}
          {activeTab === 'Hiring' && (
            <RecruitmentDashboard user={currentUser} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTICS DASHBOARD ──────────────────────────────────────────────────────
const AnalyticsDashboard = ({employees, salaryStructures}) => {
  const deptData = [
    { name: 'Engineering', value: employees.filter(e=>e.department==='Engineering').length },
    { name: 'Marketing', value: employees.filter(e=>e.department==='Marketing').length },
    { name: 'Sales', value: employees.filter(e=>e.department==='Sales').length },
    { name: 'HR', value: employees.filter(e=>e.department==='HR').length },
  ];

  const salaryData = employees.map(e => ({
    name: e.name.split(' ')[0],
    salary: salaryStructures[e.id]?.basic || 0
  }));

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:20}}>
      <div style={{background:'#fff', padding:20, borderRadius:16, border:'1px solid #e5e7eb', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
        <h3 style={{marginTop:0, fontSize:16, fontWeight:700, color:'#374151', marginBottom:20}}>Department Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {deptData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:'#fff', padding:20, borderRadius:16, border:'1px solid #e5e7eb', boxShadow:'0 4px 6px rgba(0,0,0,0.05)'}}>
        <h3 style={{marginTop:0, fontSize:16, fontWeight:700, color:'#374151', marginBottom:20}}>Employee Salary Distribution (Basic)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={salaryData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Bar dataKey="salary" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{background:'linear-gradient(135deg, #4f46e5, #7c3aed)', padding:24, borderRadius:16, color:'#fff', gridColumn:'1 / -1'}}>
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
          <div style={{fontSize:24}}>🤖</div>
          <h3 style={{margin:0, fontSize:18, fontWeight:800}}>AI Smart Insights</h3>
        </div>
        <p style={{margin:0, fontSize:15, lineHeight:1.6, opacity:0.95}}>
          Based on current data, your <strong>Engineering</strong> department is the largest (40%). 
          Average salary across the organization is <strong>₹42,500</strong>. 
          <br /><br />
          🚀 <strong>Recommendation:</strong> Attrition risk is low, but we suggest a team building activity for the Sales department to improve engagement scores.
        </p>
      </div>
    </div>
  );
};

// ─── RECRUITMENT DASHBOARD ────────────────────────────────────────────────────
const RecruitmentDashboard = ({user}) => {
  const [candidates, setCandidates] = useState([
    { id: 'C001', name: 'Arjun Verma', email: 'arjun@gmail.com', role: 'Full Stack Dev', status: 'Screening', score: 85, summary: 'Strong React & Node skills.' },
    { id: 'C002', name: 'Sneha Rao', email: 'sneha@yahoo.com', role: 'UI/UX Designer', status: 'Interview', score: 92, summary: 'Excellent portfolio, Figma expert.' },
    { id: 'C003', name: 'Kabir Das', email: 'kabir@outlook.com', role: 'Product Manager', status: 'Applied', score: 65, summary: 'Good experience, but lacks technical depth.' },
  ]);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{margin:0, fontSize:18, fontWeight:800, color:'#1f2937'}}>Candidate Pipeline (AI Powered)</h3>
        <button style={{padding:'10px 18px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer'}}>+ Post New Job</button>
      </div>

      <div style={{background:'#fff', borderRadius:16, border:'1px solid #e5e7eb', overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse', textAlign:'left'}}>
          <thead style={{background:'#f8faff', borderBottom:'1px solid #e5e7eb'}}>
            <tr>
              {['Candidate', 'Role', 'AI Score', 'Status', 'Summary', 'Actions'].map(h => (
                <th key={h} style={{padding:'14px 20px', fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map(c => (
              <tr key={c.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                <td style={{padding:'16px 20px'}}>
                  <div style={{fontWeight:700, color:'#111827'}}>{c.name}</div>
                  <div style={{fontSize:12, color:'#9ca3af'}}>{c.email}</div>
                </td>
                <td style={{padding:'16px 20px', fontSize:13, color:'#4b5563'}}>{c.role}</td>
                <td style={{padding:'16px 20px'}}>
                  <div style={{width:50, height:24, background:c.score>80?'#d1fae5':'#fff7ed', color:c.score>80?'#065f46':'#9a3412', borderRadius:12, display:'flex', alignItems:'center', justifyCenter:'center', fontSize:12, fontWeight:800, padding:'0 8px'}}>
                    {c.score}%
                  </div>
                </td>
                <td style={{padding:'16px 20px'}}><Badge color={c.status==='Interview'?'green':'blue'}>{c.status}</Badge></td>
                <td style={{padding:'16px 20px', fontSize:12, color:'#6b7280', maxWidth:200}}>{c.summary}</td>
                <td style={{padding:'16px 20px'}}>
                  <button style={{padding:'6px 10px', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:8, color:'#4338ca', fontSize:11, fontWeight:700, cursor:'pointer'}}>View Profile</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
