import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp, limit, arrayUnion, arrayRemove, deleteField
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import {
  getDatabase, ref, onValue, onChildAdded, onChildChanged, push, update as rtdbUpdate,
  set, onDisconnect, serverTimestamp as dbServerTimestamp, off, remove
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBuGG9WKYZHb1qbmihpJFjCBsTB_VJ_LvU",
    authDomain: "qola-web.firebaseapp.com",
    databaseURL: "https://qola-web-default-rtdb.firebaseio.com",
    projectId: "qola-web",
    storageBucket: "qola-web.firebasestorage.app",
    messagingSenderId: "477682993077",
    appId: "1:477682993077:web:7dce15eb2c365729173bfc"
};
const IMGBB_API_KEY = "e6c2724ff8344c073410da4876c3d35f";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const rtdb = getDatabase(app);

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastCloseBtn = document.getElementById('toast-close-btn');
const messageContextMenu = document.getElementById('message-context-menu');
const replyPreviewContainer = document.getElementById('reply-preview-container');
const replyPreviewSender = document.getElementById('reply-preview-sender');
const replyPreviewText = document.getElementById('reply-preview-text');
const cancelReplyBtn = document.getElementById('cancel-reply-btn');
const appRoot = document.getElementById('app');
const globalSearch = document.getElementById('global-search');
const searchDropdown = document.getElementById('search-dropdown');
const openFriendReqBtn = document.getElementById('open-friend-req-btn');
const friendReqModal = document.getElementById('friend-request-modal');
const friendReqList = document.getElementById('friend-request-list');
const closeFriendReqModal = document.getElementById('close-friend-req-modal');
const createGroupBtn = document.getElementById('create-group-btn');
const createGroupModal = document.getElementById('create-group-modal');
const closeGroupModalBtn = document.getElementById('close-group-modal-btn');
const groupNameInput = document.getElementById('group-name-input');
const groupMembersChecklist = document.getElementById('group-members-checklist');
const confirmCreateGroupBtn = document.getElementById('confirm-create-group-btn');
const friendList = document.getElementById('friend-list');
const groupList = document.getElementById('group-list');
const suggestionList = document.getElementById('suggestion-list');
const sidebarAvatar = document.getElementById('sidebar-avatar');
const openSettings = document.getElementById('open-settings');
const settingsMenu = document.getElementById('settings-menu');
const themeSwitch  = document.getElementById('theme-switch');
const goLogin = document.getElementById('go-login');
const currentChatFriendName = document.getElementById('current-chat-friend-name');
const messagesContainer = document.getElementById('messages-container');
const typingIndicator = document.getElementById('typing-indicator');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const cancelPreviewBtn = document.getElementById('cancel-preview-btn');
const chatInfoPanel = document.getElementById('chat-info-panel');
const openInfoBtn = document.getElementById('open-info-btn');
const groupInfoBtn = document.getElementById('group-info-btn');
const closeInfoBtn = document.getElementById('close-info-btn');
const friendInfoContent = document.getElementById('friend-info-content');
const friendAvatar = document.getElementById('chat-friend-avatar');
const friendName = document.getElementById('chat-friend-name');
const sentImagesGrid = document.getElementById('sent-images-grid');
const blockUserBtn = document.getElementById('block-user-btn');
const removeFriendBtn = document.getElementById('remove-friend-btn');
const groupInfoContent = document.getElementById('group-info-content');
const groupAvatar = document.getElementById('group-avatar');
const groupNameDisplay = document.getElementById('group-name-display');
const groupMembersList = document.getElementById('group-members-list');
const groupSentImagesGrid = document.getElementById('group-sent-images-grid');
const leaveGroupBtn = document.getElementById('leave-group-btn');

let currentUser = null;
let currentFriends = [];
let currentChatId = null;
let currentChatType = null;
let currentFriendUid = null;
let typingTimer;
let typingUnsub = null;
let msgsUnsub = null;
let selectedImageFile = null;
let replyingTo = null;

/* ===== Auth & Core Listeners ===== */
onAuthStateChanged(auth, async (user)=>{
  if(!user){ window.location.href='login.html'; return; }
  currentUser = user;
  appRoot.style.display='flex';
  await ensureUserDoc();
  setupPresence(user.uid);
  wireProfile();
  loadFriends();
  loadGroups();
  loadSuggestions();
  attachGlobalSearch();
  attachEventListeners();
});

function attachEventListeners() {
    closeInfoBtn.onclick = () => chatInfoPanel.classList.remove('open');
    openFriendReqBtn.onclick = ()=>{
      friendReqModal.style.display = 'flex';
      loadFriendRequests();
    };
    closeFriendReqModal.onclick = ()=>{
      friendReqModal.style.display = 'none';
    };
    createGroupBtn.onclick = openCreateGroupModal;
    closeGroupModalBtn.onclick = () => createGroupModal.style.display = 'none';
    confirmCreateGroupBtn.onclick = confirmCreateGroup;
    toastCloseBtn.onclick = () => toast.style.display = 'none';

    (function initTheme(){
        const saved = localStorage.getItem('theme') || 'dark';
        if(saved==='light') document.body.classList.add('light');
        themeSwitch.classList.toggle('on', saved==='light');
    })();
    themeSwitch.onclick = () => {
        const toLight = !document.body.classList.contains('light');
        document.body.classList.toggle('light', toLight);
        localStorage.setItem('theme', toLight ? 'light' : 'dark');
        themeSwitch.classList.toggle('on', toLight);
    };
    openSettings.onclick = (e)=> {
        e.stopPropagation();
        settingsMenu.style.display = settingsMenu.style.display==='block' ? 'none' : 'block';
    };
    goLogin.onclick = async ()=>{ await signOut(auth); window.location.href='login.html'; };
    sidebarAvatar.onclick = ()=>{
        if(!currentUser) return;
        window.open(`profile.html?id=${encodeURIComponent(currentUser.uid)}`,'_blank');
    };

    sendBtn.onclick = sendMessage;
    messageInput.addEventListener('keypress', e=>{ if(e.key==='Enter') sendMessage(); });
    messageInput.addEventListener('input', ()=>{
        if(!currentChatId) return;
        const tRef = ref(rtdb, `/typing/${currentChatId}/${currentUser.uid}`);
        set(tRef,true); clearTimeout(typingTimer);
        typingTimer = setTimeout(()=> set(tRef,false), 2000);
    });
    imageInput.onchange = (e)=>{
        const f=e.target.files?.[0]; if(!f) return;
        selectedImageFile=f;
        const reader=new FileReader();
        reader.onload = ev=>{
            imagePreview.src = ev.target.result;
            imagePreviewContainer.style.display='block';
            messageInput.placeholder='Thêm chú thích...';
        };
        reader.readAsDataURL(f);
    };
    cancelPreviewBtn.onclick = cancelImagePreview;
    cancelReplyBtn.onclick = cancelReply;
    document.addEventListener('click',(e)=>{
        if(!settingsMenu.contains(e.target) && e.target!==openSettings) settingsMenu.style.display='none';
        if (!messageContextMenu.contains(e.target)) messageContextMenu.style.display = 'none';
    });
    messagesContainer.addEventListener('contextmenu', showMessageContextMenu);
    messagesContainer.addEventListener('mouseover', e => {
        const msgWrapper = e.target.closest('.msg-wrapper');
        if (msgWrapper) {
            let picker = msgWrapper.querySelector('.reaction-picker');
            if (!picker) {
                picker = createReactionPicker(msgWrapper.dataset.key);
                msgWrapper.appendChild(picker);
            }
        }
    });
}

// ===== CUSTOM TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.style.display = 'block';
}

/* ===== Create Group ===== */
async function openCreateGroupModal() {
    groupMembersChecklist.innerHTML = 'Đang tải bạn bè...';
    createGroupModal.style.display = 'flex';
    const meDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const friendUids = meDoc.data()?.friends || [];
    groupMembersChecklist.innerHTML = '';
    if (friendUids.length === 0) {
        groupMembersChecklist.innerHTML = '<p>Bạn chưa có bạn bè để mời.</p>';
        return;
    }
    for (const friendUid of friendUids) {
        const friendDoc = await getDoc(doc(db, 'users', friendUid));
        if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            const displayName = friendData.displayName || friendData.email;
            const div = document.createElement('div');
            div.innerHTML = `<label><input type="checkbox" class="group-member-checkbox" value="${friendUid}"> ${displayName}</label>`;
            groupMembersChecklist.appendChild(div);
        }
    }
}
async function confirmCreateGroup() {
    const groupName = groupNameInput.value.trim();
    if (!groupName) return showToast('Vui lòng nhập tên nhóm.');
    const memberCheckboxes = document.querySelectorAll('.group-member-checkbox:checked');
    const invitedUids = Array.from(memberCheckboxes).map(cb => cb.value);
    const memberUids = [currentUser.uid, ...invitedUids];
    const roles = { [currentUser.uid]: 'admin' };
    invitedUids.forEach(uid => roles[uid] = 'member');
    if (memberUids.length < 2) return showToast('Nhóm phải có ít nhất 2 người.');
    try {
        await addDoc(collection(db, 'groups'), {
            groupName, member_uids: memberUids, roles,
            createdBy: currentUser.uid, createdAt: serverTimestamp()
        });
        showToast(`Đã tạo nhóm "${groupName}"!`, 'success');
        createGroupModal.style.display = 'none';
        groupNameInput.value = '';
    } catch (error) { console.error("Lỗi khi tạo nhóm:", error); showToast("Không thể tạo nhóm."); }
}

/* ===== Data Loading & Presence ===== */
function setupPresence(uid){
  const statusRef = ref(rtdb, `/status/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');
  onValue(connectedRef,(snap)=>{
    if(snap.val()===false) return;
    onDisconnect(statusRef).set({ isOnline:false, last_seen: dbServerTimestamp() })
      .then(()=> set(statusRef, { isOnline:true, last_seen: dbServerTimestamp() }));
  });
}
function wireProfile(){
  onSnapshot(doc(db,'users',currentUser.uid),(ds)=>{
    const d=ds.data()||{};
    sidebarAvatar.src = d.avatarUrl || `https://placehold.co/42x42/111/fff?text=${(d.email||'?')[0].toUpperCase()}`;
    currentFriends = d.friends || [];
  });
}
function loadFriends(){
  onSnapshot(doc(db,'users',currentUser.uid), async (meDoc)=>{
    friendList.innerHTML='';
    const fids = meDoc.data()?.friends || [];
    currentFriends = fids;
    for(const uid of fids){
      const d = await getDoc(doc(db,'users',uid));
      if(!d.exists()) continue;
      const u = d.data();
      const li=document.createElement('li');
      li.className='item clickable';
      li.innerHTML = `
        <div class="item-left">
          <div class="status" id="st-${uid}"></div>
          <div class="item-name">${u.displayName || u.email}</div>
        </div>`;
      li.onclick = () => startDirectChat(u);
      friendList.appendChild(li);
      onValue(ref(rtdb,`/status/${uid}`),(s)=>{
        const el=document.getElementById(`st-${uid}`); if(!el) return;
        el.classList.toggle('online', !!s.val()?.isOnline);
      });
    }
  });
}
function loadGroups(){
  const qg = query(collection(db,'groups'), where('member_uids','array-contains', currentUser.uid));
  onSnapshot(qg,(qs)=>{
    groupList.innerHTML='';
    qs.forEach((d)=>{
      const g=d.data();
      const li=document.createElement('li');
      li.className='item clickable';
      li.innerHTML=`<div class="item-left"><div class="status"></div><div class="item-name">👥 ${g.groupName} <span class="beta-tag">beta</span></div></div>`;
      li.onclick=()=> startGroupChat(d.id, g.groupName);
      groupList.appendChild(li);
    });
  });
}
async function loadSuggestions(){
  const me = await getDoc(doc(db,'users',currentUser.uid));
  const myFriends = me.exists()? (me.data().friends||[]) : [];
  const all = await getDocs(query(collection(db,'users'), limit(60)));
  const cand=[];
  all.forEach(d=>{
    const u=d.data(); if(!u?.uid || u.uid===currentUser.uid) return;
    if(myFriends.includes(u.uid)) return;
    const mutual=(u.friends||[]).filter(x=>myFriends.includes(x)).length;
    cand.push({uid:u.uid, displayName:u.displayName||u.email, email:u.email, avatarUrl:u.avatarUrl||'', mutual});
  });
  cand.sort((a,b)=>b.mutual-a.mutual);
  suggestionList.innerHTML='';
  cand.slice(0,8).forEach(s=>{
    const li=document.createElement('li'); li.className='item clickable';
    li.innerHTML=`
      <div class="item-left">
        <img class="result-avatar" src="${s.avatarUrl||'https://placehold.co/32x32/111/fff?text=U'}" />
        <div class="item-name">${s.displayName}</div>
      </div>`;
    li.onclick=()=> startDirectChat(s);
    suggestionList.appendChild(li);
  });
  if(!suggestionList.children.length) suggestionList.innerHTML=`<li class="item">Không còn gợi ý 👀</li>`;
}
function loadFriendRequests(){
  const q = query(collection(db, 'friend_requests'), where('to_uid', '==', currentUser.uid), where('status', '==', 'pending'));
  onSnapshot(q, (snap)=>{
    friendReqList.innerHTML = '';
    if(snap.empty){
      friendReqList.innerHTML = `<p style="opacity:0.7;">Không có lời mời nào.</p>`;
      return;
    }
    snap.forEach(docSnap=>{
      const req = docSnap.data();
      const item = document.createElement('div');
      item.className = 'friend-req-item';
      item.innerHTML = `<div class="friend-req-name">${req.from_email}</div><div class="friend-req-buttons"><button class="friend-req-btn accept-btn">Chấp nhận</button><button class="friend-req-btn reject-btn">Từ chối</button></div>`;
      const [acceptBtn, rejectBtn] = item.querySelectorAll('button');
      acceptBtn.onclick = ()=> handleAcceptFriend(docSnap.id, req.from_uid);
      rejectBtn.onclick = ()=> handleRejectFriend(docSnap.id);
      friendReqList.appendChild(item);
    });
  });
}

/* ===== Search ===== */
function attachGlobalSearch(){
  globalSearch.addEventListener('input', async (e)=>{
    const kw = e.target.value.trim();
    if (kw === '/cregroup') {
        openCreateGroupModal();
        globalSearch.value = '';
        searchDropdown.style.display = 'none';
        searchDropdown.innerHTML = '';
        return;
    }
    const searchTerm = kw.toLowerCase();
    if(!searchTerm){ searchDropdown.style.display='none'; searchDropdown.innerHTML=''; return; }
    
    const usersSnap = await getDocs(collection(db,'users'));
    const users=[]; usersSnap.forEach(d=>users.push(d.data()));
    const usersFiltered = users.filter(u=> (u.displayName||u.email||'').toLowerCase().includes(searchTerm) && u.uid!==currentUser.uid);
    const friendsFiltered = usersFiltered.filter(u=> currentFriends.includes(u.uid));
    const qg = query(collection(db,'groups'), where('member_uids','array-contains', currentUser.uid));
    const gs = await getDocs(qg);
    const groups=[]; gs.forEach(d=>{ const g=d.data(); if((g.groupName||'').toLowerCase().includes(searchTerm)) groups.push({id:d.id,...g}); });
    searchDropdown.innerHTML='';
    const addSection=(title,items,render)=>{
      const st=document.createElement('div'); st.className='section-title'; st.textContent=title; searchDropdown.appendChild(st);
      if(!items.length){ const em=document.createElement('div'); em.className='result-item'; em.innerHTML=`<div class="result-sub">Không có kết quả</div>`; searchDropdown.appendChild(em); return; }
      items.forEach(x=> searchDropdown.appendChild(render(x)));
    };
    addSection('Bạn bè', friendsFiltered, (u)=>{
      const el=document.createElement('div'); el.className='result-item';
      el.innerHTML=`<div class="result-left"><img class="result-avatar" src="${u.avatarUrl||'https://placehold.co/32x32/111/fff?text=U'}"/><div><div class="result-name">${u.displayName||u.email}</div><div class="result-sub">${u.email}</div></div></div>`;
      el.onclick=()=>{ startDirectChat(u); hideDropdown(); };
      return el;
    });
    addSection('Người dùng', usersFiltered, (u) => {
      const el = document.createElement('div'); el.className = 'result-item';
      const isFriend = currentFriends.includes(u.uid);
      el.innerHTML = `<div class="result-left"><img class="result-avatar" src="${u.avatarUrl || 'https://placehold.co/32x32/111/fff?text=U'}" /><div><div class="result-name">${u.displayName || u.email}</div><div class="result-sub">${u.email}</div></div></div><div class="result-action">${isFriend ? '<span class="friend-label">✔️ Bạn bè</span>' : `<button class="add-friend-btn" data-uid="${u.uid}">➕ Thêm bạn</button>`}</div>`;
      const btn = el.querySelector('.add-friend-btn');
      if (btn) {
          btn.onclick = async (e) => {
          e.stopPropagation();
          btn.disabled = true; btn.textContent = '⏳ Đang gửi...';
          try { await addDoc(collection(db, "friend_requests"), { from_uid: currentUser.uid, from_email: currentUser.email, to_uid: u.uid, status: 'pending', timestamp: serverTimestamp() }); btn.textContent = '✅ Đã gửi'; }
          catch (err) { console.error(err); btn.textContent = '❌ Lỗi'; }
          };
      }
      el.querySelector('.result-left').onclick = () => { window.open(`profile.html?id=${encodeURIComponent(u.uid)}`, '_blank'); hideDropdown(); };
      return el;
      });
    addSection('Nhóm', groups, (g)=>{
      const el=document.createElement('div'); el.className='result-item';
      el.innerHTML=`<div class="result-left"><img class="result-avatar" src="https://placehold.co/32x32/0af/fff?text=G"/><div><div class="result-name">👥 ${g.groupName}</div><div class="result-sub">${g.member_uids?.length||0} thành viên</div></div></div>`;
      el.onclick=()=>{ startGroupChat(g.id, g.groupName); hideDropdown(); };
      return el;
    });
    searchDropdown.style.display='block';
  });
  const hideDropdown=()=> searchDropdown.style.display='none';
  document.addEventListener('click',(e)=>{
    if(e.target===globalSearch || searchDropdown.contains(e.target)) return;
    hideDropdown();
  });
}

/* ===== Chat Core ===== */
function startDirectChat(friend) {
  if (!friend || !friend.uid) return;
  const uids = [currentUser.uid, friend.uid].sort();
  const chatId = uids.join('_');
  currentFriendUid = friend.uid;
  openChat({ id: chatId, name: friend.displayName || friend.email, type: 'direct' });
  history.replaceState(null, '', `?chat=${friend.uid}`);
}
function startGroupChat(groupId, groupName){
  if (!sessionStorage.getItem('groupBetaWarningShown')) {
      showToast('Tính năng Nhóm đang trong giai đoạn thử nghiệm (Beta) và có thể phát sinh lỗi. Mong cậu thông cảm!');
      sessionStorage.setItem('groupBetaWarningShown', 'true');
  }
  currentFriendUid = null;
  openChat({id:groupId, name:groupName, type:'group'});
  history.replaceState(null, '', `?chat/group=${groupId}`);
}
function openChat(chat){
  currentChatId = chat.id;
  currentChatType = chat.type;
  currentChatFriendName.textContent = chat.name;
  messageInput.disabled=false; sendBtn.disabled=false; messageInput.focus();
  messagesContainer.innerHTML='';
  typingIndicator.textContent='';

  if (chat.type === 'group') {
      openInfoBtn.style.display = 'none';
      groupInfoBtn.style.display = 'block';
      groupInfoBtn.onclick = () => { showGroupInfo(chat.id); chatInfoPanel.classList.add('open'); };
  } else {
      groupInfoBtn.style.display = 'none';
      openInfoBtn.style.display = 'block';
      openInfoBtn.onclick = () => { if (currentFriendUid) { showFriendInfo(currentFriendUid); chatInfoPanel.classList.add('open'); }};
  }

  if(msgsUnsub) msgsUnsub();
  if(typingUnsub) typingUnsub();

  const typingRef = ref(rtdb, `/typing/${chat.id}`);
  typingUnsub = onValue(typingRef,(snap)=>{
    const obj=snap.val()||{};
    const others = Object.keys(obj).filter(uid=> obj[uid] && uid!==currentUser.uid);
    typingIndicator.textContent = others.length ? 'Đang nhập…' : '';
  });

  const msgsRef = ref(rtdb, `/messages/${chat.id}`);
  const unsub1 = onChildAdded(msgsRef, (snap) => renderMessage(snap.key, snap.val(), chat));
  const unsub2 = onChildChanged(msgsRef, (snap) => renderMessage(snap.key, snap.val(), chat));
  msgsUnsub = () => {
    off(msgsRef, 'child_added', unsub1);
    off(msgsRef, 'child_changed', unsub2);
  };
}

/* ===== Message Actions ===== */
async function sendMessage(){
  const text = messageInput.value.trim();
  if(!text && !selectedImageFile && !replyingTo) return;
  if(!currentChatId) return;
  sendBtn.disabled = true;
  let imageUrl=null;
  if(selectedImageFile){
    try{ imageUrl = await uploadImage(selectedImageFile); }
    catch(e){ showToast('Upload ảnh lỗi, thử lại nha'); sendBtn.disabled=false; return; }
  }
  const msg = {
    senderId: currentUser.uid, 
    text: text || null, 
    imageUrl: imageUrl || null,
    timestamp: Date.now(), 
    readBy: { [currentUser.uid]: true },
    replyTo: replyingTo ? replyingTo.key : null,
    recalled: false,
    reactions: {}
  };
  const newRef = push(ref(rtdb, `/messages/${currentChatId}`));
  await set(newRef, msg);
  messageInput.value=''; cancelImagePreview(); cancelReply();
  clearTimeout(typingTimer);
  set(ref(rtdb, `/typing/${currentChatId}/${currentUser.uid}`), false);
  sendBtn.disabled = false;
}
function renderMessage(key, m, chatCtx){
  if (!m) {
    const elToRemove = document.querySelector(`.msg-wrapper[data-key="${key}"]`);
    if (elToRemove) elToRemove.remove();
    return;
  }
  let existingEl = document.querySelector(`.msg-wrapper[data-key="${key}"]`);
  if (!existingEl) {
      existingEl = document.createElement('div');
      existingEl.className = 'msg-wrapper';
      existingEl.dataset.key = key;
      messagesContainer.appendChild(existingEl);
  }
  const isSent = m.senderId === currentUser.uid;
  existingEl.classList.toggle('sent', isSent);
  let html = '';
  if (m.recalled) {
      html = `<div class="msg recalled-message">Tin nhắn đã được thu hồi</div>`;
  } else {
      html += `<div class="msg ${isSent ? 'sent' : ''}">`;
      if (m.replyTo) {
          const repliedMsgEl = document.querySelector(`.msg-wrapper[data-key="${m.replyTo}"] .msg`);
          if (repliedMsgEl) {
              const originalSender = repliedMsgEl.dataset.senderName || '...';
              const originalText = repliedMsgEl.querySelector('.msg-text')?.textContent || 'Ảnh';
              html += `<div class="reply-quote"><div class="sender">Trả lời ${originalSender}</div><div class="text">${originalText}</div></div>`;
          }
      }
      if(m.text) html += `<div class="msg-text">${escapeHtml(m.text)}</div>`;
      if(m.imageUrl) html += `<img src="${m.imageUrl}" alt="img"/>`;
      if(m.timestamp){
        const d=new Date(m.timestamp); const hm=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        html += `<div class="msg-meta">${hm}</div>`;
      }
      if(isSent){
        let status='Đã gửi';
        if(chatCtx.type==='direct'){
          const [a,b]=chatCtx.id.split('_'); const peer=a===currentUser.uid? b : a;
          if(m.readBy && m.readBy[peer]) status='Đã xem';
        }else{
          if(m.readBy && Object.keys(m.readBy).length > 1) status='Đã xem';
        }
        html += `<div class="msg-status">${status}</div>`;
      }
      html += `</div>`;
      if (m.reactions && Object.keys(m.reactions).length > 0) {
          const reactionsSummary = Object.values(m.reactions).reduce((acc, emoji) => { acc[emoji] = (acc[emoji] || 0) + 1; return acc; }, {});
          html += '<div class="reactions-display">';
          for (const [emoji, count] of Object.entries(reactionsSummary)) { html += `<span>${emoji} ${count}</span>`; }
          html += '</div>';
      }
  }
  existingEl.innerHTML = html;
  const msgEl = existingEl.querySelector('.msg');
  if (msgEl && !m.recalled) {
    msgEl.dataset.senderName = m.senderName || m.senderId;
  }
  if(m.senderId !== currentUser.uid && (!m.readBy || !m.readBy[currentUser.uid])){
    rtdbUpdate(ref(rtdb, `/messages/${chatCtx.id}/${key}/readBy`), { [currentUser.uid]: true });
  }
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
function showMessageContextMenu(e) {
    const wrapper = e.target.closest('.msg-wrapper');
    if (!wrapper) return;
    e.preventDefault();
    const msgKey = wrapper.dataset.key;
    const msgRef = ref(rtdb, `/messages/${currentChatId}/${msgKey}`);
    onValue(msgRef, (snap) => {
        if (!snap.exists()) return;
        const msg = snap.val();
        messageContextMenu.innerHTML = '';
        const btnReply = document.createElement('button');
        btnReply.className = 'context-menu-btn';
        btnReply.textContent = '↪️ Trả lời';
        btnReply.onclick = () => replyToMessage(msgKey, msg);
        messageContextMenu.appendChild(btnReply);
        if (msg.senderId === currentUser.uid) {
            const timeSinceSent = Date.now() - msg.timestamp;
            if (timeSinceSent < 3 * 60 * 1000 && !msg.recalled) {
                const btnRecall = document.createElement('button');
                btnRecall.className = 'context-menu-btn danger';
                btnRecall.textContent = '🗑️ Thu hồi';
                btnRecall.onclick = () => recallMessage(msgKey);
                messageContextMenu.appendChild(btnRecall);
            }
        }
        const btnDelete = document.createElement('button');
        btnDelete.className = 'context-menu-btn danger';
        btnDelete.textContent = '❌ Xóa ở phía bạn';
        btnDelete.onclick = () => deleteMessageForSelf(msgKey);
        messageContextMenu.appendChild(btnDelete);
        messageContextMenu.style.display = 'block';
        messageContextMenu.style.left = `${e.pageX}px`;
        messageContextMenu.style.top = `${e.pageY}px`;
    }, { onlyOnce: true });
}
function recallMessage(key) {
    const msgRef = ref(rtdb, `/messages/${currentChatId}/${key}`);
    rtdbUpdate(msgRef, { text: null, imageUrl: null, recalled: true, replyTo: null, reactions: {} });
}
function deleteMessageForSelf(key) {
    const el = document.querySelector(`.msg-wrapper[data-key="${key}"]`);
    if (el) el.remove();
}
function replyToMessage(key, message) {
    replyingTo = { key, message };
    replyPreviewContainer.style.display = 'block';
    replyPreviewSender.textContent = `Đang trả lời ${message.senderId === currentUser.uid ? 'chính mình' : message.senderName || '...'}`;
    replyPreviewText.textContent = message.text || 'Một hình ảnh';
    messageInput.focus();
}
function cancelReply() {
    replyingTo = null;
    replyPreviewContainer.style.display = 'none';
}

function createReactionPicker(msgKey) {
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    ['❤️', '👍', '😂', '😮', '😢', '😡'].forEach(emoji => {
        const btn = document.createElement('span');
        btn.className = 'reaction-btn';
        btn.textContent = emoji;
        btn.onclick = (e) => { e.stopPropagation(); reactToMessage(msgKey, emoji); };
        picker.appendChild(btn);
    });
    return picker;
}
async function reactToMessage(msgKey, emoji) {
    const reactionRef = ref(rtdb, `/messages/${currentChatId}/${msgKey}/reactions/${currentUser.uid}`);
    onValue(reactionRef, (snap) => {
        if (snap.exists() && snap.val() === emoji) { remove(reactionRef); } 
        else { set(reactionRef, emoji); }
    }, { onlyOnce: true });
}

/* ===== Info Panel Logic (Friend & Group) ===== */
async function showFriendInfo(friendUid) {
  groupInfoContent.style.display = 'none';
  friendInfoContent.style.display = 'block';
  const friendDoc = await getDoc(doc(db, "users", friendUid));
  if (friendDoc.exists()) {
    const d = friendDoc.data();
    friendAvatar.src = d.avatarUrl || `https://placehold.co/80x80/EFEFEF/333?text=${d.displayName?.[0] || 'U'}`;
    friendName.textContent = d.displayName || d.email;
  }
  const chatId = [currentUser.uid, friendUid].sort().join("_");
  const msgRef = ref(rtdb, `/messages/${chatId}`);
  onValue(msgRef, (snap) => {
    sentImagesGrid.innerHTML = '';
    snap.forEach((child) => {
      const msg = child.val();
      if (msg.imageUrl) {
        const img = document.createElement('img'); img.src = msg.imageUrl;
        img.onclick = () => window.open(msg.imageUrl, "_blank");
        sentImagesGrid.appendChild(img);
      }
    });
  }, { onlyOnce: true });

  blockUserBtn.onclick = async () => {
    if (!currentUser || !currentFriendUid) return showToast("⚠️ Bạn chưa chọn người để chặn!");
    if (confirm("Chặn người này? Họ sẽ không thể nhắn tin cho bạn.")) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { blocked: arrayUnion(currentFriendUid) });
        showToast("✅ Đã chặn thành công!", 'success');
      } catch (err) { console.error(err); showToast("❌ Lỗi khi chặn người này!"); }
    }
  };

  removeFriendBtn.onclick = async () => {
    if (confirm(`Bạn chắc chắn muốn xóa "${friendName.textContent}" khỏi danh sách bạn bè?`)) {
        const meRef = doc(db, 'users', currentUser.uid);
        const friendRef = doc(db, 'users', friendUid);
        try {
            await updateDoc(meRef, { friends: arrayRemove(friendUid) });
            await updateDoc(friendRef, { friends: arrayRemove(currentUser.uid) });
            showToast("Đã xóa bạn.", 'success');
            chatInfoPanel.classList.remove('open');
            currentChatFriendName.textContent = "Chọn cuộc trò chuyện";
            messagesContainer.innerHTML = '';
            messageInput.disabled = true; sendBtn.disabled = true;
        } catch(error) { console.error("Lỗi khi xóa bạn:", error); showToast("Có lỗi xảy ra khi xóa bạn."); }
    }
  };
}
async function showGroupInfo(groupId) {
    friendInfoContent.style.display = 'none';
    groupInfoContent.style.display = 'block';
    
    const groupRef = doc(db, "groups", groupId);
    onSnapshot(groupRef, async (groupDoc) => {
        if (!groupDoc.exists()) return;

        const groupData = groupDoc.data();
        const groupName = groupData.groupName;
        const roles = groupData.roles || {};
        const myRole = roles[currentUser.uid];

        groupNameDisplay.textContent = groupName;
        groupAvatar.src = `https://placehold.co/95x95/1e293b/fff?text=${groupName[0]}`;
        
        const memberUids = groupData.member_uids || [];
        groupMembersList.innerHTML = '';
        for (const uid of memberUids) {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const memberRole = roles[uid] || 'member';
                const roleLabels = { admin: 'Trưởng nhóm', moderator: 'Phó nhóm', member: 'Thành viên' };
                const roleClass = { admin: 'role-admin', moderator: 'role-moderator', member: 'role-member' };
                
                let actionButtons = '';
                if (myRole === 'admin' && uid !== currentUser.uid) {
                    actionButtons += `<button data-action="kick" data-uid="${uid}">Kick</button>`;
                    switch (memberRole) {
                        case 'member':
                            actionButtons += `<button data-action="promote-mod" data-uid="${uid}">Phong Phó nhóm</button>`;
                            break;
                        case 'moderator':
                            actionButtons += `<button data-action="demote-member" data-uid="${uid}">Giáng làm Thành viên</button>`;
                            break;
                    }
                } else if (myRole === 'moderator' && memberRole === 'member') {
                    actionButtons += `<button data-action="kick" data-uid="${uid}">Kick</button>`;
                }
                
                const li = document.createElement('li');
                li.className = 'member-item';
                li.innerHTML = `<div class="member-info"><span class="member-name">${userData.displayName || userData.email}</span><span class="member-role ${roleClass[memberRole]}">${roleLabels[memberRole]}</span></div><div class="member-actions">${actionButtons}</div>`;
                groupMembersList.appendChild(li);
            }
        }
    });

    groupMembersList.onclick = (e) => {
        if (e.target.dataset.action) {
            const action = e.target.dataset.action;
            const targetUid = e.target.dataset.uid;
            if (action === 'kick') { if (confirm('Kick thành viên này?')) kickMember(groupId, targetUid); }
            else if (action === 'promote-mod') { changeRole(groupId, targetUid, 'moderator'); }
            else if (action === 'demote-member') { changeRole(groupId, targetUid, 'member'); }
        }
    };

    groupSentImagesGrid.innerHTML = '';
    const groupMsgsRef = ref(rtdb, `/messages/${groupId}`);
    onValue(groupMsgsRef, (snap) => {
        groupSentImagesGrid.innerHTML = '';
        if (!snap.exists()) return;
        snap.forEach(childSnap => {
            const msg = childSnap.val();
            if (msg.imageUrl) {
                const img = document.createElement('img'); img.src = msg.imageUrl;
                img.onclick = () => window.open(msg.imageUrl, "_blank");
                groupSentImagesGrid.appendChild(img);
            }
        });
    }, { onlyOnce: true });

    leaveGroupBtn.onclick = async () => {
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (confirm(`Bạn có chắc muốn rời khỏi nhóm "${groupDoc.data().groupName}"?`)) {
            const groupRef = doc(db, 'groups', groupId);
            await updateDoc(groupRef, { 
                member_uids: arrayRemove(currentUser.uid),
                [`roles.${currentUser.uid}`]: deleteField()
            });
            showToast('Đã rời nhóm.', 'success');
            chatInfoPanel.classList.remove('open');
            currentChatFriendName.textContent = "Chọn cuộc trò chuyện";
            messagesContainer.innerHTML = '';
            messageInput.disabled = true; sendBtn.disabled = true;
        }
    };
}

async function kickMember(groupId, targetUid) {
    const groupRef = doc(db, 'groups', groupId);
    try {
        await updateDoc(groupRef, {
            member_uids: arrayRemove(targetUid),
            [`roles.${targetUid}`]: deleteField()
        });
        showToast('Đã kick thành viên.', 'success');
    } catch (error) { console.error("Lỗi khi kick:", error); showToast("Có lỗi xảy ra."); }
}
async function changeRole(groupId, targetUid, newRole) {
    const groupRef = doc(db, 'groups', groupId);
    try {
        await updateDoc(groupRef, { [`roles.${targetUid}`]: newRole });
        showToast(`Đã cập nhật vai trò thành ${newRole}.`, 'success');
    } catch (error) { console.error("Lỗi khi đổi vai trò:", error); showToast("Có lỗi xảy ra."); }
}

/* ===== Helpers ===== */
function cancelImagePreview(){
  selectedImageFile=null; imageInput.value=''; imagePreviewContainer.style.display='none';
  messageInput.placeholder='Nhập tin nhắn...';
}
async function uploadImage(file){
  if(!IMGBB_API_KEY) throw new Error('Thiếu API ImgBB');
  const fd=new FormData(); fd.append('image', file);
  const res=await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,{method:'POST', body:fd});
  const data=await res.json(); if(data.success) return data.data.url;
  throw new Error(data.error?.message||'Upload fail');
}
function escapeHtml(s){ return s.replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
async function ensureUserDoc(){
  const uref=doc(db,'users',currentUser.uid);
  const got=await getDoc(uref);
  if(!got.exists()){
    await setDoc(uref,{uid:currentUser.uid,email:currentUser.email,displayName:currentUser.email.split('@')[0],bio:'',avatarUrl:'',friends:[], blocked: []});
  }
}
async function handleAcceptFriend(reqId, fromUid){
  const reqRef = doc(db, 'friend_requests', reqId);
  await updateDoc(reqRef, { status: 'accepted' });
  await updateDoc(doc(db, 'users', currentUser.uid), { friends: arrayUnion(fromUid) });
  await updateDoc(doc(db, 'users', fromUid), { friends: arrayUnion(currentUser.uid) });
  showToast('✅ Đã chấp nhận lời mời kết bạn!', 'success');
}
async function handleRejectFriend(reqId){
  const reqRef = doc(db, 'friend_requests', reqId);
  await updateDoc(reqRef, { status: 'declined' });
  showToast('❌ Đã từ chối lời mời.');
}