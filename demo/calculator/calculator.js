import {parse,rule,defer} from '../../src/sparser.js';

const stak=[];

const digits=rule`{<0..9>}`;
const number=rule`['-']${digits}['.'${digits}]`.ons(s => stak.push(parseFloat(s)) );

const expr=defer();
const exprValu=rule`( '(' ${expr} ')' )|${number}`;

const exprPow=defer();
const opPow=rule` '^' [${exprPow}|${exprValu}]`.on(() => {
	let [a,b]=stak.splice(-2);
	stak.push(a**b);
});
exprPow.set(rule`${exprValu}[${opPow}]`);

const opMul=rule` '*' ${exprPow}`.on(() => stak.push(stak.pop()*stak.pop()) );
const opDiv=rule` '/' ${exprPow}`.on(() => {
	let [a,b]=stak.splice(-2);
	stak.push(a/b);
});
const exprMulDiv=rule`${exprPow}[{${opMul}|${opDiv}}]`;

const opAdd=rule` '+' ${exprMulDiv}`.on(() => stak.push(stak.pop()+stak.pop()) );
const opSub=rule` '-' ${exprMulDiv}`.on(() => {
	let [a,b]=stak.splice(-2);
	stak.push(a-b);
});
const exprAddSub=rule` ${exprMulDiv}[{${opAdd}|${opSub}}] `;
expr.set(exprAddSub);

function calc(str){
	return parse(expr,str) &&
		stak.length == 1 &&
		stak.pop();
}
export { calc };