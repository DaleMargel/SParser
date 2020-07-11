import {parseAll,rule,defer} from '../../src/sparser.js';

let stak=[];
let linkmap={};

function pop(){ return stak.pop() }
function push(x){ stak.push(x) }

let allow=defer();
let init=rule``.on(()=>push(''));

let line; { // text\n => text
	let init=rule``.on(()=>push(""));
	let step=rule`!<\n\r>*`.on(s=>push(pop()+s));
	line=rule`${init}{${allow}|${step}}[<\n\r>]`;	
}
let noline=rule` <\n\r>`.on(()=>push('\n'));

let ptag; {
	let finit=rule``.on(()=>push(`<p>${pop()}</p>\n`));
	ptag=rule`${line}${finit}['\n']`;
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

let link; { // [text](url)
	const tag=rule`{!']'*}`.ons(s=>push(s));
	const url=rule`{!<)" >*}`.ons(s=>push(s));
	const tool=rule`{!'"'*}`.ons(s=>push(s));
	const notool=rule``.on(()=>push(''));
	
	link=rule`'['${tag}']('${url} ('"'${tool}'"'|${notool})')'`.on(()=>{
		let [a,b,c]=stak.splice(-3);
		let title = c=='' ? '' : ` title="${c}"`;
		push(`<a href="${b}"${title}>${a}</a>`) });
}
let img; { // ![text](url)
	const tag=rule`{!']'*}`.ons(s=>push(s));
	const url=rule`{!<)" >*}`.ons(s=>push(s));
	const tool=rule`{!'"'*}`.ons(s=>push(s));
	const notool=rule``.on(()=>push(''));
	
	img=rule`'!['${tag}']('${url} ('"'${tool}'"'|${notool})')'`.on(()=>{
		let [a,b,c]=stak.splice(-3);
		let title = c=='' ? '' : ` title="${c}"`;
		push(`<img alt="${a}" src="${b}"${title}>`) });
}
let reflink; { // [text][ref]
	const tag=rule`{!']'*}`.ons(s=>push(s));
	const link=rule`{!']'*}`.ons(s=>push(s.toLowerCase()));
	
	reflink=rule`'['${tag}']['${link}']'`.on(()=>{
		let [a,b]=stak.splice(-2);
		let ref=linkmap[b];
		let href=ref && ref.link ? ` href="${ref.link}"` : '';
		let title = ref && ref.title ? ` title="${ref.title}"` : '';
		push(`<a${href}${title}>${a}</a>`) });
}
let refimg; { // ![text][ref]
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


let ref; { // [ref]:url
	const key=rule`{!']'*}`.ons(s=>push(s));
	const link=rule`{!< "\n>*}`.ons(s=>push(s));
	const title=rule`{!'"'*}`.ons(s=>push(s));
	const notitle=rule``.on(()=>push(false));

	ref=rule`'['${key}']:' ${link} ('"'${title}'"'|${notitle})`.on(()=>{
		let [key,link,title]=stak.splice(-3);
		linkmap[key]={link,title};
		push(key);
	});
}

let head; {
	let n=0;
	const init=rule``.on(()=>n=0);
	const step=rule``.on(()=>n++);
	const headn=rule`${init}((${step}'#'):1..6){' '}${line}`.on(()=>push(`<h${n}>${pop()}</h${n}>\n`));
	const head1=rule`${line}('=':3..)['\n']`.on(()=>push(`<h1>${pop()}</h1>\n`));
	const head2=rule`${line}('-':3..)['\n']`.on(()=>push(`<h2>${pop()}</h2>\n`));
	head=rule`${headn}|${head1}|${head2}`;
}
let ul; {
	const finit=rule``.on(()=>push(`<ul>\n${pop()}</ul>\n`));
	const step=rule`'- '${line}`.on(()=>{
		let [a,b]=stak.splice(-2);
		push(`${a}<li>${b}</li>\n`)
	});
	ul=rule`${init}{${step}}${finit}`;
}
let ol; {
	const finit=rule``.on(()=>push(`<ol>\n${pop()}</ol>\n`));
	const step=rule`{<0..9>}'. '${line}`.on(()=>{
		let [a,b]=stak.splice(-2);
		push(`${a}<li>${b}</li>\n`);
	});
	ol=rule`${init}{${step}}${finit}`;
}
let list=rule`${ul}|${ol}`;

let tabfence; {
	const sp=rule`' ':4|'\t'|(' ':..3'\t')`;
	const init=rule`!!${sp}`.on(()=>push("<pre><code>"));
	const step=rule`{!'\n'*}['\n']`.on(s=>push(`${pop()}${s}`));
	const finit=rule`''`.on(()=>push(`${pop()}</code></pre>\n`));
	tabfence=rule`${init}{${sp}${step}['\n']}${finit}`;
}
let tickfence; {
	const init=rule`'\`':4'\n'`.on(()=>push("<pre><code>"));
	const step=rule`{!'\n'*}'\n'`.on(s=>push(`${pop()}${s}`));
	const finit=rule`'\`':4['\n']`.on(()=>push(`${pop()}</code></pre>\n`));
	tickfence=rule`${init}{${step}['\n']}${finit}`;
}
let fence=rule`${tabfence}|${tickfence}`;

const bquote=rule`'>' ${line}`.on(()=>push(`<blockquote>${pop()}</blockquote>\n`));
const hr=rule`<-*_>:3..['\n']`.on(()=>push('<hr>\n'));

let table; {
	let headers=[];
	let justs=[];
	let index=0;
	let len=0;

	let init=rule``.on(()=>{ headers=[]; justs=[]; index=0 });

	let th=rule`{!<|\n>*}`.ons(s=>headers.push(s.trim()));
	let head=rule`['|']{${th}['|']}['\n']`;

	let left=rule` [':']('-':3..) `.on(()=>justs.push(''));
	let wide=rule` ':'('-':3)':'`.on(()=>justs.push(' class="center"'));
	let right=rule` ('-':3..)':' `.on(()=>justs.push(' class="right"'));
	let tu=rule`${wide}|${right}|${left}`;
	let just=rule`['|']{${tu}['|']}['\n']`;

	let start=rule``.on(()=>{
		len=headers.length;
		let str='<table>\n<tr>\n';
		for(let i=0; i<len; i++)
			str+=`<th${justs[i]}>${headers[i]}</th>\n`;
		str += `</tr>\n`
		push(str);
	});

	let tr=rule``.on(()=>{ push(`${pop()}<tr>\n`) });
	let ntr=rule``.on(()=>{ push(`${pop()}</tr>\n`) });

	let td=rule`{!<|\n>*}`.ons(s=>{
		let n = index++ % len;
		push(`${pop()}<td${justs[n]}>${s.trim()}</td>\n`);
	});
	let row=rule`['|']${tr}{${td}['|']}${ntr}['\n']`;
	let finit=rule``.on(()=>push(`${pop()}</table>\n`));
	table=rule`${init}${head}${just}${start}{${row}}${finit}`;
}

let blok=rule`${head}|${list}|${fence}|${bquote}|${hr}|${table}`;
let all=rule`${noline}|${blok}|${ptag}`;

function md(txt){
	stak=[];
	return (parseAll(all,txt)) ? stak.join('') : false;
}
export { md };
