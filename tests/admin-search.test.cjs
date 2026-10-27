const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Admin search: bilingual text, Polish accents, multiple words and literal special characters',()=>{
 const window={};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/js/admin-search.js'),'utf8'),{window});
 const text=window.adminSearchText({pl:'Zdjęcia z Łodzi',en:'Photos from Łódź'},'Quebonafide',2025);
 assert.equal(window.adminSearchMatches(text,'zdjecia lodzi'),true);
 assert.equal(window.adminSearchMatches(text,'PHOTOS 2025'),true);
 assert.equal(window.adminSearchMatches(text,'Mata 2025'),false);
 assert.equal(window.adminSearchMatches(text,''),true);
 assert.equal(window.adminSearchMatches(text,'.*'),false);
 assert.equal(window.adminSearchMatches('<script>','<script>'),true);
});
