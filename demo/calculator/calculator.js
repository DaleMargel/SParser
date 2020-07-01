import {parse,rule,defer} from '../../src/sparser.js';

const stak=[];
function handle(action){
	let [a,b]=stak.splice(-2);
	stak.push(action(a,b));
}
const digits=rule`{<0..9>}`;
const number=rule`['-']${digits}['.'${digits}]`.ons(s => stak.push(parseFloat(s)) );

const expr=defer();
const exprValu=rule`( '(' ${expr} ')' )|${number}`;

const exprPow=defer();
const opPow=rule` '^' [${exprPow}|${exprValu}]`.on(() => handle((a,b)=>a**b) );
exprPow.set(rule`${exprValu}[${opPow}]`);

const opMul=rule` '*' ${exprPow}`.on(() => handle((a,b)=>a*b) );
const opDiv=rule` '/' ${exprPow}`.on(() => handle((a,b)=>a/b) );
const exprMulDiv=rule`${exprPow}[{${opMul}|${opDiv}}]`;

const opAdd=rule` '+' ${exprMulDiv}`.on(() => handle((a,b)=>a+b) );
const opSub=rule` '-' ${exprMulDiv}`.on(() => handle((a,b)=>a-b) );
const exprAddSub=rule` ${exprMulDiv}[{${opAdd}|${opSub}}] `;
expr.set(exprAddSub);

function calc(str){
	return parse(expr,str) &&
		stak.length == 1 &&
		stak.pop();
}
export { calc };