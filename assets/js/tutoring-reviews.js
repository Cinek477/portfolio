// Prezentacja opublikowanych opinii i animowana zmiana wybranej opinii.
window.portfolioPages ||= {};
window.portfolioPages['tutoring-reviews.js'] = () => {
 const card=document.querySelector('.tutoring-reviews');if(!card)return;
 const scope=window.portfolioPageScope || {signal:new AbortController().signal,cleanup:()=>{}};
 const content=card.querySelector('.review-demo'),pagination=card.querySelector('.review-pagination'),empty=card.querySelector('.review-empty');
 let items=[],index=0,busy=false,animation;
 const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
 function render(){if(scope.signal.aborted)return;content.replaceChildren();content.hidden=!items.length;empty.hidden=!!items.length;pagination.hidden=items.length<2;if(!items.length)return;
 const item=items[index],en=document.documentElement.lang==='en';const rating=node('div','', 'review-rating');rating.setAttribute('aria-label',(en?'Rating: ':'Ocena: ')+item.rating+'/5');
 const stars=node('span','','review-stars');stars.setAttribute('aria-hidden','true');stars.style.cssText='position:relative;display:inline-block;letter-spacing:2px;line-height:1.2';const base=node('span','★★★★★');base.style.opacity='.2';const fill=node('span','★★★★★');fill.style.cssText='position:absolute;inset:0 auto 0 0;overflow:hidden;white-space:nowrap;width:'+item.rating/5*100+'%';stars.append(base,fill);rating.append(stars,node('span',String(item.rating).replace('.',en?'.':',')+' / 5','review-rating-value'));
 const quote=node('blockquote','');quote.append(node('p',en&&item.textEn?item.textEn:item.text));const author=node('div','','review-author'),info=node('div','');info.append(node('strong',item.author),node('span',en&&item.contextEn?item.contextEn:item.context));author.append(node('span',item.author.slice(0,1).toUpperCase(),'review-avatar'),info);content.append(rating,quote,author);pagination.querySelector('span').textContent=String(index+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');
 }
 card.querySelector('.review-replay').addEventListener('click',async()=>{if(busy||items.length<2)return;busy=true;try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){animation=content.animate([{opacity:1},{opacity:0}],{duration:140});await animation.finished;}index=(index+1)%items.length;render();if(!scope.signal.aborted&&!matchMedia('(prefers-reduced-motion: reduce)').matches){animation=content.animate([{opacity:0,transform:'translateX(8px)'},{opacity:1,transform:'none'}],{duration:260});await animation.finished;}}catch{}finally{busy=false;}},{signal:scope.signal});
 items=window.portfolioPageContent?.knowledge?.reviews||[];render();fetch('/api/reviews',{signal:scope.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{items=data.filter(item=>item.visible&&!item.archived);index=0;render();}).catch(()=>{});
 const observer=new MutationObserver(render);observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});scope.cleanup(()=>{observer.disconnect();animation?.cancel();});
};
if(!window.portfolioRouting)window.portfolioPages['tutoring-reviews.js']();
