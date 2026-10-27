const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function createSpotify({directory,json,body,authenticated,fetchImpl=fetch}){
 const configFile=path.join(directory,'spotify-config.json'),tokenFile=path.join(directory,'spotify-auth.json');
 const read=file=>{try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}};
 const write=(file,value)=>{fs.writeFileSync(file+'.tmp',JSON.stringify(value),{mode:0o600});fs.renameSync(file+'.tmp',file);};
 let config=read(configFile)||{},tokens=read(tokenFile),pending=new Map(),cached=null,cacheUntil=0,inflight=null,lastError='',generation=0;
 const clientId=()=>process.env.SPOTIFY_CLIENT_ID||config.clientId||'';
 const redirect=req=>process.env.SPOTIFY_REDIRECT_URI||'http://127.0.0.1:'+req.socket.localPort+'/api/spotify/callback';
 const reset=()=>{generation++;cached=null;cacheUntil=0;pending.clear();};
 async function tokenRequest(params){const response=await fetchImpl('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params),signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Nie udało się odświeżyć połączenia Spotify. Połącz konto ponownie.');const value=await response.json();if(typeof value.access_token!=='string'||!Number.isFinite(value.expires_in))throw Error('Niepoprawna odpowiedź Spotify.');return value;}
 async function access(){if(tokens?.access&&tokens.expires>Date.now()+30000)return tokens.access;if(!tokens?.refresh)throw Error('Połącz Spotify w panelu.');const epoch=generation;const result=await tokenRequest({grant_type:'refresh_token',client_id:clientId(),refresh_token:tokens.refresh});if(epoch!==generation)throw Error('Połączenie zostało zmienione.');tokens={access:result.access_token,refresh:result.refresh_token||tokens.refresh,expires:Date.now()+result.expires_in*1000};write(tokenFile,tokens);return tokens.access;}
 const safeTrack=item=>{
  if(!item||item.type!=='track'||typeof item.name!=='string')return null;
  const url=item.external_urls?.spotify;if(typeof url!=='string'||!/^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+(?:\?|$)/.test(url))return null;
  const image=item.album?.images?.find(image=>/^https:\/\/i\.scdn\.co\//.test(image.url||''))?.url||'';
  return {name:item.name.slice(0,300),artists:(item.artists||[]).map(artist=>String(artist.name).slice(0,150)).join(', '),album:String(item.album?.name||'').slice(0,300),url,image};
 };
 async function getMusic(){
  if(!tokens)return {connected:false,current:null,top:[]};
  if(Date.now()<cacheUntil)return cached||{connected:true,current:null,top:[],unavailable:true};
  if(inflight)return inflight;
  const epoch=generation;
  inflight=(async()=>{try{const bearer=await access();const get=async url=>{const response=await fetchImpl(url,{headers:{Authorization:'Bearer '+bearer},signal:AbortSignal.timeout(12000)});if(response.status===204)return null;if(!response.ok){if(response.status===401)tokens.expires=0;if(response.status===429)cacheUntil=Date.now()+Math.min(3600,Math.max(60,Number(response.headers.get('retry-after'))||60))*1000;throw Error(response.status===403?'Spotify odrzuciło dostęp. Sprawdź Premium i użytkowników aplikacji.':'Spotify chwilowo nie udostępnia danych.');}return response.json();};
   const [playing,top]=await Promise.all([get('https://api.spotify.com/v1/me/player/currently-playing'),get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5')]);
   const result={connected:true,current:playing?.is_playing?safeTrack(playing.item):null,top:(top?.items||[]).map(safeTrack).filter(Boolean).slice(0,5),updatedAt:new Date().toISOString()};
   if(epoch!==generation)return {connected:false,current:null,top:[]};cached=result;cacheUntil=Date.now()+60000;lastError='';return result;
  }catch(error){lastError=error.message;cacheUntil=Math.max(cacheUntil,Date.now()+60000);return cached?{...cached,current:null,stale:true}:{connected:!!tokens,current:null,top:[],unavailable:true};}finally{inflight=null;}})();return inflight;
 }
 return {handle:async(req,res,pathname)=>{
  if(pathname!=='/api/spotify'&&!pathname.startsWith('/api/spotify/'))return false;
  res.setHeader('Cache-Control','no-store');
  if(pathname==='/api/spotify'&&req.method==='GET'){json(res,200,await getMusic());return true;}
  if(pathname==='/api/spotify/callback'&&req.method==='GET'){
   const url=new URL(req.url,'http://localhost'),state=url.searchParams.get('state'),entry=pending.get(state);pending.delete(state);
   if(!entry||entry.expires<Date.now()){json(res,400,{error:'Sesja łączenia wygasła. Zacznij ponownie z panelu.'});return true;}
   try{if(url.searchParams.has('error'))throw Error('Nie udzielono zgody na połączenie Spotify.');const code=url.searchParams.get('code');if(!code||code.length>4000)throw Error('Brak kodu Spotify.');const result=await tokenRequest({grant_type:'authorization_code',client_id:entry.clientId,code,redirect_uri:entry.redirect,code_verifier:entry.verifier});if(!result.refresh_token)throw Error('Brak uprawnienia do odświeżania połączenia.');tokens={access:result.access_token,refresh:result.refresh_token,expires:Date.now()+result.expires_in*1000};write(tokenFile,tokens);reset();lastError='';res.writeHead(303,{Location:'/admin.html?spotify=connected','Referrer-Policy':'no-referrer'});res.end();}
   catch(error){lastError=error.message;json(res,400,{error:lastError});}return true;
  }
  if(!authenticated(req)){json(res,401,{error:'Zaloguj się do panelu.'});return true;}
  if(pathname==='/api/spotify/status'&&req.method==='GET'){json(res,200,{configured:!!clientId(),connected:!!tokens,redirectUri:redirect(req),lastError});return true;}
  if(pathname==='/api/spotify/config'&&req.method==='PUT'){
   if(process.env.SPOTIFY_CLIENT_ID){json(res,409,{error:'Client ID ustawiono w środowisku serwera.'});return true;}
   const input=await body(req,2048);if(typeof input.clientId!=='string'||!/[a-f0-9]{32}/i.test(input.clientId)||input.clientId.length!==32){json(res,400,{error:'Wklej 32-znakowy Client ID aplikacji Spotify.'});return true;}
   if(clientId()!==input.clientId){tokens=null;fs.rmSync(tokenFile,{force:true});reset();}config={clientId:input.clientId};write(configFile,config);json(res,200,{ok:true});return true;
  }
  if(pathname==='/api/spotify/connect'&&req.method==='POST'){
   if(!clientId()){json(res,400,{error:'Najpierw wpisz Client ID aplikacji.'});return true;}
   const verifier=crypto.randomBytes(48).toString('base64url'),state=crypto.randomBytes(32).toString('hex');pending.clear();const callback=redirect(req);pending.set(state,{verifier,clientId:clientId(),redirect:callback,expires:Date.now()+10*60000});
   const url=new URL('https://accounts.spotify.com/authorize');url.search=new URLSearchParams({response_type:'code',client_id:clientId(),redirect_uri:callback,scope:'user-top-read user-read-currently-playing',state,code_challenge_method:'S256',code_challenge:crypto.createHash('sha256').update(verifier).digest('base64url')});json(res,200,{url:url.href});return true;
  }
  if(pathname==='/api/spotify/disconnect'&&req.method==='POST'){tokens=null;fs.rmSync(tokenFile,{force:true});reset();lastError='';json(res,200,{ok:true});return true;}
  json(res,405,{error:'Niedozwolona operacja.'});return true;
 }};
}
module.exports={createSpotify};
