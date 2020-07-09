import {parse,rule,defer} from '../../src/sparser.js';

const stak=[];
let linkmap={};

function pop(){ return stak.pop() }
function push(x){ stak.push(x) }
function read(rule,txt){ return parse(rule,txt) && stak.length==1 && stak.pop() }

let allow=defer();
let init=rule`''`.on(()=>push(""));

let line; {
	const step=rule`!'\n'*`.on(s=>push(pop()+s));
	line=rule`${init}{${allow}|${step}}['\n']`;
}
let italic1; {
	const step=rule`!'*'*`.on(s=>push(pop()+s));
	italic1=rule`'*'!'*'${init}{${allow}|${step}}'*'`.on(()=>
	push(`<i>${pop()}</i>`));
}
let italic2; {
	const step=rule`!'_'*`.on(s=>push(pop()+s));
	italic2=rule`'_'!'_'${init}{${allow}|${step}}'_'`.on(()=>push(`<i>${pop()}</i>`));
}
let bold1; {
	const step=rule`!'**'*`.on(s=>push(pop()+s));
	bold1=rule`'**'${init}{${allow}|${step}}'**'`.on(()=>push(`<b>${pop()}</b>`));
}
let bold2; {
	const step=rule`!'__'*`.on(s=>push(pop()+s));
	bold2=rule`'__'${init}{${allow}|${step}}'__'`.on(()=>push(`<b>${pop()}</b>`));
}
let strike; {
	const step=rule`!'~~'*`.on(s=>push(pop()+s));
	strike=rule`'~~'${init}{${allow}|${step}}'~~'`.on(()=>push(`<s>${pop()}</s>`));
}
let code; {
	const step=rule`!'\`'*`.on(s=>push(pop()+s));
	code=rule`'\`'${init}{${step}}'\`'`.on(()=>push(`<code>${pop()}</code>`));
}
let style=rule`${bold1}|${bold2}|${italic1}|${italic2}|${strike}|${code}`;

let link; {
	const tag=rule`{!']'*}`.ons(s=>push(s));
	const url=rule`{!<)" >*}`.ons(s=>push(s));
	const tool=rule`{!'"'*}`.ons(s=>push(s));
	const notool=rule`''`.on(()=>push(''));
	
	link=rule`'['${tag}']('${url} ('"'${tool}'"'|${notool})')'`.on(()=>{
		let [a,b,c]=stak.splice(-3);
		let title = c=='' ? '' : ` title="${c}"`;
		push(`<a href="${b}"${title}>${a}</a>`) });
}
let img; {
	const tag=rule`{!']'*}`.ons(s=>push(s));
	const url=rule`{!<)" >*}`.ons(s=>push(s));
	const tool=rule`{!'"'*}`.ons(s=>push(s));
	const notool=rule`''`.on(()=>push(''));
	
	img=rule`'!['${tag}']('${url} ('"'${tool}'"'|${notool})')'`.on(()=>{
		let [a,b,c]=stak.splice(-3);
		let title = c=='' ? '' : ` title="${c}"`;
		push(`<img alt="${a}" src="${b}"${title}>`) });
}
let reflink; {
	const tag=rule`{!']'*}`.ons(s=>push(s));
	const link=rule`{!']'*}`.ons(s=>push(s.toLowerCase()));
	
	reflink=rule`'['${tag}']['${link}']'`.on(()=>{
		let [a,b]=stak.splice(-2);
		let ref=linkmap[b];
		let href=ref && ref.link ? ` href="${ref.link}"` : '';
		let title = ref && ref.title ? ` title="${ref.title}"` : '';
		push(`<a${href}${title}>${a}</a>`) });
}
let refimg; {
	const tag=rule`{!']'*}`.ons(s=>push(s));
	const link=rule`{!']'*}`.ons(s=>push(s));
	
	refimg=rule`'!['${tag}']['${link}']'`.on(()=>{
		let [a,b]=stak.splice(-2);
		let ref=linkmap[b] || {link:"",title:""};
		let src=ref && ref.link ? ` src="${ref.link}"` : '';
		let title = ref && ref.title ? ` title="${ref.title}"` : '';
		push(`<img alt="${a}"${src}${title}>`) });
}
let links=rule`${link}|${img}|${reflink}|${refimg}`;

allow.set(rule`${style}|${links}`.on(()=>{
	let [a,b]=stak.splice(-2);
	push(''+a+b) }));

let ref; {
	const key=rule`{!']'*}`.ons(s=>push(s));
	const link=rule`{!< "\n>*}`.ons(s=>push(s));
	const title=rule`{!'"'*}`.ons(s=>push(s));
	const notitle=rule`''`.on(()=>push(false));

	ref=rule`'['${key}']:' ${link} ('"'${title}'"'|${notitle})`.on(()=>{
		let [key,link,title]=stak.splice(-3);
		linkmap[key]={link,title};
		push(key);
	});
}

let head; {
	let n=0;
	const init=rule`''`.on(()=>n=0);
	const step=rule`''`.on(()=>n++);
	const headn=rule`${init}((${step}'#'):1..6){' '}${line}`.on(()=>push(`<h${n}>${pop()}</h${n}>`));
	const head1=rule`${line}('=':3..)['\n']`.on(()=>push(`<h1>${pop()}</h1>`));
	const head2=rule`${line}('-':3..)['\n']`.on(()=>push(`<h2>${pop()}</h2>`));
	head=rule`${headn}|${head1}|${head2}`;
}
let ul; {
	const finit=rule`''`.on(()=>push("<ul>|"+pop()+"</ul>"));
	const step=rule`'- '${line}`.on(()=>{
		let [a,b]=stak.splice(-2);
		push(a+`<li>${b}</li>|`)
	});
	ul=rule`${init}{${step}}${finit}`;
}
let ol; {
	const finit=rule`''`.on(()=>push("<ol>|"+pop()+"</ol>"));
	const step=rule`{<0..9>}'. '${line}`.on(()=>{
		let [a,b]=stak.splice(-2);
		push(a+`<li>${b}</li>|`);
	});
	ol=rule`${init}{${step}}${finit}`;
}
let list=rule`${ul}|${ol}`;

let tabfence; {
	const sp=rule`' ':4|'\t'`;
	const init=rule`!!${sp}`.on(()=>push("<pre><code>"));
	const step=rule`{!'\n'*}['\n']`.on(s=>push(`${pop()}${s}`));
	const finit=rule`''`.on(()=>push(`${pop()}</code></pre>`));
	tabfence=rule`${init}{${sp}${step}['\n']}${finit}`;
}
let tickfence; {
	const init=rule`'\`':4'\n'`.on(()=>push("<pre><code>"));
	const step=rule`{!'\n'*}'\n'`.on(s=>push(`${pop()}${s}`));
	const finit=rule`'\`':4['\n']`.on(()=>push(`${pop()}</code></pre>`));
	tickfence=rule`${init}{${step}['\n']}${finit}`;
}
let fence=rule`${tabfence}|${tickfence}`;

const bquote=rule`'>' ${line}`.on(()=>push(`<blockquote>${pop()}</blockquote>`));
const hr=rule`<-*_>:3..['\n']`.on(()=>push('<hr>'));

let blok=rule`${head}|${list}|${fence}|${bquote}|${hr}`;
const any=rule`${blok}|${line}`;

// ==============
let errs=0;
function test(result,expect){
	let ok = expect===result;
	if(!ok) errs++;
	let log = ok ? `ok: ${expect}` : `error: expected ${expect} / got ${result}`;
	console.log(log);
}
console.log("Begin test");

test(read(any,'---'),"<hr>");
test(read(any,'***'),"<hr>");
test(read(any,'___'),"<hr>");
test(read(any,'****'),"<hr>");
test(read(any,'**'),"**");

test(read(any,"abc"),"abc");
test(read(any,"abc\n"),"abc");
test(read(any,"a`b`c"),"a<code>b</code>c");
test(read(any,"a*b*c"),"a<i>b</i>c");
test(read(any,"a**b**c"),"a<b>b</b>c");
test(read(any,"a~~b~~c"),"a<s>b</s>c");
test(read(any,"[google](www.google.com)"),'<a href="www.google.com">google</a>');

test(read(any,"**abc**"),"<b>abc</b>");
test(read(any,"**`abc`**"),"<b><code>abc</code></b>");
//test(read(any,"**a*b*c**"),"<b>a<i>b</i>c</b>"); //

test(read(any,"**a_b_c**"),"<b>a<i>b</i>c</b>");
test(read(any,"**a~~b~~c**"),"<b>a<s>b</s>c</b>");
test(read(any,"**a**b**c**"),"<b>a</b>b<b>c</b>");
//test(pars(any,"**a__b__c**"),"<b>a_<i>b</i>_c</b>");
test(read(any,"**abc*"),"*<i>abc</i>");
test(read(any,"**abc"),"**abc");
test(read(any,"**[google](www.google.com)**"),'<b><a href="www.google.com">google</a></b>');

test(read(any,"__abc__"),"<b>abc</b>");
test(read(any,"__`abc`_"),"_<i><code>abc</code></i>");
test(read(any,"__a*b*c__"),"<b>a<i>b</i>c</b>");
//test(pars(any,"__a_b_c__"),"<b>a<i>b</i>c</b>");
//test(pars(any,"__a**b**c__"),"<b>a*<i>b</i>*c</b>");
test(read(any,"__a__b__c__"),"<b>a</b>b<b>c</b>");
test(read(any,"__abc__"),"<b>abc</b>");
test(read(any,"__abc"),"__abc");
test(read(any,"__[google](www.google.com)__"),'<b><a href="www.google.com">google</a></b>');

test(read(any,"*abc*"),"<i>abc</i>");
test(read(any,"*`abc`*"),"<i><code>abc</code></i>");
test(read(any,"*a**b**c*"),"<i>a<b>b</b>c</i>");
test(read(any,"*a__b__c*"),"<i>a<b>b</b>c</i>");
test(read(any,"*a~~b~~c*"),"<i>a<s>b</s>c</i>");
test(read(any,"*a*b*c*"),"<i>a</i>b<i>c</i>");
test(read(any,"*a_b_c*"),"<i>a<i>b</i>c</i>");
test(read(any,"*abc**"),"<i>abc</i>*");
test(read(any,"*abc"),"*abc");
test(read(any,"*[google](www.google.com)*"),'<i><a href="www.google.com">google</a></i>');

test(read(any,"_abc_"),"<i>abc</i>");
test(read(any,"_`abc`_"),"<i><code>abc</code></i>");
test(read(any,"_a**b**c_"),"<i>a<b>b</b>c</i>");
test(read(any,"_a__b__c_"),"<i>a<b>b</b>c</i>");
test(read(any,"_a~~b~~c_"),"<i>a<s>b</s>c</i>");
test(read(any,"_a*b*c_"),"<i>a<i>b</i>c</i>");
test(read(any,"_a_b_c_"),"<i>a</i>b<i>c</i>");
test(read(any,"_abc__"),"<i>abc</i>_");
test(read(any,"_[google](www.google.com)_"),'<i><a href="www.google.com">google</a></i>');

test(read(any,"~~abc~~"),"<s>abc</s>");
test(read(any,"~~`abc`~~"),"<s><code>abc</code></s>");
test(read(any,"~~a**b**c~~"),"<s>a<b>b</b>c</s>");
test(read(any,"~~a__b__c~~"),"<s>a<b>b</b>c</s>");
test(read(any,"~~a*b*c~~"),"<s>a<i>b</i>c</s>");
test(read(any,"~~a_b_c~~"),"<s>a<i>b</i>c</s>");
test(read(any,"~~a~~b~~c~~"),"<s>a</s>b<s>c</s>");
test(read(any,"~~[google](www.google.com)~~"),'<s><a href="www.google.com">google</a></s>');

test(read(any,"`abc`"),"<code>abc</code>");
test(read(any,"`**abc**`"),"<code>**abc**</code>");
test(read(any,"`__abc__`"),"<code>__abc__</code>");
test(read(any,"`*abc*`"),"<code>*abc*</code>");
test(read(any,"`_abc_`"),"<code>_abc_</code>");
test(read(any,"`~~abc~~`"),"<code>~~abc~~</code>");
test(read(any,"`a`b`c`"),"<code>a</code>b<code>c</code>");
test(read(any,"`[google](www.google.com)`"),'<code>[google](www.google.com)</code>');

test(read(any,"[google](www.google.com)"),'<a href="www.google.com">google</a>');
test(read(any,"[google](./localfile.txt)"),'<a href="./localfile.txt">google</a>');
test(read(any,'[google](www.google.com "tip")'),'<a href="www.google.com" title="tip">google</a>');
test(read(any,'[google](www.google.com"tip")'),'<a href="www.google.com" title="tip">google</a>');
test(read(any,'[google](www.google.com     "tip")'),'<a href="www.google.com" title="tip">google</a>');

test(read(any,'![google](www.google.com)'),'<img alt="google" src="www.google.com">');
test(read(any,'![google](www.google.com "some text")'),'<img alt="google" src="www.google.com" title="some text">');

linkmap={goog:{link:"www.google.com"}};
test(read(any,"[google][goog]"),'<a href="www.google.com">google</a>');

linkmap={goog:{link:"www.google.com",title:"some text"}};
test(read(any,"[google][goog]"),'<a href="www.google.com" title="some text">google</a>');

linkmap={};
test(read(any,"[google][goog]"),'<a>google</a>');


test(read(ref,`[goog]: www.google.com`),"goog");
test(read(any,"[google][goog]"),'<a href="www.google.com">google</a>');

test(read(ref,`[goog]: www.google.com "some text"`),"goog");
test(read(any,"[google][goog]"),'<a href="www.google.com" title="some text">google</a>');

test(read(ref,`[1]: www.google.com "some text"`),"1");
test(read(any,"[google][1]"),'<a href="www.google.com" title="some text">google</a>');

// line structures
test(read(any,">abc"),"<blockquote>abc</blockquote>");
test(read(any,"> abc"),"<blockquote>abc</blockquote>");
test(read(any,">[google](www.google.com)"),'<blockquote><a href="www.google.com">google</a></blockquote>');

test(read(any,"\tabc"),"<pre><code>abc</code></pre>");
test(read(any,"    abc"),"<pre><code>abc</code></pre>");
test(read(any,"\t\tabc"),"<pre><code>\tabc</code></pre>");
test(read(any,"\t\t\tabc"),"<pre><code>\t\tabc</code></pre>");
test(read(any,"     abc"),"<pre><code> abc</code></pre>");
test(read(any,"        abc"),"<pre><code>    abc</code></pre>");
test(read(any,"\tabc\n\tdef"),"<pre><code>abc\ndef</code></pre>");
test(read(any,"\t[google](www.google.com)"),"<pre><code>[google](www.google.com)</code></pre>");

test(read(any,"````\nabc\n````"),"<pre><code>abc\n</code></pre>");
test(read(any,"````\nabc\ndef\n````"),"<pre><code>abc\ndef\n</code></pre>");

test(read(any,"# abc"),"<h1>abc</h1>");
test(read(any,"## abc"),"<h2>abc</h2>");
test(read(any,"### abc"),"<h3>abc</h3>");
test(read(any,"#### abc"),"<h4>abc</h4>");
test(read(any,"##### abc"),"<h5>abc</h5>");
test(read(any,"###### abc"),"<h6>abc</h6>");
test(read(any,"####### abc"),"####### abc");
test(read(any,"#     abc"),"<h1>abc</h1>");

test(read(any,"# **abc**"),"<h1><b>abc</b></h1>");
test(read(any,"# __abc__"),"<h1><b>abc</b></h1>");
test(read(any,"# *abc*"),"<h1><i>abc</i></h1>");
test(read(any,"# _abc_"),"<h1><i>abc</i></h1>");
test(read(any,"# ~~abc~~"),"<h1><s>abc</s></h1>");

test(read(any,"abc\n===\n"),"<h1>abc</h1>");
test(read(any,"abc\n---\n"),"<h2>abc</h2>");

test(read(any,"- abc"),"<ul>|<li>abc</li>|</ul>");
test(read(any,"- abc\n- def"),"<ul>|<li>abc</li>|<li>def</li>|</ul>");
test(read(any,"1. abc"),"<ol>|<li>abc</li>|</ol>");
test(read(any,"1. abc\n2. def"),"<ol>|<li>abc</li>|<li>def</li>|</ol>");
test(read(any,"1. abc\n22345. def"),"<ol>|<li>abc</li>|<li>def</li>|</ol>");

console.log("End test");
if(errs) console.log(`There were ${errs} errors`)
else console.log('..Success')
