import {parse,rule} from './sparser.js';

let fails = 0;
function test(result){
	if(!result) 
		fails++;
}
console.log("Begin test");

test(parse(rule`"hello"`,'hello'));
test(parse(rule`'hello'`,'hello'));
test( !parse(rule`hello`,'hello'));
test( !parse(rule`"hello'`,'hello'));

test(parse(rule`"hello" 'hello'`,'hellohello'));
test(parse(rule`'hello' 'hello'`,'hello hello'));
test(parse(rule`"hello" 'hello'`,'hello        hello'));
test(parse(rule`'hello hello'`,'hello hello'));
test( !parse(rule`hello hello`,'hello   hello'));

test(parse(rule`'hello'`,'hello'));
test( !parse(rule`'hallo'`,'hello'));
test(parse(rule`"hello"`,'hello'));
test( !parse(rule`"hello!"`,'hello'));

test(parse(rule`<abc>`,'a'));
test( !parse(rule`<abc>`,'d'));
test( !parse(rule`<abc>`,'abc'));

test(parse(rule`<a..c>`,'a'));
test( !parse(rule`<a..c>`,'d'));

test(parse(rule`"/*".."*/"`,"/* hello */"));
test(parse(rule`'/*'..'*/'`,"/* hello */"));

test(parse(rule`['hello']`,"hello"));
test(parse(rule`['hello']`,""));
test( !parse(rule`['hello']`,"helloo"));

test(parse(rule`{'hello'}`,"hello"));
test(parse(rule`{'hello'}`,"hellohello"));

test(parse(rule`!'x'"hello"`,"hello"));

test(parse(rule`'hello'|'goodbye'`,"hello"));
test(parse(rule`'hello'|'goodbye'`,"goodbye"));

test(parse(rule`{['foo']}`,''));
test(parse(rule`{['foo']}`,'foo'));
test(parse(rule`{['foo']}`,'foofoo'));

test( !parse(rule`'foo':1..2`,''));
test(parse(rule`'foo':1..2`,'foo'));
test(parse(rule`'foo':1..2`,'foofoo'));
test( !parse(rule`'foo':1..2`,'foofoofoo'));

test(parse(rule`'foo':..2`,''));
test(parse(rule`'foo':..2`,'foo'));
test(parse(rule`'foo':..2`,'foofoo'));
test( !parse(rule`'foo':..2`,'foofoofoo'));

test( !parse(rule`'foo':2..`,''));
test( !parse(rule`'foo':2..`,'foo'));
test(parse(rule`'foo':2..`,'foofoo'));
test(parse(rule`'foo':2..`,'foofoofoo'));

test( !parse(rule`'foo':2`,''));
test( !parse(rule`'foo':2`,'foo'));
test(parse(rule`'foo':2`,'foofoo'));
test( !parse(rule`'foo':2`,'foofoofoo'));

console.log("End test");
if(fails>0) console.log(`** There were ${fails} fail(s)`);