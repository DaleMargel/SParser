//import * from "./parser";
const {rule,parse} = require('./parser'); // CJS

let stak = [];
function push(x){stak.push(x)}
function pop(){stak.pop(x)}
function pop(n){
	let result = [];
	for(let i=0; i<n; i++) result.push(pop());
	return result;
}

let h = {
	wher : (name,comp,valu)=>{console.log(`where ${name},${comp},${valu}`)},
	sort : (name,dir)=>{console.log(`sort ${name} ${dir}`)},
	offset : (valu)=>{console.log(`offset ${valu}`)},
	limit : (valu)=>{console.log(`limit ${valu}`)},
	path : (valu)=>{console.log(`path ${valu}`)},
	done : ()=>{'done!'}
}

let digit=rule`<0..9>`;
let letter=rule`<a..z>|<A..Z>|_|$`;

let integer=rule`{${digit}}`.on(s=>push(parseInt(s)));
let float=rule`{${digit}}[.{${digit}}]`.on(s=>push(parseFloat(s)));
let number=rule`${float}|${integer}`;

let string=rule`'*'|"*"`.on(s=>push(s));

let name=rule`${letter}[{${letter}|${digit}}]`.on(s=>push(s));
let value=rule`${name}|${number}|${string}`;

let compare=rule`=|'[eq]'|'[gt]'|'[lt]'|'[ge]'|'[le]'|'[ne]'`.on(s=>push(s));
let sel=rule`${name}${compare}${value}`.on(()=>h.wher(pop(3)));
let asc=rule`'asc(${name})'|+${name}|${name}.asc`.on(()=>push("asc"));
let desc=rule`'desc(${name})'|-${name}|${name}.desc`.on(()=>push("desc"));
let sort=rule`sort_by=(${asc}|${desc})[{,(${asc}|${desc})}]`.on(()=>h.sort(pop(2))); //??
let offset=rule`offset=${integer}`.on(()=>h.offset(pop()));
let limit=rule`limit=${integer}`.on(()=>h.limit(pop()));
let mod=rule`${limit}|${offset}|${sort}|${sel}`;
let cpath=rule`count|self`.on(s=>push(s));
let path=rule`{/${cpath}|${value}}`.on(()=>h.path(pop()));
let rest=rule`{${path}}[/][&{${mod}}]`.on(()=>h.done());


let test="this/is/a/test?count";
parse(rest,test);
