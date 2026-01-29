// ==========================================
// 1. FIREBASE CONFIGURATION (LIVE)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyC4AAR_D8eN3gr99ESB4R6mrN1fBdYI_e0",
  authDomain: "universityelection26.firebaseapp.com",
  projectId: "universityelection26",
  storageBucket: "universityelection26.firebasestorage.app",
  messagingSenderId: "965302518887",
  appId: "1:965302518887:web:eeac7b3dca84daa26580c2",
  measurementId: "G-SPCB3C6V9C",
  databaseURL: "https://universityelection26-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();
const DB_REF = db.ref('university_election_2026');

// ==========================================
// 2. THE VOTER LIST (34 PEOPLE)
// ==========================================
const voters = {
    'abdur rehman': '48291', 'asaad': '73915', 'muhammad bhai': '61047',
    'minhaj': '29584', 'aman': '84320', 'hasnain': '11223',
    'ghanat': '17496', 'rahim': '56038', 'zia': '92741',
    'aamish': '30865', 'aryan': '69124', 'samama': '45790',
    'abdullah': '81263', 'abdullah2': '94671', 'hashir': '23589',
    'momin': '70416', 'mareeb': '38952', 'jahanzeb': '65193',
    'bilawal': '92048', 'affan': '17864', 'faiq': '53690',
    'talha': '80427', 'ali': '26195', 'khizar': '49713',
    'uzair': '91560', 'sufyan': '37284', 'hammad': '68409',
    'ammad': '14976', 'mustafa': '75831', 'rafay': '90352',
    'shaherah': '69252', 'altamash': '77738', 'waseem': '42461',
    'adeer': '64000'
};

const CANDIDATE_NAMES = { 'A': 'GHANAT', 'B': 'RAHIM', 'C': 'BILAWAL', 'D': 'ABDULLAH' };
const KEYS = ['A', 'B', 'C', 'D'];
const ADMIN = { u: 'syed muhammad moosa rizvi', p: '3316' };

// Global State
let votes = { A:0, B:0, C:0, D:0 };
let records = [];
let currentUser = null;

// ==========================================
// 3. CORE SYNC LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    DB_REF.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            votes = data.votes || { A:0, B:0, C:0, D:0 };
            records = data.records || [];
        } else {
            votes = { A:0, B:0, C:0, D:0 };
            records = [];
        }
        if(document.getElementById('votingSection')) updateResults();
        if(document.getElementById('voteStatus') && currentUser) checkVoteStatus();
        if(document.getElementById('adminPanel') && sessionStorage.getItem('admOK')) {
            renderAdminStats();
            renderAdminTable();
        }
        if(document.getElementById('candPanel') && sessionStorage.getItem('candidate_session')) {
             if(typeof renderDashboard === "function") renderDashboard();
        }
    });
});

function pushToCloud() {
    DB_REF.set({ votes: votes, records: records });
}

// ==========================================
// 4. VOTER LOGIC
// ==========================================
window.userLogin = function() {
    const u = document.getElementById('username').value.trim().toLowerCase();
    const p = document.getElementById('password').value;
    if(voters[u] && voters[u] == p) {
        currentUser = u;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('votingSection').classList.add('show');
        document.getElementById('userDisplay').innerText = u.toUpperCase();
        checkVoteStatus();
    } else { alert("Invalid Login!"); }
};

window.vote = function(cand) {
    if(!currentUser) return;
    votes[cand]++;
    records.push({ id: Date.now(), voter: currentUser, candidate: cand, time: new Date().toLocaleString() });
    pushToCloud();
};

window.checkVoteStatus = function() {
    const rec = records.find(r => r.voter === currentUser);
    const btns = document.querySelectorAll('.vote-btn-card');
    const chg = document.getElementById('changeBtn');
    const msg = document.getElementById('voteStatus');
    if(rec) {
        btns.forEach(b => b.disabled = true);
        if(chg) chg.style.display = 'inline-block';
        if(msg) msg.innerHTML = `<div style="background:#d4edda; color:#155724; padding:15px; border-radius:10px; margin-bottom:20px; text-align:center;">✅ Vote Recorded for ${CANDIDATE_NAMES[rec.candidate]}</div>`;
    } else {
        btns.forEach(b => b.disabled = false);
        if(chg) chg.style.display = 'none';
        if(msg) msg.innerHTML = '';
    }
};

window.updateResults = function() {
    const total = Object.values(votes).reduce((a,b)=>a+b, 0);
    if(document.getElementById('totalDisp')) document.getElementById('totalDisp').innerText = total;
    KEYS.forEach(k => {
        const s = document.getElementById('score'+k);
        const b = document.getElementById('bar'+k);
        let p = total > 0 ? Math.round((votes[k]/total)*100) : 0;
        if(s) s.innerText = `${votes[k]} (${p}%)`;
        if(b) b.style.width = p+"%";
    });
};

window.openChangeModal = function() { document.getElementById('voterModal').style.display='flex'; }
window.closeVoterModal = function() { document.getElementById('voterModal').style.display='none'; }
window.confirmChangeVote = function() {
    const idx = records.findIndex(r => r.voter === currentUser);
    if(idx !== -1) {
        const oldC = records[idx].candidate;
        if(votes[oldC]>0) votes[oldC]--;
        records.splice(idx, 1);
        pushToCloud();
    }
    closeVoterModal();
};

window.userLogout = function() { location.reload(); }

// ==========================================
// 5. ADMIN LOGIC
// ==========================================
window.adminLogin = function() {
    const u = document.getElementById('admUser').value.trim().toLowerCase();
    const p = document.getElementById('admPass').value;
    if(u===ADMIN.u && p===ADMIN.p) {
        sessionStorage.setItem('admOK', 'true');
        showAdmin();
    } else alert("Invalid Admin");
};

window.showAdmin = function() {
    document.getElementById('adminLoginSection').style.display='none';
    document.getElementById('adminPanel').classList.add('show');
    renderAdminStats();
    renderAdminTable();
};

window.renderAdminStats = function() {
    let t = Object.values(votes).reduce((a,b)=>a+b,0);
    document.getElementById('admTotal').innerText = t;
    KEYS.forEach(k => { document.getElementById('adm'+k).innerText = votes[k]; });
};

window.renderAdminTable = function() {
    const body = document.getElementById('admBody');
    if(!body) return;
    body.innerHTML = '';
    records.forEach((r,i) => {
        body.innerHTML += `<tr><td>${i+1}</td><td><b>${r.voter}</b></td><td>${CANDIDATE_NAMES[r.candidate]}</td><td>${r.time}</td>
        <td align="center"><button onclick="deleteVote(${r.id})" style="color:red;cursor:pointer;background:none;border:none;">❌</button></td></tr>`;
    });
};

window.deleteVote = function(id) {
    if(!confirm("Delete this vote?")) return;
    const idx = records.findIndex(r => r.id === id);
    if(idx !== -1) {
        votes[records[idx].candidate]--;
        records.splice(idx,1);
        pushToCloud();
    }
};

window.openAdminReset = function() { document.getElementById('adminModal').style.display='flex'; };
window.closeAdminModal = function() { document.getElementById('adminModal').style.display='none'; };
window.confirmReset = function() {
    if(sessionStorage.getItem('admOK') !== 'true') return;
    votes = { A:0, B:0, C:0, D:0 };
    records = [];
    pushToCloud();
    closeAdminModal();
};