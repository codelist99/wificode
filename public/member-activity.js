const memberHeartbeat=()=>fetch('/api/member/activity',{method:'POST',headers:{'content-type':'application/json'},body:'{}',keepalive:true}).catch(()=>{});
setInterval(()=>{if(document.visibilityState==='visible')memberHeartbeat()},30000);
addEventListener('pagehide',()=>navigator.sendBeacon('/api/member/activity',new Blob(['{}'],{type:'application/json'})));
