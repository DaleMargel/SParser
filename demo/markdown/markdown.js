import {parse,rule,defer} from '../../src/sparser.js';

const stak=[];
function pop(){ return stak.pop() }
function push(x){ stak.push(x) }
function merge(){
	let [a,b]=stak.splice(-2);
	push(''+a+b);
}

function pars(rule,txt){
	return parse(rule,txt) && stak.length==1 && stak.pop();
}

//===============
//let text=defer();

//let it=rule`''`.on(()=>push(""));
//let ch=rule`!'\n'*`.on(s=>push(pop()+s));
//let txt=rule`${it}[{${ch}}]`;
//test(pars(txt,"hello"),"hello");
let errs=0;
function test(result,expect){
	let ok = expect===result;
	if(!ok) errs++;
	let log = ok ? `ok: ${expect}` : `error: expected ${expect} / got ${result}`;
	console.log(log);
}
console.log("Begin test");

// =================
let ital1=defer();
let ital2=defer();
let bold1=defer(); 
let bold2=defer();
let strike=defer();

let init=rule`''`.on(()=>push(""));

{
	let txt=rule`!'*'*`.on(s=>push(pop()+s));
	let other=rule`${bold1}|${bold2}|${strike}`.on(()=>merge());
	ital1.set(rule`'*'${init}{${other}|${txt}}'*'`.on(()=>push(`<i>${pop()}</i>`)));
}
{
	let txt=rule`!'_'*`.on(s=>push(pop()+s));
	let other=rule`${bold1}|${bold2}|${strike}`.on(()=>merge());
	ital2.set(rule`'_'${init}{${other}|${txt}}'_'`.on(()=>push(`<i>${pop()}</i>`)));
}
{
	let txt=rule`!'**'*`.on(s=>push(pop()+s));
	let other=rule`${ital1}|${ital2}|${strike}`.on(()=>merge());
	bold1.set(rule`'**'${init}{${other}|${txt}}'**'`.on(()=>
		push(`<b>${pop()}</b>`)));
}
{
	let txt=rule`!'__'*`.on(s=>push(pop()+s));
	let other=rule`${ital1}|${ital2}|${strike}`.on(()=>merge());
	bold2.set(rule`'__'${init}{${other}|${txt}}'__'`.on(()=>push(`<b>${pop()}</b>`)));
}
{
	let txt=rule`!'~'*`.on(s=>push(pop()+s));
	let other=rule`${bold1}|${bold2}|${ital1}|${ital2}`.on(()=>merge());
	strike.set(rule`'~'${init}{${other}|${txt}}'~'`.on(()=>push(`<s>${pop()}</s>`)));
}
test(pars(ital1,"*hello*"),"<i>hello</i>");
test(pars(ital2,"_hello_"),"<i>hello</i>");
test(pars(bold1,"**hello**"),"<b>hello</b>");
test(pars(bold2,"__hello__"),"<b>hello</b>");
test(pars(strike,"~hello~"),"<s>hello</s>");
test(pars(bold1,"**h*ell*o**"),"<b>h<i>ell</i>o</b>");
test(pars(bold1,"**h*ell*o**"),"<b>h<i>ell</i>o</b>");
//test(pars(bold1,"*h**ell**o*"),"<i>h<b>ell</b>o</i>"); - left off here


/*
let hn=1;
let ih=rule`''`.on(()=>hn=0);
let rh=rule`''`.on(()=>hn++);
let h=rule`${ih}(${rh}'#'):1..6 ${text}`.on(()=>
	write(`<h${hn}>${pop()}<h${hn}>`));

let h1=rule`${text}'=':1..'\n'`.on(()=>write(`<h1>#{pop()}<h1>\n`));
let h2=rule`${text}'-':1..'\n'`.on(()=>write(`<h2>#{pop()}<h2>\n`));

let head=`[${h},${h1},${h2}]`
*/
console.log("End test");
if(errs) console.log(`There were ${errs} errors`)
