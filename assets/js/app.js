/* ============================================
   DavronMarket — Main JavaScript
   ============================================ */

// ═══ NAV ═══
function scrollTo(id){
  const el=document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
}
function toggleMobileNav(){
  document.getElementById('mobileNav').classList.toggle('open');
  document.getElementById('burger').classList.toggle('open');
}
function closeMobileNav(){
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('burger').classList.remove('open');
}

// ═══ MAP DATA ═══
const dmLocs=[
  {name:'Главный офис управления',addr:'32 мкр, Бозори Сомониён, Худжанд',type:'Офис',lat:40.303663,lng:69.640825},
  {name:'Магазин одежды DavronMarket',addr:'Худжанд, ул. Ленина',type:'Магазин',lat:40.284,lng:69.622},
  {name:'Филиал «Сомон»',addr:'Душанбе, просп. Рудаки 12',type:'Филиал',lat:38.560,lng:68.774},
  {name:'Онлайн-склад',addr:'Худжанд, промзона',type:'Склад',lat:40.296,lng:69.650},
  {name:'Сервис-центр',addr:'Истаравшан, ул. Навои',type:'Сервис',lat:39.914,lng:69.004}
];
let mapIdx=0,dmMap,dmMarkers=[];

function renderMapCards(){
  const list=document.getElementById('card-list');
  if(!list)return;
  list.innerHTML=dmLocs.map((l,i)=>`
    <div class="map-card${i===mapIdx?' active':''}" onclick="selectLoc(${i})">
      <div class="map-card-name">${l.name}</div>
      <div class="map-card-addr">${l.addr}</div>
      <span class="map-card-type">${l.type}</span>
    </div>`).join('');
}

function selectLoc(i){
  mapIdx=i;
  const l=dmLocs[i];
  if(dmMap) dmMap.flyTo([l.lat,l.lng],14);
  document.getElementById('bar-name').textContent=l.name;
  document.getElementById('bar-addr').textContent=l.addr;
  document.getElementById('cnt').textContent=(i+1)+' / '+dmLocs.length;
  document.getElementById('btn-prev').disabled=i===0;
  document.getElementById('btn-next').disabled=i===dmLocs.length-1;
  dmMarkers.forEach((m,j)=>{
    m.setOpacity(j===i?1:.5);
    if(j===i) m.openPopup();
  });
  renderMapCards();
}

function mapNav(d){selectLoc(mapIdx+d);}

function initMaps(){
  // Main map
  if(document.getElementById('dm-map')&&typeof L!=='undefined'){
    dmMap=L.map('dm-map',{scrollWheelZoom:false}).setView([40.303663,69.640825],12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
      attribution:'© CartoDB',maxZoom:19
    }).addTo(dmMap);
    dmLocs.forEach((l,i)=>{
      const m=L.marker([l.lat,l.lng]).addTo(dmMap)
        .bindPopup(`<b>${l.name}</b><br>${l.addr}`);
      m.on('click',()=>selectLoc(i));
      dmMarkers.push(m);
    });
    renderMapCards();
    selectLoc(0);
  }
  // Contact map
  if(document.getElementById('ct-map')&&typeof L!=='undefined'){
    const ctMap=L.map('ct-map',{scrollWheelZoom:false}).setView([40.303663,69.640825],15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
      attribution:'© CartoDB',maxZoom:19
    }).addTo(ctMap);
    L.marker([40.303663,69.640825]).addTo(ctMap)
      .bindPopup('<b>DavronMarket</b><br>32 мкр, Бозори Сомониён').openPopup();
  }
}

// ═══ CONTACTS ═══
let ctTopic='Вопрос';
function selectTopic(el){
  document.querySelectorAll('.ct-topic').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  ctTopic=el.textContent;
}

function sendToWA(){
  const name=document.getElementById('ct-name').value.trim();
  const phone=document.getElementById('ct-phone').value.trim();
  const msg=document.getElementById('ct-message').value.trim();
  if(!name||!phone){dmToast('Заполните имя и телефон');return;}
  const text=`Тема: ${ctTopic}\nИмя: ${name}\nТелефон: ${phone}\n${msg?'Сообщение: '+msg:''}`;
  const url='https://wa.me/992929612111?text='+encodeURIComponent(text);
  window.open(url,'_blank');
  document.getElementById('ct-form-inner').style.display='none';
  const s=document.getElementById('ct-success');s.classList.add('show');
}

function ctShare(type){
  const url='https://davronmarket.com';
  if(type==='copy'){
    navigator.clipboard.writeText(url).then(()=>dmToast('Ссылка скопирована!')).catch(()=>{});
  } else if(navigator.share){
    navigator.share({title:'DavronMarket',url:url});
  } else {
    dmToast('Поделиться не поддерживается в этом браузере');
  }
}

// ═══ REVIEWS MODAL ═══
function openReviews(){
  document.getElementById('revOverlay').classList.add('show');
  document.body.style.overflow='hidden';
}
function closeReviews(e){
  if(e&&e.target!==document.getElementById('revOverlay'))return;
  document.getElementById('revOverlay').classList.remove('show');
  document.body.style.overflow='';
}
function closeReviewsBtn(){
  document.getElementById('revOverlay').classList.remove('show');
  document.body.style.overflow='';
}

// Video player
document.addEventListener('click',function(e){
  const thumb=e.target.closest('.vc__thumb');
  if(!thumb)return;
  const yt=thumb.dataset.yt;
  const sec=thumb.dataset.sec||0;
  if(!yt)return;
  const player=thumb.nextElementSibling;
  if(!player||!player.classList.contains('vc__player'))return;
  player.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(yt)}?autoplay=1&start=${parseInt(sec)||0}" allowfullscreen allow="autoplay"></iframe>`;
  thumb.style.display='none';
});

// ═══ TOAST ═══
function dmToast(msg){
  const t=document.getElementById('dm-toast');
  if(!t)return;
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

// ═══ AI CHAT WIDGET ═══
let dmIsOpen=false,dmConv=[];

function dmToggle(){
  dmIsOpen=!dmIsOpen;
  document.getElementById('dmWin').classList.toggle('open',dmIsOpen);
  document.getElementById('dmIcC').style.display=dmIsOpen?'none':'block';
  document.getElementById('dmIcX').style.display=dmIsOpen?'block':'none';
  if(dmIsOpen){
    document.getElementById('dmBadge').style.display='none';
    dmHideGreet();
  }
}
function dmOpen(){dmIsOpen=false;dmToggle();}
function dmHideGreet(){document.getElementById('dmGreet').style.display='none';}

function dmAddMsg(text,role){
  const c=document.getElementById('dmMsgs');
  const d=document.createElement('div');
  d.className='dm-msg-w '+role;
  d.textContent=text;
  c.appendChild(d);
  c.scrollTop=c.scrollHeight;
  return d;
}

function dmKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();dmSend();}}
function dmResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,100)+'px';}

function dmQ(q){
  document.getElementById('dmInp').value=q;
  dmSend();
}

async function dmSend(){
  const inp=document.getElementById('dmInp');
  const msg=inp.value.trim();
  if(!msg)return;
  inp.value='';inp.style.height='auto';
  document.getElementById('dmQR').style.display='none';

  dmAddMsg(msg,'user');
  dmConv.push({role:'user',content:msg});

  const typing=dmAddMsg('Думаю...','bot typing');

  const sysPrompt=`Ты — ИИ-помощник платформы DavronMarket. Отвечай кратко, по-русски. DavronMarket — первая цифровая бизнес-экосистема Таджикистана: магазины, услуги, такси, знакомства, объявления, игры, курсы, видео, музыка. Основатель — Даврон Самадов. Контакты: +992 92 961-21-11, info@davronmarket.tj, Худжанд, 32 мкр, Бозори Сомониён. Сайт: davronmarket.com`;

  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':'sk-ant-api03-placeholder-key',
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:600,
        system:sysPrompt,
        messages:dmConv.slice(-10)
      })
    });
    const d=await r.json();
    typing.remove();
    const reply=d.content?.[0]?.text||'Извините, не удалось получить ответ.';
    dmAddMsg(reply,'bot');
    dmConv.push({role:'assistant',content:reply});
  }catch(e){
    typing.remove();
    dmAddMsg('Ошибка связи. Попробуйте позже или напишите в WhatsApp.','bot');
  }
}

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded',function(){
  initMaps();

  // Show greeting bubble
  setTimeout(function(){
    const g=document.getElementById('dmGreet');
    if(g) g.style.display='block';
  },3000);

  // Initial AI message
  setTimeout(function(){
    dmAddMsg('👋 Привет! Я — ИИ-помощник DavronMarket.\n\nЯ знаю всё о нашей платформе, услугах и продуктах. Спросите что угодно!','bot');
  },4000);
});
