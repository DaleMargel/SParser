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

test(pars(line,"abc"),"abc");
test(pars(line,"abc\n"),"abc");
test(pars(line,"a*b*c"),"a<i>b</i>c");
test(pars(line,"a**b**c"),"a<b>b</b>c");
test(pars(line,"a~b~c"),"a<s>b</s>c");

test(pars(line,"**abc**"),"<b>abc</b>");
test(pars(line,"**a*b*c**"),"<b>a<i>b</i>c</b>");
test(pars(line,"**a_b_c**"),"<b>a<i>b</i>c</b>");
test(pars(line,"**a~b~c**"),"<b>a<s>b</s>c</b>");
test(pars(line,"**a**b**c**"),"<b>a</b>b<b>c</b>");
test(pars(line,"**a__b__c**"),"<b>a_<i>b</i>_c</b>");
test(pars(line,"**abc*"),"*<i>abc</i>");
test(pars(line,"**abc"),"**abc");

test(pars(line,"__abc__"),"<b>abc</b>");
test(pars(line,"__a*b*c__"),"<b>a<i>b</i>c</b>");
test(pars(line,"__a_b_c__"),"<b>a<i>b</i>c</b>");
test(pars(line,"__a**b**c__"),"<b>a*<i>b</i>*c</b>");
test(pars(line,"__a__b__c__"),"<b>a</b>b<b>c</b>");
test(pars(line,"__abc_"),"_<i>abc</i>");
test(pars(line,"__abc"),"__abc");

test(pars(line,"*abc*"),"<i>abc</i>");
test(pars(line,"*a**b**c*"),"<i>a<b>b</b>c</i>");
test(pars(line,"*a__b__c*"),"<i>a<b>b</b>c</i>");
test(pars(line,"*a~b~c*"),"<i>a<s>b</s>c</i>");
test(pars(line,"*a*b*c*"),"<i>a</i>b<i>c</i>");
test(pars(line,"*a_b_c*"),"<i>a_b_c</i>");
test(pars(line,"*abc**"),"<i>abc</i>*");
test(pars(line,"*abc"),"*abc");

test(pars(line,"_abc_"),"<i>abc</i>");
test(pars(line,"_a**b**c_"),"<i>a<b>b</b>c</i>");
test(pars(line,"_a__b__c_"),"<i>a<b>b</b>c</i>");
test(pars(line,"_a~b~c_"),"<i>a<s>b</s>c</i>");
test(pars(line,"_a*b*c_"),"<i>a*b*c</i>");
test(pars(line,"_a_b_c_"),"<i>a</i>b<i>c</i>");
test(pars(line,"_abc__"),"<i>abc</i>_");

test(pars(line,"~abc~"),"<s>abc</s>");
test(pars(line,"~a**b**c~"),"<s>a<b>b</b>c</s>");
test(pars(line,"~a__b__c~"),"<s>a<b>b</b>c</s>");
test(pars(line,"~a*b*c~"),"<s>a<i>b</i>c</s>");
test(pars(line,"~a_b_c~"),"<s>a<i>b</i>c</s>");
test(pars(line,"~a~b~c~"),"<s>a</s>b<s>c</s>");

let header=defer();
{
	let n=0;
	let hinit=rule`''`.on(()=>n=0);
	let step=rule`''`.on(()=>n++);
	// TODO: fix :1..6 has lower precidence than implied &, fixed by parenthesis for now
	let head=rule`${hinit}((${step}'#'):1..6){' '}${line}`.on(()=>push(`<h${n}>${pop()}</h${n}>`));
	header.set(rule`!'#######'${head}`);
}

test(pars(header,"# abc"),"<h1>abc</h1>");
test(pars(header,"## abc"),"<h2>abc</h2>");
test(pars(header,"### abc"),"<h3>abc</h3>");
test(pars(header,"#### abc"),"<h4>abc</h4>");
test(pars(header,"##### abc"),"<h5>abc</h5>");
test(pars(header,"###### abc"),"<h6>abc</h6>");
test(pars(header,"####### abc"),false);
test(pars(header,"#     abc"),"<h1>abc</h1>");

//let h1=rule`${text}'=':1..'\n'`.on(()=>write(`<h1>#{pop()}<h1>\n`));
//let h2=rule`${text}'-':1..'\n'`.on(()=>write(`<h2>#{pop()}<h2>\n`));

console.log("End test");
if(errs) console.log(`There were ${errs} errors`)
