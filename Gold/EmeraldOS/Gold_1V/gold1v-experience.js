"use strict";

/* EmeraldOS Gold 1V user experience package.
   Adds built-in games, cloud-account history and password controls, and an
   interactive calendar while preserving the shared E.L.S.U.S. Gold VM. */
(function EmeraldOSGold1VExperience(){
  if(window.__EMERALDOS_GOLD_1V_EXPERIENCE__)return;
  window.__EMERALDOS_GOLD_1V_EXPERIENCE__=true;

  const VERSION="1V",PREFIX="gold1g_";
  const ACCOUNT_KEY=PREFIX+"account_history_1v";
  const GAME_KEY=PREFIX+"game_data_1v";
  const CAL_PREF_KEY=PREFIX+"calendar_preferences_1v";
  const EVENTS_KEY=PREFIX+"events";
  const UPDATE_HISTORY_KEY=PREFIX+"update_history_1v";
  const $=id=>document.getElementById(id);
  const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const api=()=>window.Gold1V||window.Gold50||window.Gold1G;
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const now=()=>new Date().toISOString();
  const uid=(prefix="id_")=>prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1V local write failed",key,error);return false}};
  const userName=()=>localStorage.getItem("username")||localStorage.getItem(PREFIX+"username")||"GoldUser";
  const saveVM=()=>api()?.saveWorkspaceNow?.(false);
  const notify=(title,body,app="Gold 1V")=>api()?.notify?.(title,body,app);
  const openWindow=(id,title,html,options)=>api()?.openWindow?.(id,title,html,options);
  const closeWindow=win=>api()?.closeWin?.(win?.id);
  const saveText=(name,text,type="text/plain")=>api()?.saveText?.(name,text,type);

  /* ------------------------- Account history ------------------------- */
  function accountHistory(){
    const local=read(ACCOUNT_KEY,[]);
    const auth=window.GoldAuth?.accountHistory?.()||[];
    const map=new Map();
    [...auth,...(Array.isArray(local)?local:[])].forEach(item=>{if(item?.id)map.set(item.id,item)});
    const current=userName().trim().toLowerCase();
    return [...map.values()].filter(item=>!item.username||String(item.username).trim().toLowerCase()===current).sort((a,b)=>Date.parse(b.time||0)-Date.parse(a.time||0)).slice(0,300);
  }
  function saveAccountHistory(items){write(ACCOUNT_KEY,items.slice(0,300));saveVM()}
  function record(type,details={}){
    if(window.GoldAuth?.recordAccountEvent)return window.GoldAuth.recordAccountEvent(type,{username:userName(),...details});
    const item={id:uid("account_"),type,username:userName(),title:details.title||type,outcome:details.outcome||"success",details,time:now(),version:VERSION};
    saveAccountHistory([item,...accountHistory()]);return item;
  }
  function updateHistory(){const value=read(UPDATE_HISTORY_KEY,[]);return Array.isArray(value)?value:[]}
  function combinedHistory(){
    const account=accountHistory().map(item=>({...item,source:"Account",category:/login/i.test(item.type)?"Login":/password|security/i.test(item.type)?"Security":"Account"}));
    const updates=updateHistory().map(item=>({id:item.id||uid("update_"),type:item.type||"update",title:`Update ${item.type||"activity"}`,outcome:/failed/i.test(item.type||"")?"failed":"success",time:item.time||item.createdAt||now(),version:item.version||item.manifest?.latestVersion||VERSION,details:{details:item.details||"",release:item.releaseTitle||item.manifest?.releaseTitle||""},source:"E.L.S.U.S.",category:"Updates"}));
    return [...account,...updates].sort((a,b)=>Date.parse(b.time||0)-Date.parse(a.time||0)).slice(0,400);
  }
  function formatDetails(item){
    const data=item.details||{};
    return [data.reason,data.details,data.release,data.cloud===true?"Cloud account":data.cloud===false?"Local account":"",data.role].filter(Boolean).join(" · ")||item.source||"EmeraldOS Gold";
  }
  function historyRows(items,limit=40){return items.slice(0,limit).map(item=>`<tr><td>${new Date(item.time||Date.now()).toLocaleString()}</td><td>${esc(item.category||item.type||"Account")}</td><td><b>${esc(item.title||item.type||"Account event")}</b><br><small>${esc(formatDetails(item))}</small></td><td><span class="gold1v-log-status ${item.outcome==="failed"?"failed":"success"}">${esc(item.outcome||"recorded")}</span></td></tr>`).join("")}
  function summaryHTML(){
    const all=combinedHistory(),logins=all.filter(x=>x.category==="Login"),updates=all.filter(x=>x.category==="Updates"),security=all.filter(x=>x.category==="Security");
    return `<section class="card gold1v-account-summary"><h2>Account activity</h2><div class="grid3"><div><b>${logins.length}</b><span>login records</span></div><div><b>${updates.length}</b><span>update records</span></div><div><b>${security.length}</b><span>security records</span></div></div><p class="muted">History is stored with this cloud VM and contains no passwords.</p></section>`;
  }
  function settingsHistoryHTML(){
    const items=combinedHistory();
    return `<div class="gold1v-settings-history"><div class="gold1v-page-title"><div><h1>Account History</h1><p>Review successful sign-ins, failed attempts on this browser, password changes, update activity, and VM account events.</p></div><span class="gold1v-status-pill">${items.length} records</span></div><div class="actions"><button id="accountHistoryOpenApp" class="button primary">Open full history</button><button id="accountHistoryExport" class="button">Export JSON</button><button id="accountHistoryClear" class="button danger">Clear local history</button></div><div class="gold1v-history-wrap"><table><thead><tr><th>Time</th><th>Category</th><th>Activity</th><th>Status</th></tr></thead><tbody>${historyRows(items,25)||'<tr><td colspan="4">No account activity has been recorded.</td></tr>'}</tbody></table></div><p class="muted">Update entries are preserved separately by E.L.S.U.S. Clearing account history does not clear update history.</p></div>`;
  }
  function exportHistory(){saveText(`EmeraldOS-Gold-${VERSION}-Account-History.json`,JSON.stringify({product:"EmeraldOS Gold",version:VERSION,user:userName(),exportedAt:now(),history:combinedHistory()},null,2),"application/json")}
  function clearHistory(){saveAccountHistory([]);try{localStorage.setItem(ACCOUNT_KEY,"[]")}catch{}notify("Account history cleared","Local account activity was cleared. E.L.S.U.S. update history was preserved.","Accounts")}
  function openHistory(filter="All"){
    const all=combinedHistory();
    const html=`<div class="app-shell gold1v-account-history"><div class="app-toolbar"><button class="button primary" data-history-filter="All">All</button><button class="button" data-history-filter="Login">Login</button><button class="button" data-history-filter="Security">Security</button><button class="button" data-history-filter="Updates">Updates</button><button id="historyExport" class="button">Export</button><button id="historyClear" class="button danger">Clear account logs</button></div><div class="app-body"><div class="gold1v-page-title"><div><h1>Account History</h1><p>Activity for ${esc(userName())}. Passwords and password hashes are never shown.</p></div><span id="historyCount" class="gold1v-status-pill"></span></div><div class="gold1v-history-wrap"><table><thead><tr><th>Time</th><th>Category</th><th>Activity</th><th>Status</th></tr></thead><tbody id="historyBody"></tbody></table></div></div></div>`;
    const win=openWindow("accounthistory","Account History",html,{width:1040,height:680});
    let active=filter;
    const render=()=>{const items=active==="All"?all:all.filter(x=>x.category===active);win.querySelector("#historyBody").innerHTML=historyRows(items,300)||'<tr><td colspan="4">No matching history.</td></tr>';win.querySelector("#historyCount").textContent=`${items.length} records`;win.querySelectorAll("[data-history-filter]").forEach(button=>button.classList.toggle("primary",button.dataset.historyFilter===active))};
    win.querySelectorAll("[data-history-filter]").forEach(button=>button.onclick=()=>{active=button.dataset.historyFilter;render()});
    win.querySelector("#historyExport").onclick=exportHistory;
    win.querySelector("#historyClear").onclick=()=>{if(confirm("Clear local account logs? Update history will remain.")){clearHistory();openHistory(active)}};
    render();return win;
  }
  function changePassword(){
    const html=`<div class="app-shell gold1v-password"><div class="app-body"><div class="gold1v-page-title"><div><h1>Change password</h1><p>Update the password for ${esc(userName())}. The current password is required.</p></div><span class="gold1v-security-shield">Secure</span></div><form id="passwordChangeForm"><label>Current password<input id="passwordCurrent" class="field" type="password" autocomplete="current-password" required></label><label>New password<input id="passwordNew" class="field" type="password" autocomplete="new-password" minlength="8" required></label><label>Confirm new password<input id="passwordConfirm" class="field" type="password" autocomplete="new-password" minlength="8" required></label><div class="gold1v-password-meter"><span id="passwordMeter"></span></div><small id="passwordHint" class="muted">Use at least 8 characters. A longer passphrase is recommended.</small><div class="actions"><button id="passwordSubmit" class="button primary" type="submit">Change password</button><button id="passwordCancel" class="button" type="button">Cancel</button></div><p id="passwordMessage" role="status"></p></form></div></div>`;
    const win=openWindow("passwordchange","Change Password",html,{width:610,height:570});
    const form=win.querySelector("#passwordChangeForm"),current=win.querySelector("#passwordCurrent"),next=win.querySelector("#passwordNew"),confirmInput=win.querySelector("#passwordConfirm"),message=win.querySelector("#passwordMessage"),meter=win.querySelector("#passwordMeter");
    const strength=()=>{const value=next.value;let score=0;if(value.length>=8)score++;if(value.length>=12)score++;if(/[a-z]/.test(value)&&/[A-Z]/.test(value))score++;if(/\d/.test(value))score++;if(/[^\w]/.test(value))score++;meter.style.width=`${score*20}%`;meter.dataset.score=String(score)};
    next.addEventListener("input",strength);strength();
    win.querySelector("#passwordCancel").onclick=()=>closeWindow(win);
    form.onsubmit=async event=>{event.preventDefault();message.textContent="Changing password…";const button=win.querySelector("#passwordSubmit");button.disabled=true;try{if(next.value!==confirmInput.value)throw new Error("New passwords do not match.");await window.GoldAuth.changePassword(userName(),current.value,next.value);message.className="gold1v-success-message";message.textContent="Password changed successfully.";notify("Password changed","Your EmeraldOS account password was updated.","Accounts");saveVM();setTimeout(()=>closeWindow(win),900)}catch(error){window.GoldAuth?.recordAccountEvent?.("password-change",{username:userName(),title:"Password change attempt",outcome:"failed",reason:error.message});message.className="gold1v-error-message";message.textContent=error.message||"Password could not be changed.";button.disabled=false;current.focus();current.select()}};
    setTimeout(()=>current.focus(),30);return win;
  }
  window.Gold1VAccountUI={summaryHTML,settingsHistoryHTML,openHistory,changePassword,exportHistory,clearHistory,record};

  /* ------------------------- Interactive calendar ------------------------- */
  function calendarPrefs(){return {view:"month",weekStartsOn:0,showWeekends:true,...read(CAL_PREF_KEY,{})}}
  function setCalendarPrefs(next){const value={...calendarPrefs(),...next};write(CAL_PREF_KEY,value);saveVM();return value}
  function normalizeEvent(raw={}){
    const date=String(raw.date||raw.startDate||raw.start||now().slice(0,10)).slice(0,10);
    const startTime=String(raw.startTime||raw.time||"09:00");
    return {...raw,id:String(raw.id||uid("event_")),title:String(raw.title||"Untitled event"),date,startTime,time:startTime,endTime:String(raw.endTime||"10:00"),allDay:Boolean(raw.allDay),location:String(raw.location||""),description:String(raw.description||raw.notes||""),color:String(raw.color||"#0078d7"),reminder:Number(raw.reminder??15),created:raw.created||raw.createdAt||now(),updated:raw.updated||raw.updatedAt||now()};
  }
  function calendarEvents(){const items=read(EVENTS_KEY,[]);return (Array.isArray(items)?items:[]).map(normalizeEvent)}
  function saveCalendarEvents(items){write(EVENTS_KEY,items.map(normalizeEvent));saveVM()}
  function dateISO(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
  function parseDate(iso){const [y,m,d]=String(iso).split("-").map(Number);return new Date(y,m-1,d,12)}
  function eventDateTime(event){return new Date(`${event.date}T${event.allDay?"00:00":event.startTime||"09:00"}:00`)}
  function sortEvents(items){return [...items].sort((a,b)=>eventDateTime(a)-eventDateTime(b)||a.title.localeCompare(b.title))}
  let calendarState={anchor:new Date(),view:calendarPrefs().view,selected:dateISO(new Date())};
  function calendarToolbar(){return `<div class="app-toolbar gold1v-calendar-toolbar"><button id="calendarPrev" class="button">‹</button><button id="calendarToday" class="button">Today</button><button id="calendarNext" class="button">›</button><b id="calendarHeading"></b><span class="spacer"></span><div class="gold1v-segment"><button data-calendar-view="month">Month</button><button data-calendar-view="week">Week</button><button data-calendar-view="agenda">Agenda</button></div><button id="calendarExport" class="button">Export</button><button id="calendarNew" class="button primary">New event</button></div>`}
  function eventChip(event){return `<button class="gold1v-event-chip" draggable="true" data-calendar-event="${esc(event.id)}" style="--event-color:${esc(event.color)}" title="${esc(event.title)}${event.location?` · ${esc(event.location)}`:""}"><span>${event.allDay?"All day":esc(event.startTime)}</span><b>${esc(event.title)}</b></button>`}
  function monthHTML(anchor){
    const first=new Date(anchor.getFullYear(),anchor.getMonth(),1),start=new Date(first);start.setDate(1-first.getDay());const events=calendarEvents(),days=[];
    for(let index=0;index<42;index++){const date=new Date(start);date.setDate(start.getDate()+index);const iso=dateISO(date),items=sortEvents(events.filter(item=>item.date===iso));days.push(`<div class="gold1v-calendar-day ${date.getMonth()!==anchor.getMonth()?"outside":""} ${iso===dateISO(new Date())?"today":""} ${iso===calendarState.selected?"selected":""}" data-calendar-date="${iso}" tabindex="0"><div class="gold1v-day-number"><button data-calendar-new-date="${iso}">${date.getDate()}</button>${items.length>3?`<small>+${items.length-3}</small>`:""}</div><div class="gold1v-day-events">${items.slice(0,3).map(eventChip).join("")}</div></div>`)}
    return `<div class="gold1v-calendar-weekdays">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=>`<b>${day}</b>`).join("")}</div><div class="gold1v-calendar-month">${days.join("")}</div>`;
  }
  function weekHTML(anchor){
    const start=new Date(anchor);start.setDate(start.getDate()-start.getDay());const events=calendarEvents();
    return `<div class="gold1v-calendar-week">${Array.from({length:7},(_,index)=>{const date=new Date(start);date.setDate(start.getDate()+index);const iso=dateISO(date),items=sortEvents(events.filter(item=>item.date===iso));return `<section class="gold1v-week-column ${iso===dateISO(new Date())?"today":""}" data-calendar-date="${iso}"><header><b>${date.toLocaleDateString(undefined,{weekday:"short"})}</b><button data-calendar-new-date="${iso}">${date.getDate()}</button></header><div>${items.map(eventChip).join("")||'<p class="muted">No events</p>'}</div></section>`}).join("")}</div>`;
  }
  function agendaHTML(anchor){
    const start=new Date(anchor);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+90);const grouped=new Map();sortEvents(calendarEvents()).filter(event=>{const date=parseDate(event.date);return date>=start&&date<=end}).forEach(event=>{if(!grouped.has(event.date))grouped.set(event.date,[]);grouped.get(event.date).push(event)});
    return `<div class="gold1v-calendar-agenda">${[...grouped.entries()].map(([date,items])=>`<section><header><span>${parseDate(date).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</span><button data-calendar-new-date="${date}" class="button">Add</button></header>${items.map(event=>`<button class="gold1v-agenda-event" data-calendar-event="${esc(event.id)}"><span style="background:${esc(event.color)}"></span><time>${event.allDay?"All day":`${esc(event.startTime)}–${esc(event.endTime)}`}</time><div><b>${esc(event.title)}</b><small>${esc(event.location||event.description||"No details")}</small></div></button>`).join("")}</section>`).join("")||'<div class="card"><h2>No upcoming events</h2><p>Create an event to begin planning.</p></div>'}</div>`;
  }
  function calendarTitle(){const a=calendarState.anchor;if(calendarState.view==="month")return a.toLocaleDateString(undefined,{month:"long",year:"numeric"});if(calendarState.view==="week"){const start=new Date(a);start.setDate(start.getDate()-start.getDay());const end=new Date(start);end.setDate(end.getDate()+6);return `${start.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${end.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`}return "Upcoming events"}
  function openInteractiveCalendar(options={}){
    if(options instanceof Date)calendarState.anchor=new Date(options);else if(options&&typeof options==="object")calendarState={...calendarState,...options,anchor:options.anchor?new Date(options.anchor):calendarState.anchor};
    const html=`<div class="app-shell gold1v-calendar">${calendarToolbar()}<div class="app-body"><div id="calendarView"></div></div></div>`;
    const win=openWindow("calendar","Calendar",html,{width:1100,height:720});renderCalendar(win);return win;
  }
  function renderCalendar(win){
    const view=calendarState.view;win.querySelector("#calendarHeading").textContent=calendarTitle();win.querySelector("#calendarView").innerHTML=view==="month"?monthHTML(calendarState.anchor):view==="week"?weekHTML(calendarState.anchor):agendaHTML(calendarState.anchor);win.querySelectorAll("[data-calendar-view]").forEach(button=>{button.classList.toggle("active",button.dataset.calendarView===view);button.onclick=()=>{calendarState.view=button.dataset.calendarView;setCalendarPrefs({view:calendarState.view});renderCalendar(win)}});win.querySelector("#calendarPrev").onclick=()=>{const a=new Date(calendarState.anchor);if(view==="month")a.setMonth(a.getMonth()-1);else a.setDate(a.getDate()-(view==="week"?7:30));calendarState.anchor=a;renderCalendar(win)};win.querySelector("#calendarNext").onclick=()=>{const a=new Date(calendarState.anchor);if(view==="month")a.setMonth(a.getMonth()+1);else a.setDate(a.getDate()+(view==="week"?7:30));calendarState.anchor=a;renderCalendar(win)};win.querySelector("#calendarToday").onclick=()=>{calendarState.anchor=new Date();calendarState.selected=dateISO(new Date());renderCalendar(win)};win.querySelector("#calendarNew").onclick=()=>openEventEditor(null,calendarState.selected,()=>renderCalendar(win));win.querySelector("#calendarExport").onclick=exportCalendar;
    win.querySelectorAll("[data-calendar-new-date]").forEach(button=>button.onclick=event=>{event.stopPropagation();calendarState.selected=button.dataset.calendarNewDate;openEventEditor(null,calendarState.selected,()=>renderCalendar(win))});
    win.querySelectorAll("[data-calendar-event]").forEach(button=>{button.onclick=event=>{event.stopPropagation();openEventEditor(button.dataset.calendarEvent,null,()=>renderCalendar(win))};button.ondragstart=event=>event.dataTransfer.setData("text/calendar-event",button.dataset.calendarEvent)});
    win.querySelectorAll("[data-calendar-date]").forEach(day=>{day.onclick=event=>{if(event.target.closest("button"))return;calendarState.selected=day.dataset.calendarDate;renderCalendar(win)};day.ondblclick=()=>openEventEditor(null,day.dataset.calendarDate,()=>renderCalendar(win));day.ondragover=event=>{event.preventDefault();day.classList.add("drag-over")};day.ondragleave=()=>day.classList.remove("drag-over");day.ondrop=event=>{event.preventDefault();day.classList.remove("drag-over");const id=event.dataTransfer.getData("text/calendar-event"),items=calendarEvents(),item=items.find(x=>x.id===id);if(item){item.date=day.dataset.calendarDate;item.updated=now();saveCalendarEvents(items);notify("Event moved",`${item.title} moved to ${item.date}.`,"Calendar");renderCalendar(win)}}});
  }
  function openEventEditor(eventId=null,date=null,onSave=()=>{}){
    const existing=eventId?calendarEvents().find(item=>item.id===eventId):null,event=normalizeEvent(existing||{date:date||dateISO(new Date()),title:"",startTime:"09:00",endTime:"10:00"});
    const html=`<div class="app-shell gold1v-event-editor"><div class="app-body"><h1>${existing?"Edit event":"New event"}</h1><form id="calendarEventForm"><label>Title<input id="eventTitle" class="field" value="${esc(event.title)}" required autofocus></label><div class="grid2"><label>Date<input id="eventDate" class="field" type="date" value="${esc(event.date)}" required></label><label class="check-row"><input id="eventAllDay" type="checkbox" ${event.allDay?"checked":""}> All-day event</label><label>Start time<input id="eventStart" class="field" type="time" value="${esc(event.startTime)}"></label><label>End time<input id="eventEnd" class="field" type="time" value="${esc(event.endTime)}"></label><label>Location<input id="eventLocation" class="field" value="${esc(event.location)}"></label><label>Color<input id="eventColor" type="color" value="${esc(event.color)}"></label><label>Reminder<select id="eventReminder"><option value="0" ${event.reminder===0?"selected":""}>At start time</option><option value="5" ${event.reminder===5?"selected":""}>5 minutes before</option><option value="15" ${event.reminder===15?"selected":""}>15 minutes before</option><option value="30" ${event.reminder===30?"selected":""}>30 minutes before</option><option value="60" ${event.reminder===60?"selected":""}>1 hour before</option><option value="1440" ${event.reminder===1440?"selected":""}>1 day before</option></select></label></div><label>Description<textarea id="eventDescription" class="field" rows="5">${esc(event.description)}</textarea></label><div class="actions"><button class="button primary" type="submit">Save event</button>${existing?'<button id="eventDelete" class="button danger" type="button">Delete</button>':""}<button id="eventCancel" class="button" type="button">Cancel</button></div></form></div></div>`;
    const win=openWindow(existing?`calendar_event_${existing.id}`:"calendar_event_new","Calendar Event",html,{width:680,height:680,singleton:false});
    const allDay=win.querySelector("#eventAllDay"),toggle=()=>{win.querySelector("#eventStart").disabled=allDay.checked;win.querySelector("#eventEnd").disabled=allDay.checked};allDay.onchange=toggle;toggle();
    win.querySelector("#eventCancel").onclick=()=>closeWindow(win);
    win.querySelector("#eventDelete")?.addEventListener("click",()=>{if(confirm(`Delete ${event.title}?`)){saveCalendarEvents(calendarEvents().filter(item=>item.id!==event.id));record("calendar-event-delete",{title:"Calendar event deleted",event:event.title});closeWindow(win);onSave()}});
    win.querySelector("#calendarEventForm").onsubmit=submit=>{submit.preventDefault();const items=calendarEvents(),value=normalizeEvent({...event,title:win.querySelector("#eventTitle").value.trim(),date:win.querySelector("#eventDate").value,allDay:allDay.checked,startTime:win.querySelector("#eventStart").value,endTime:win.querySelector("#eventEnd").value,location:win.querySelector("#eventLocation").value.trim(),description:win.querySelector("#eventDescription").value.trim(),color:win.querySelector("#eventColor").value,reminder:Number(win.querySelector("#eventReminder").value),updated:now()});if(!value.title)return;const index=items.findIndex(item=>item.id===value.id);if(index>=0)items[index]=value;else items.push(value);saveCalendarEvents(items);notify(existing?"Event updated":"Event created",`${value.title} · ${value.date}`,"Calendar");closeWindow(win);onSave()};return win;
  }
  function exportCalendar(){
    const escapeICS=value=>String(value||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
    const format=(date,time="00:00")=>`${date.replaceAll("-","")}T${time.replace(":","")}00`;
    const body=calendarEvents().map(event=>["BEGIN:VEVENT",`UID:${event.id}@emeraldos.gold`,`DTSTAMP:${format(now().slice(0,10),now().slice(11,16))}`,event.allDay?`DTSTART;VALUE=DATE:${event.date.replaceAll("-","")}`:`DTSTART:${format(event.date,event.startTime)}`,event.allDay?"":`DTEND:${format(event.date,event.endTime)}`,`SUMMARY:${escapeICS(event.title)}`,event.location?`LOCATION:${escapeICS(event.location)}`:"",event.description?`DESCRIPTION:${escapeICS(event.description)}`:"","END:VEVENT"].filter(Boolean).join("\r\n")).join("\r\n");
    saveText(`EmeraldOS-Gold-${VERSION}-Calendar.ics`,`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Emerald Systems//EmeraldOS Gold 1V//EN\r\n${body}\r\nEND:VCALENDAR\r\n`,`text/calendar`);
  }
  function checkCalendarReminders(){
    const current=Date.now(),seen=read(PREFIX+"calendar_reminders_seen_1v",{}),today=dateISO(new Date());let changed=false;
    calendarEvents().forEach(event=>{if(event.allDay)return;const when=eventDateTime(event).getTime()-event.reminder*60000,key=`${event.id}:${event.date}:${event.startTime}`;if(current>=when&&current<=when+60000&&!seen[key]){seen[key]=now();changed=true;notify(event.title,event.location?`${event.startTime} · ${event.location}`:`Starts at ${event.startTime}`,"Calendar")}});Object.keys(seen).forEach(key=>{if(!key.includes(today)&&Date.parse(seen[key])<Date.now()-7*86400000){delete seen[key];changed=true}});if(changed)write(PREFIX+"calendar_reminders_seen_1v",seen);
  }

  /* ------------------------- Built-in games ------------------------- */
  function gameData(){return {snake:{best:0,games:0},minesweeper:{wins:0,games:0,bestTime:null},memory:{wins:0,games:0,bestMoves:null,bestTime:null},...read(GAME_KEY,{})}}
  function saveGameData(value){write(GAME_KEY,value);saveVM()}
  function updateGame(id,patch){const data=gameData();data[id]={...(data[id]||{}),...patch,lastPlayed:now()};saveGameData(data);return data[id]}
  function gameCard(id,name,desc,accent){const stats=gameData()[id]||{};return `<button class="gold1v-game-card" data-game="${id}" style="--game-accent:${accent}"><img src="app-logos/${id}.svg" alt=""><span><b>${esc(name)}</b><small>${esc(desc)}</small><em>${id==="snake"?`Best score: ${stats.best||0}`:id==="minesweeper"?`Wins: ${stats.wins||0}${stats.bestTime!=null?` · Best: ${stats.bestTime}s`:""}`:`Wins: ${stats.wins||0}${stats.bestMoves!=null?` · Best: ${stats.bestMoves} moves`:""}`}</em></span></button>`}
  function openGameCenter(){const html=`<div class="app-shell gold1v-game-center"><div class="app-body"><div class="gold1v-page-title"><div><h1>Emerald Games</h1><p>Built-in games that save scores and preferences with your Gold cloud VM.</p></div><span class="gold1v-status-pill">Game Mode ready</span></div><div class="gold1v-game-grid">${gameCard("snake","Emerald Snake","Guide the emerald, collect gems, and beat your high score.","#107c10")}${gameCard("minesweeper","Emerald Mines","Clear a classic minefield with flags and a running timer.","#d83b01")}${gameCard("memory","Memory Match","Match every pair in as few moves as possible.","#5c2d91")}</div><section class="card"><h2>Game settings</h2><p>Enable Game Mode in Settings to reduce animations while games are open. Scores are included in migration and backup data.</p><button class="button" data-open-settings="gaming">Open Gaming settings</button></section></div></div>`;const win=openWindow("games","Emerald Games",html,{width:920,height:620});win.querySelectorAll("[data-game]").forEach(button=>button.onclick=()=>api().openApp(button.dataset.game));win.querySelector("[data-open-settings]").onclick=()=>api().openSettings?.("system");return win}
  function openSnake(){
    const html=`<div class="app-shell gold1v-game"><div class="app-toolbar"><button id="snakeStart" class="button primary">Start</button><button id="snakePause" class="button">Pause</button><span>Score: <b id="snakeScore">0</b></span><span>Best: <b id="snakeBest">${gameData().snake.best||0}</b></span><span class="spacer"></span><small>Arrow keys or WASD</small></div><div class="app-body gold1v-game-stage"><canvas id="snakeCanvas" width="600" height="420" tabindex="0"></canvas><p id="snakeStatus">Press Start to play.</p></div></div>`;
    const win=openWindow("snake","Emerald Snake",html,{width:720,height:600}),canvas=win.querySelector("#snakeCanvas"),ctx=canvas.getContext("2d"),cell=20,cols=30,rows=21;let snake=[],direction={x:1,y:0},nextDirection={x:1,y:0},food={x:20,y:10},timer=null,score=0,running=false,paused=false;
    const placeFood=()=>{do{food={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows)}}while(snake.some(part=>part.x===food.x&&part.y===food.y))};
    const draw=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--panel")||"#f4f4f4";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle="rgba(128,128,128,.12)";for(let x=0;x<=cols;x++){ctx.beginPath();ctx.moveTo(x*cell,0);ctx.lineTo(x*cell,canvas.height);ctx.stroke()}for(let y=0;y<=rows;y++){ctx.beginPath();ctx.moveTo(0,y*cell);ctx.lineTo(canvas.width,y*cell);ctx.stroke()}ctx.fillStyle="#f5c400";ctx.beginPath();ctx.arc(food.x*cell+cell/2,food.y*cell+cell/2,cell*.35,0,Math.PI*2);ctx.fill();snake.forEach((part,index)=>{ctx.fillStyle=index===0?"#0b6a0b":"#107c10";ctx.fillRect(part.x*cell+2,part.y*cell+2,cell-4,cell-4)})};
    const stop=won=>{clearInterval(timer);timer=null;running=false;const previous=gameData().snake,best=Math.max(previous.best||0,score);updateGame("snake",{best,games:(previous.games||0)+1});win.querySelector("#snakeBest").textContent=String(best);win.querySelector("#snakeStatus").textContent=won?"Board completed!":"Game over. Press Start to try again."};
    const tick=()=>{if(paused)return;direction=nextDirection;const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};if(head.x<0||head.y<0||head.x>=cols||head.y>=rows||snake.some(part=>part.x===head.x&&part.y===head.y)){stop(false);return}snake.unshift(head);if(head.x===food.x&&head.y===food.y){score+=10;win.querySelector("#snakeScore").textContent=String(score);placeFood()}else snake.pop();draw()};
    const start=()=>{clearInterval(timer);snake=[{x:8,y:10},{x:7,y:10},{x:6,y:10}];direction={x:1,y:0};nextDirection={x:1,y:0};score=0;paused=false;running=true;placeFood();draw();win.querySelector("#snakeScore").textContent="0";win.querySelector("#snakeStatus").textContent="Collect the gold gems.";timer=setInterval(tick,105);canvas.focus()};
    const key=event=>{const map={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0}}[event.key];if(map&&!(map.x===-direction.x&&map.y===-direction.y)){event.preventDefault();nextDirection=map}};canvas.addEventListener("keydown",key);win.addEventListener("keydown",key);win.querySelector("#snakeStart").onclick=start;win.querySelector("#snakePause").onclick=()=>{if(!running)return;paused=!paused;win.querySelector("#snakePause").textContent=paused?"Resume":"Pause";win.querySelector("#snakeStatus").textContent=paused?"Paused":"Collect the gold gems."};draw();return win;
  }
  function openMinesweeper(){
    const html=`<div class="app-shell gold1v-game"><div class="app-toolbar"><button id="mineNew" class="button primary">New game</button><span>Mines: <b id="mineCount">10</b></span><span>Time: <b id="mineTime">0</b>s</span><span>Best: <b id="mineBest">${gameData().minesweeper.bestTime??"—"}</b></span></div><div class="app-body gold1v-game-stage"><div id="mineBoard" class="gold1v-mine-board" aria-label="Minesweeper board"></div><p id="mineStatus">Reveal every safe tile. Right-click to place a flag.</p></div></div>`;
    const win=openWindow("minesweeper","Emerald Mines",html,{width:590,height:650});const size=9,mineTotal=10;let board=[],started=false,finished=false,seconds=0,timer=null;
    const neighbours=(index)=>{const row=Math.floor(index/size),col=index%size,result=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const r=row+dr,c=col+dc;if(r>=0&&r<size&&c>=0&&c<size)result.push(r*size+c)}return result};
    const create=(safe=-1)=>{const mines=new Set();while(mines.size<mineTotal){const index=Math.floor(Math.random()*size*size);if(index!==safe&&!neighbours(safe).includes(index))mines.add(index)}board=Array.from({length:size*size},(_,index)=>({mine:mines.has(index),revealed:false,flagged:false,count:0}));board.forEach((cell,index)=>cell.count=neighbours(index).filter(i=>board[i].mine).length)};
    const render=()=>{const holder=win.querySelector("#mineBoard");holder.innerHTML=board.map((cell,index)=>`<button data-mine-cell="${index}" class="${cell.revealed?"revealed":""} ${cell.mine&&cell.revealed?"mine":""}" aria-label="Cell ${index+1}">${cell.flagged?"⚑":cell.revealed?(cell.mine?"◆":cell.count||""):""}</button>`).join("");holder.querySelectorAll("[data-mine-cell]").forEach(button=>{button.onclick=()=>reveal(Number(button.dataset.mineCell));button.oncontextmenu=event=>{event.preventDefault();flag(Number(button.dataset.mineCell))}});win.querySelector("#mineCount").textContent=String(mineTotal-board.filter(cell=>cell.flagged).length)};
    const startTimer=()=>{if(timer)return;timer=setInterval(()=>{seconds++;win.querySelector("#mineTime").textContent=String(seconds)},1000)};
    const reveal=index=>{if(finished||board[index]?.flagged)return;if(!started){create(index);started=true;startTimer()}const cell=board[index];if(cell.revealed)return;cell.revealed=true;if(cell.mine){finished=true;board.forEach(item=>{if(item.mine)item.revealed=true});clearInterval(timer);const stats=gameData().minesweeper;updateGame("minesweeper",{games:(stats.games||0)+1});win.querySelector("#mineStatus").textContent="A mine was revealed. Start a new game.";render();return}if(cell.count===0)neighbours(index).forEach(i=>{if(!board[i].revealed&&!board[i].mine)reveal(i)});if(board.filter(item=>!item.mine&&!item.revealed).length===0){finished=true;clearInterval(timer);const stats=gameData().minesweeper,best=stats.bestTime==null?seconds:Math.min(stats.bestTime,seconds);updateGame("minesweeper",{wins:(stats.wins||0)+1,games:(stats.games||0)+1,bestTime:best});win.querySelector("#mineBest").textContent=String(best);win.querySelector("#mineStatus").textContent=`Cleared in ${seconds} seconds.`}render()};
    const flag=index=>{if(finished||board[index].revealed)return;board[index].flagged=!board[index].flagged;render()};
    const reset=()=>{clearInterval(timer);timer=null;seconds=0;started=false;finished=false;create(-1);win.querySelector("#mineTime").textContent="0";win.querySelector("#mineStatus").textContent="Reveal every safe tile. Right-click to place a flag.";render()};win.querySelector("#mineNew").onclick=reset;reset();return win;
  }
  function openMemory(){
    const symbols=["◆","●","▲","■","★","✦","♥","☀"];const html=`<div class="app-shell gold1v-game"><div class="app-toolbar"><button id="memoryNew" class="button primary">New game</button><span>Moves: <b id="memoryMoves">0</b></span><span>Time: <b id="memoryTime">0</b>s</span><span>Best: <b id="memoryBest">${gameData().memory.bestMoves??"—"}</b></span></div><div class="app-body gold1v-game-stage"><div id="memoryBoard" class="gold1v-memory-board"></div><p id="memoryStatus">Match all eight pairs.</p></div></div>`;
    const win=openWindow("memory","Memory Match",html,{width:650,height:650});let cards=[],open=[],moves=0,seconds=0,timer=null,locked=false;
    const shuffle=array=>array.sort(()=>Math.random()-.5);
    const render=()=>{const holder=win.querySelector("#memoryBoard");holder.innerHTML=cards.map((card,index)=>`<button data-memory-card="${index}" class="${card.matched?"matched":""} ${card.face?"face":""}">${card.face||card.matched?esc(card.symbol):"?"}</button>`).join("");holder.querySelectorAll("[data-memory-card]").forEach(button=>button.onclick=()=>flip(Number(button.dataset.memoryCard)))};
    const startTimer=()=>{if(timer)return;timer=setInterval(()=>{seconds++;win.querySelector("#memoryTime").textContent=String(seconds)},1000)};
    const finish=()=>{clearInterval(timer);const stats=gameData().memory,bestMoves=stats.bestMoves==null?moves:Math.min(stats.bestMoves,moves),bestTime=stats.bestTime==null?seconds:Math.min(stats.bestTime,seconds);updateGame("memory",{wins:(stats.wins||0)+1,games:(stats.games||0)+1,bestMoves,bestTime});win.querySelector("#memoryBest").textContent=String(bestMoves);win.querySelector("#memoryStatus").textContent=`Completed in ${moves} moves and ${seconds} seconds.`};
    const flip=index=>{if(locked||cards[index].matched||cards[index].face)return;startTimer();cards[index].face=true;open.push(index);render();if(open.length===2){moves++;win.querySelector("#memoryMoves").textContent=String(moves);const [a,b]=open;if(cards[a].symbol===cards[b].symbol){cards[a].matched=cards[b].matched=true;open=[];if(cards.every(card=>card.matched))finish();render()}else{locked=true;setTimeout(()=>{cards[a].face=cards[b].face=false;open=[];locked=false;render()},700)}}};
    const reset=()=>{clearInterval(timer);timer=null;seconds=0;moves=0;open=[];locked=false;cards=shuffle([...symbols,...symbols]).map(symbol=>({symbol,face:false,matched:false}));win.querySelector("#memoryMoves").textContent="0";win.querySelector("#memoryTime").textContent="0";win.querySelector("#memoryStatus").textContent="Match all eight pairs.";render()};win.querySelector("#memoryNew").onclick=reset;reset();return win;
  }

  /* ------------------------- Registration ------------------------- */
  function ensureApp(app){const apps=api()?.APPS;if(!Array.isArray(apps))return false;const existing=apps.find(item=>item.id===app.id);if(existing)Object.assign(existing,app);else apps.push(app);return true}
  function registerApps(){
    ensureApp({id:"games",name:"Emerald Games",label:"GM",color:"#107c10",group:"Games",desc:"Open built-in EmeraldOS games and view saved scores.",open:openGameCenter});
    ensureApp({id:"snake",name:"Emerald Snake",label:"SN",color:"#107c10",group:"Games",desc:"Classic snake with cloud-saved high scores.",open:openSnake});
    ensureApp({id:"minesweeper",name:"Emerald Mines",label:"MI",color:"#d83b01",group:"Games",desc:"Clear a classic minefield with flags and a timer.",open:openMinesweeper});
    ensureApp({id:"memory",name:"Memory Match",label:"MM",color:"#5c2d91",group:"Games",desc:"Match every pair in as few moves as possible.",open:openMemory});
    ensureApp({id:"accounthistory",name:"Account History",label:"AH",color:"#0078d7",group:"System",desc:"Review login, update, security, and account activity.",open:openHistory});
    const calendar=api().APPS.find(app=>app.id==="calendar");if(calendar){calendar.open=openInteractiveCalendar;calendar.desc="Interactive month, week, and agenda calendar with event editing and reminders."}
    api().renderStartMenu?.();api().renderDesktop?.();
  }
  function patchAPI(){Object.assign(window.Gold1V||{}, {openCalendar:openInteractiveCalendar,openAccountHistory:openHistory,changePassword,openGameCenter,openSnake,openMinesweeper,openMemory,openPasswordChange:changePassword,gameData,calendarEvents,recordAccountEvent:record});window.Gold1V=window.Gold1V||api()}
  function init(){
    if(!api()?.APPS){setTimeout(init,80);return}
    registerApps();patchAPI();record("vm-start",{title:"EmeraldOS Gold 1V started",outcome:"success",shellV2:new URLSearchParams(location.search).get("elsusShell")==="2"});
    checkCalendarReminders();setInterval(checkCalendarReminders,60000);
    const hash=location.hash.slice(1).toLowerCase();if(["games","snake","minesweeper","memory","accounthistory","calendar"].includes(hash))setTimeout(()=>api().openApp(hash),1100);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
