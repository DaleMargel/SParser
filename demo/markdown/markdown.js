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

let errs=0;
function test(result,expect){
	let ok = expect===result;
	if(!ok) errs++;
	let log = ok ? `ok: ${expect}` : `error: expected ${expect} / got ${result}`;
	console.log(log);
}
console.log("Begin test");

// =================
let line=defer();
let ital1=defer();
let ital2=defer();
let bold1=defer(); 
let bold2=defer();
let strike=defer();

let init=rule`''`.on(()=>push(""));

{
	let step=rule`!'*'*`.on(s=>push(pop()+s));
	let other=rule`${bold1}|${bold2}|${strike}`.on(()=>merge());
	ital1.set(rule`'*'!'*'${init}{${other}|${step}}'*'`.on(()=>push(`<i>${pop()}</i>`)));
}
{
	let step=rule`!'_'*`.on(s=>push(pop()+s));
	let other=rule`${bold1}|${bold2}|${strike}`.on(()=>merge());
	ital2.set(rule`'_'!'_'${init}{${other}|${step}}'_'`.on(()=>push(`<i>${pop()}</i>`)));
}
{
	let step=rule`!'**'*`.on(s=>push(pop()+s));
	let other=rule`${ital1}|${ital2}|${strike}`.on(()=>merge());
	bold1.set(rule`'**'${init}{${other}|${step}}'**'`.on(()=>push(`<b>${pop()}</b>`)));
}
{
	let step=rule`!'__'*`.on(s=>push(pop()+s));
	let other=rule`${ital1}|${ital2}|${strike}`.on(()=>merge());
	bold2.set(rule`'__'${init}{${other}|${step}}'__'`.on(()=>push(`<b>${pop()}</b>`)));
}
{
	let step=rule`!'~'*`.on(s=>push(pop()+s));
	let other=rule`${bold1}|${bold2}|${ital1}|${ital2}`.on(()=>merge());
	strike.set(rule`'~'${init}{${other}|${step}}'~'`.on(()=>push(`<s>${pop()}</s>`)));
}
{
	let step=rule`!'\n'*`.on(s=>push(pop()+s));
	let other=rule`${bold1}|${bold2}|${ital1}|${ital2}|${strike}`.on(()=>merge());
	line.set(rule`${init}{${other}|${step}}['\n']`);
}

let header=defer();
{
	let n=0;
	let hinit=rule`''`.on(()=>n=0);
	let step=rule`''`.on(()=>n++);
	// TODO: fix :1..6 has lower precidence than implied &, fixed by parenthesis for now
	let head=rule`${hinit}((${step}'#'):1..6){' '}${line}`.on(()=>push(`<h${n}>${pop()}</h${n}>`));
	header.set(rule`!'#######'${head}`);
}

// TODO: fix this (underline headers)
//let head1=rule`${line}('=':3..)'='`.on(()=>push(`<h1>${pop()}</h1>`));
//let head2=rule`${line}('-':3..)'\n'`.on(()=>push(`<h2>${pop()}</h2>`));
//test(pars(head1,"abc\n==="),"<h1>abc</h1>");
//test(pars(head2,"abc\n---"),"<h1>abc</h1>");

let any=rule`${header}|${line}`

test(pars(any,"abc"),"abc");
test(pars(any,"abc\n"),"abc");
test(pars(any,"a*b*c"),"a<i>b</i>c");
test(pars(any,"a**b**c"),"a<b>b</b>c");
test(pars(any,"a~b~c"),"a<s>b</s>c");

test(pars(any,"**abc**"),"<b>abc</b>");
test(pars(any,"**a*b*c**"),"<b>a<i>b</i>c</b>");
test(pars(any,"**a_b_c**"),"<b>a<i>b</i>c</b>");
test(pars(any,"**a~b~c**"),"<b>a<s>b</s>c</b>");
test(pars(any,"**a**b**c**"),"<b>a</b>b<b>c</b>");
test(pars(any,"**a__b__c**"),"<b>a_<i>b</i>_c</b>");
test(pars(any,"**abc*"),"*<i>abc</i>");
test(pars(any,"**abc"),"**abc");

test(pars(any,"__abc__"),"<b>abc</b>");
test(pars(any,"__a*b*c__"),"<b>a<i>b</i>c</b>");
test(pars(any,"__a_b_c__"),"<b>a<i>b</i>c</b>");
test(pars(any,"__a**b**c__"),"<b>a*<i>b</i>*c</b>");
test(pars(any,"__a__b__c__"),"<b>a</b>b<b>c</b>");
test(pars(any,"__abc_"),"_<i>abc</i>");
test(pars(any,"__abc"),"__abc");

test(pars(any,"*abc*"),"<i>abc</i>");
test(pars(any,"*a**b**c*"),"<i>a<b>b</b>c</i>");
test(pars(any,"*a__b__c*"),"<i>a<b>b</b>c</i>");
test(pars(any,"*a~b~c*"),"<i>a<s>b</s>c</i>");
test(pars(any,"*a*b*c*"),"<i>a</i>b<i>c</i>");
test(pars(any,"*a_b_c*"),"<i>a_b_c</i>");
test(pars(any,"*abc**"),"<i>abc</i>*");
test(pars(any,"*abc"),"*abc");

test(pars(any,"_abc_"),"<i>abc</i>");
test(pars(any,"_a**b**c_"),"<i>a<b>b</b>c</i>");
test(pars(any,"_a__b__c_"),"<i>a<b>b</b>c</i>");
test(pars(any,"_a~b~c_"),"<i>a<s>b</s>c</i>");
test(pars(any,"_a*b*c_"),"<i>a*b*c</i>");
test(pars(any,"_a_b_c_"),"<i>a</i>b<i>c</i>");
test(pars(any,"_abc__"),"<i>abc</i>_");

test(pars(any,"~abc~"),"<s>abc</s>");
test(pars(any,"~a**b**c~"),"<s>a<b>b</b>c</s>");
test(pars(any,"~a__b__c~"),"<s>a<b>b</b>c</s>");
test(pars(any,"~a*b*c~"),"<s>a<i>b</i>c</s>");
test(pars(any,"~a_b_c~"),"<s>a<i>b</i>c</s>");
test(pars(any,"~a~b~c~"),"<s>a</s>b<s>c</s>");

test(pars(any,"# abc"),"<h1>abc</h1>");
test(pars(any,"## abc"),"<h2>abc</h2>");
test(pars(any,"### abc"),"<h3>abc</h3>");
test(pars(any,"#### abc"),"<h4>abc</h4>");
test(pars(any,"##### abc"),"<h5>abc</h5>");
test(pars(any,"###### abc"),"<h6>abc</h6>");
test(pars(any,"####### abc"),"####### abc");
test(pars(any,"#     abc"),"<h1>abc</h1>");

test(pars(any,"# **abc**"),"<h1><b>abc</b></h1>");
test(pars(any,"# __abc__"),"<h1><b>abc</b></h1>");
test(pars(any,"# *abc*"),"<h1><i>abc</i></h1>");
test(pars(any,"# _abc_"),"<h1><i>abc</i></h1>");
test(pars(any,"# ~abc~"),"<h1><s>abc</s></h1>");

console.log("End test");
if(errs) console.log(`There were ${errs} errors`)
