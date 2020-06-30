const {rule,parse,defer} = require('../../src/sparser');
const stak=[];

const digits=rule`{<0..9>}`;
const number=rule`['-']${digits}[.${digits}]`.ons(s => stak.push(parseFloat(s)) );

const expr=defer();
const exprValu=rule`( '(' ${expr} ')' )|${number}`;

const exprPow=defer();
const opPow=rule` '^' [${exprPow}|${exprValu}]`.onx(() => {
	let [a,b]=stak.splice(-2);
	stak.push(a**b);
});
exprPow.set(rule`${exprValu}[${opPow}]`);

const opMul=rule` '*' ${exprPow}`.onx(() => stak.push(stak.pop()*stak.pop()) );
const opDiv=rule` '/' ${exprPow}`.onx(() => {
	let [a,b]=stak.splice(-2);
	stak.push(a/b);
});
const exprMulDiv=rule`${exprPow}[{${opMul}|${opDiv}}]`;

const opAdd=rule` '+' ${exprMulDiv}`.onx(() => stak.push(stak.pop()+stak.pop()) );
const opSub=rule` '-' ${exprMulDiv}`.onx(() => {
	let [a,b]=stak.splice(-2);
	stak.push(a-b);
});
const exprAddSub=rule` ${exprMulDiv}[{${opAdd}|${opSub}}] `;
expr.set(exprAddSub);

function calculate(str){
	return parse(expr,str) &&
		stak.length == 1 &&
		stak.pop();
}
module.exports.calc = calculate;