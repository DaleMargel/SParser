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
// =================
let line=defer();
let strike=defer();
let code=defer();
let italic=defer();
let bold=defer();
let header=defer();

let init=rule`''`.on(()=>push(""));
{ // italic
	let i1; {
		let step=rule`!'*'*`.on(s=>push(pop()+s));
		let allow=rule`${bold}|${strike}|${code}`.on(()=>merge());
		i1=rule`'*'!'*'${init}{${allow}|${step}}'*'`.on(()=>push(`<i>${pop()}</i>`));
	}
	let i2; {
		let step=rule`!'_'*`.on(s=>push(pop()+s));
		let allow=rule`${bold}|${strike}|${code}`.on(()=>merge());
		i2=rule`'_'!'_'${init}{${allow}|${step}}'_'`.on(()=>push(`<i>${pop()}</i>`));
	}
	italic.set(rule`${i1}|${i2}`);
}
{ // bold
	let b1; {
		let step=rule`!'**'*`.on(s=>push(pop()+s));
		let allow=rule`${italic}|${strike}|${code}`.on(()=>merge());
		b1=rule`'**'${init}{${allow}|${step}}'**'`.on(()=>push(`<b>${pop()}</b>`));
	}
	let b2; {
		let step=rule`!'__'*`.on(s=>push(pop()+s));
		let allow=rule`${italic}|${strike}|${code}`.on(()=>merge());
		b2=rule`'__'${init}{${allow}|${step}}'__'`.on(()=>push(`<b>${pop()}</b>`));
	}
	bold.set(rule`${b1}|${b2}`)
}
{ // strike
	let step=rule`!'~~'*`.on(s=>push(pop()+s));
	let allow=rule`${bold}|${italic}|${code}`.on(()=>merge());
	strike.set(rule`'~~'${init}{${allow}|${step}}'~~'`.on(()=>push(`<s>${pop()}</s>`)));
}
{ // code
	let step=rule`!'\`'*`.on(s=>push(pop()+s));
	code.set(rule`'\`'${init}{${step}}'\`'`.on(()=>push(`<code>${pop()}</code>`)));
}
{ // line
	let step=rule`!'\n'*`.on(s=>push(pop()+s));
	let allow=rule`${bold}|${italic}|${strike}|${code}`.on(()=>merge());
	line.set(rule`${init}{${allow}|${step}}['\n']`);
}
{ // header
	let n=0;
	let init=rule`''`.on(()=>n=0);
	let step=rule`''`.on(()=>n++);
	let head=rule`${init}((${step}'#'):1..6){' '}${line}`.on(()=>push(`<h${n}>${pop()}</h${n}>`));
	let headn=rule`!'#######'${head}`;
	let head1=rule`${line}('=':3..)['\n']`.on(()=>push(`<h1>${pop()}</h1>`));
	let head2=rule`${line}('-':3..)['\n']`.on(()=>push(`<h2>${pop()}</h2>`));
	header.set(rule`${headn}|${head1}|${head2}`);
}
let list; { // list
	let ul; {
		let finit=rule`''`.on(()=>push("<ul>|"+pop()+"</ul>"));
		let step=rule`'- '${line}`.on(()=>{
			let [a,b]=stak.splice(-2);
			push(a+`<li>${b}</li>|`);
		});
		ul=rule`${init}{${step}}${finit}`;
	}
	let ol; {
		let finit=rule`''`.on(()=>push("<ol>|"+pop()+"</ol>"));
		let step=rule`{<0..9>}'. '${line}`.on(()=>{
			let [a,b]=stak.splice(-2);
			push(a+`<li>${b}</li>|`);
		});
		ol=rule`${init}{${step}}${finit}`;
	}
	list=rule`${ul}|${ol}`;
}
let fence; {
	let tabfence; {
		let sp=rule`' ':4|'\t'`;
		let init=rule`!!${sp}`.on(()=>push("<pre><code>"));
		let step=rule`{!'\n'*}['\n']`.on(s=>push(`${pop()}${s}`));
		let finit=rule`''`.on(()=>push(`${pop()}</code></pre>`));
		tabfence=rule`${init}{${sp}${step}['\n']}${finit}`;
	}

	let tickfence; {
		let init=rule`'\`':4'\n'`.on(()=>push("<pre><code>"));
		let step=rule`{!'\n'*}'\n'`.on(s=>push(`${pop()}${s}`));
		let finit=rule`'\`':4['\n']`.on(()=>push(`${pop()}</code></pre>`));
		tickfence=rule`${init}{${step}['\n']}${finit}`;
	}
	fence=rule`${tabfence}|${tickfence}`;
}
let hr=rule`<-*_>:3..['\n']`.on(()=>push('<hr>'));
let bquote=rule`'>' ${line}`.on(()=>push(`<blockquote>${pop()}</blockquote>`));
let any=rule`${header}|${list}|${hr}|${bquote}|${fence}|${line}`;

// ==============
let errs=0;
function test(result,expect){
	let ok = expect===result;
	if(!ok) errs++;
	let log = ok ? `ok: ${expect}` : `error: expected ${expect} / got ${result}`;
	console.log(log);
}
console.log("Begin test");

test(pars(any,'---'),"<hr>");
test(pars(any,'***'),"<hr>");
test(pars(any,'___'),"<hr>");
test(pars(any,'****'),"<hr>");
test(pars(any,'**'),"**");

test(pars(any,"abc"),"abc");
test(pars(any,"abc\n"),"abc");
test(pars(any,"a`b`c"),"a<code>b</code>c");
test(pars(any,"a*b*c"),"a<i>b</i>c");
test(pars(any,"a**b**c"),"a<b>b</b>c");
test(pars(any,"a~~b~~c"),"a<s>b</s>c");

test(pars(any,"**abc**"),"<b>abc</b>");
test(pars(any,"**`abc`**"),"<b><code>abc</code></b>");
test(pars(any,"**a*b*c**"),"<b>a<i>b</i>c</b>");
test(pars(any,"**a_b_c**"),"<b>a<i>b</i>c</b>");
test(pars(any,"**a~~b~~c**"),"<b>a<s>b</s>c</b>");
test(pars(any,"**a**b**c**"),"<b>a</b>b<b>c</b>");
test(pars(any,"**a__b__c**"),"<b>a_<i>b</i>_c</b>");
test(pars(any,"**abc*"),"*<i>abc</i>");
test(pars(any,"**abc"),"**abc");

test(pars(any,"__abc__"),"<b>abc</b>");
test(pars(any,"__`abc`_"),"_<i><code>abc</code></i>");
test(pars(any,"__a*b*c__"),"<b>a<i>b</i>c</b>");
test(pars(any,"__a_b_c__"),"<b>a<i>b</i>c</b>");
test(pars(any,"__a**b**c__"),"<b>a*<i>b</i>*c</b>");
test(pars(any,"__a__b__c__"),"<b>a</b>b<b>c</b>");
test(pars(any,"__abc__"),"<b>abc</b>");
test(pars(any,"__abc"),"__abc");

test(pars(any,"*abc*"),"<i>abc</i>");
test(pars(any,"*`abc`*"),"<i><code>abc</code></i>");
test(pars(any,"*a**b**c*"),"<i>a<b>b</b>c</i>");
test(pars(any,"*a__b__c*"),"<i>a<b>b</b>c</i>");
test(pars(any,"*a~~b~~c*"),"<i>a<s>b</s>c</i>");
test(pars(any,"*a*b*c*"),"<i>a</i>b<i>c</i>");
test(pars(any,"*a_b_c*"),"<i>a_b_c</i>");
test(pars(any,"*abc**"),"<i>abc</i>*");
test(pars(any,"*abc"),"*abc");

test(pars(any,"_abc_"),"<i>abc</i>");
test(pars(any,"_`abc`_"),"<i><code>abc</code></i>");
test(pars(any,"_a**b**c_"),"<i>a<b>b</b>c</i>");
test(pars(any,"_a__b__c_"),"<i>a<b>b</b>c</i>");
test(pars(any,"_a~~b~~c_"),"<i>a<s>b</s>c</i>");
test(pars(any,"_a*b*c_"),"<i>a*b*c</i>");
test(pars(any,"_a_b_c_"),"<i>a</i>b<i>c</i>");
test(pars(any,"_abc__"),"<i>abc</i>_");

test(pars(any,"~~abc~~"),"<s>abc</s>");
test(pars(any,"~~`abc`~~"),"<s><code>abc</code></s>");
test(pars(any,"~~a**b**c~~"),"<s>a<b>b</b>c</s>");
test(pars(any,"~~a__b__c~~"),"<s>a<b>b</b>c</s>");
test(pars(any,"~~a*b*c~~"),"<s>a<i>b</i>c</s>");
test(pars(any,"~~a_b_c~~"),"<s>a<i>b</i>c</s>");
test(pars(any,"~~a~~b~~c~~"),"<s>a</s>b<s>c</s>");

test(pars(any,"`abc`"),"<code>abc</code>");
test(pars(any,"`**abc**`"),"<code>**abc**</code>");
test(pars(any,"`__abc__`"),"<code>__abc__</code>");
test(pars(any,"`*abc*`"),"<code>*abc*</code>");
test(pars(any,"`_abc_`"),"<code>_abc_</code>");
test(pars(any,"`~~abc~~`"),"<code>~~abc~~</code>");
test(pars(any,"`a`b`c`"),"<code>a</code>b<code>c</code>");

test(pars(any,">abc"),"<blockquote>abc</blockquote>"); // TODO: insert p when text fixed
test(pars(any,"> abc"),"<blockquote>abc</blockquote>");

test(pars(any,"\tabc"),"<pre><code>abc</code></pre>");
test(pars(any,"    abc"),"<pre><code>abc</code></pre>");
test(pars(any,"\t\tabc"),"<pre><code>\tabc</code></pre>");
test(pars(any,"\t\t\tabc"),"<pre><code>\t\tabc</code></pre>");
test(pars(any,"     abc"),"<pre><code> abc</code></pre>");
test(pars(any,"        abc"),"<pre><code>    abc</code></pre>");
test(pars(any,"\tabc\n\tdef"),"<pre><code>abc\ndef</code></pre>");

test(pars(any,"````\nabc\n````"),"<pre><code>abc\n</code></pre>");
test(pars(any,"````\nabc\ndef\n````"),"<pre><code>abc\ndef\n</code></pre>");

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
test(pars(any,"# ~~abc~~"),"<h1><s>abc</s></h1>");

test(pars(any,"abc\n===\n"),"<h1>abc</h1>");
test(pars(any,"abc\n---\n"),"<h2>abc</h2>");

test(pars(any,"- abc"),"<ul>|<li>abc</li>|</ul>");
test(pars(any,"- abc\n- def"),"<ul>|<li>abc</li>|<li>def</li>|</ul>");
test(pars(any,"1. abc"),"<ol>|<li>abc</li>|</ol>");
test(pars(any,"1. abc\n2. def"),"<ol>|<li>abc</li>|<li>def</li>|</ol>");
test(pars(any,"1. abc\n22345. def"),"<ol>|<li>abc</li>|<li>def</li>|</ol>");

console.log("End test");
if(errs) console.log(`There were ${errs} errors`)
else console.log('..Success')
