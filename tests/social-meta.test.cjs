const test=require('node:test'),assert=require('node:assert/strict');const {socialMeta}=require('../server/social-meta.cjs');
test('Social metadata uses public album cover and escapes values without exposing hidden entries',()=>{
 const source='<html><head><title>Portfolio</title></head><body></body></html>',base='https://portfolio.example';
 const photos=[{id:'a',album:'Koncert <test>',src:'assets/a.jpg'},{id:'b',album:'Koncert <test>',src:'assets/b.jpg',albumCover:true},{id:'secret',album:'Prywatny',src:'assets/secret.jpg',visible:false}];
 const render=album=>socialMeta(source,{base,url:new URL('/hobby.html?album='+album,base),photos,projects:[]});
 const publicPage=render('a');assert.match(publicPage,/og:title/);assert.match(publicPage,/Koncert &lt;test&gt;/);assert.match(publicPage,/https:\/\/portfolio.example\/assets\/b.jpg/);assert.ok(!publicPage.includes('assets/secret.jpg'));assert.ok(!render('secret').includes('Prywatny'));
 const project=socialMeta(source,{base,url:new URL('/project.html?id=p',base),photos:[],projects:[{id:'p',caseStudy:{enabled:true,title:{pl:'Projekt "AI"'}},summary:{pl:'Opis'},src:'assets/images/projects/illustrations/hackyeah.svg'}]});assert.match(project,/hackyeah-social.png/);assert.match(project,/&quot;AI&quot;/);
});
