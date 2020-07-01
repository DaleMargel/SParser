import {calc} from './calculator.js';

function test(result,expect){
	if (result != expect) console.log(`expected ${expect} got ${result}`)
}
console.log("Begin test");
test(calc("0"),0);
test(calc("9"),9);
test(calc("-5"),-5);
test(calc("1.25"),1.25);
test(calc("12"),12);
test(calc("100000.000001"),100000.000001);

test(calc("1+2"),3);
test(calc("1+2+1"),4);
test(calc("3-2"),1);
test(calc("3-2-1"),0);
test(calc("3-2+1"),2); // lr assoc
test(calc("3+-2"),1);
test(calc("3+-2--1"),2);

test(calc("3*2"),6);
test(calc("3*2*2"),12);
test(calc("4/2"),2);
test(calc("12/3/2"),2); // lr assoc
test(calc("12/3*2"),8); // lr assoc
test(calc("12*3/2"),18); // lr assoc

test(calc("3^2"),9);
test(calc("4^3^2"),262144); //rl assoc

test(calc("3*2+1"),7);
test(calc("1+2*3"),7);
test(calc("3*2-8/2+2"),4);
test(calc("1+2*3^2"),19);
test(calc("1+2*3^2^2"),163);
test(calc("9^0.5"),3);

test(calc("(1+2)*3^2"),27);
test(calc("1+(2*3)^2"),37);
test(calc("1+2*(3^2)"),19);
test(calc("(1+2)*(3^2)"),27);
test(calc("((1+2)*3)^2"),81);

test(calc(" ( ( 1   + 3 - 1) * 6 / 2) ^ 2 "),81);
test(calc("-3+(1.0000+2.25*1.0   + 4.5 / 81^0.50-0.125)*2.5  "),6.0625);

// 50 chars x 20k, high complexity -> almost 900ms
// it can be sped up by trimming unused rules in parser
let start=Date.now();
for(let i=0; i<20000; i++) {
	calc("-3+(1.0000+2.25*1.0   + 4.5 / 81^0.50-0.125)*2.5  ");
}
let wait = Date.now()-start;
console.log(`1m chars, complex processing takes ${wait}ms`);
console.log("End test");
