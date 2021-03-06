import {parse,rule} from './sparser.js';

let fails = 0;
let flag="";

function test(result){
	if(!result) fails++;
}

console.log("Begin test");

// test that string sequences can be parsed
test(parse(rule`"abc"`,'abc')); // double quotes
test(parse(rule`'abc'`,'abc')); // single quotes
test( !parse(rule`'abc'`,'def')); // wrong string

// test whitespace handling
// whitespace can be any size, include tabs but not newline
test(parse(rule`"abc" 'def'`,'abcdef')); // no space
test(parse(rule`'abc' 'def'`,'abc def')); // one space 
test(parse(rule`"abc" 'def'`,'abc   def')); // multi space
test(parse(rule`"abc" 'def'`,'abc \t def')); // multi space with tabs
test( !parse(rule`"abc" 'def'`,'abd \n def')); // not new line

// test wildcards
test(parse(rule`*`,'a'));
test(parse(rule`**`,'ab'));
test(parse(rule`***`,'abc'));
test( !parse(rule`*`,'ab'));
test( !parse(rule`**`,'a'));

// test character sets
test(parse(rule`<abc>`,'a')); // a in abc
test(parse(rule`<abc>`,'b')); // b in abc
test(parse(rule`<abc>`,'c')); // c in abc
test( !parse(rule`<abc>`,'d')); // d not in abc
test( !parse(rule`<abc>`,'abc')); // must be single match

// test character ranges
test(parse(rule`<a..c>`,'a')); // a in range
test(parse(rule`<a..c>`,'b')); // b in range
test(parse(rule`<a..c>`,'c')); // c in range
test( !parse(rule`<a..c>`,'d')); // d not in range
test( !parse(rule`<a..c>`,'abc')); // must be a single match

// test parsing C style comments
// this is a construct to scan delmited text
test(parse(rule`'/*'[{!'*/'*}]'*/'`,"/* hello world */"));
test( !parse(rule`'/*'[{!'*/'*}]'*/'`,"/* hello world"));

// test optional occurrences
test(parse(rule`['abc']`,"")); // no occurrences ok
test(parse(rule`['abc']`,"abc")); // one occurrence ok
test( !parse(rule`['abc']`,"abcabc")); // second occurrence not matched

// test one or more occurrences
test( !parse(rule`{'abc'}`,"")); // no occurrences, cannot match 
test(parse(rule`{'abc'}`,"abc")); // one occurrence ok
test(parse(rule`{'abc'}`,"abcabc")); // two occurrences ok
test(parse(rule`{'abc'}`,"abcabcabc")); // two occurrences ok

// test {[]} zero or more
test(parse(rule`{['abc']}`,'')); // 0 occurrences ok
test(parse(rule`{['abc']}`,'abc')); // 1 occurrence ok 
test(parse(rule`{['abc']}`,'abcabc')); // 2 occurrences ok
test(parse(rule`{['abc']}`,'abcabcabc')); // 3 occurrences ok

test(parse(rule`[{'abc'}]`,'')); // 0 occurrences ok
test(parse(rule`[{'abc'}]`,'abc')); // 1 occurrence ok 
test(parse(rule`[{'abc'}]`,'abcabc')); // 2 occurrences ok
test(parse(rule`[{'abc'}]`,'abcabcabc')); // 3 occurrences ok

// test not match
test(parse(rule`!'abc'"def"`,"def")); // abc not found ok
test(parse(rule`!!'abc'"abcdef"`,"abcdef")); // abc checked then read ok

// test | or
test(parse(rule`'abc'|'def'`,"abc")); // first found ok
test(parse(rule`'abc'|'def'`,"def")); // second found ok
test( !parse(rule`'abc'|'def'`,"ghi")); // ghi not found

// test & and
test(parse(rule`'abc'&'def'`,"abcdef")); // explicit & ok
test(parse(rule`'abc''def'`,"abcdef")); // implicit & ok
test( !parse(rule`'abc''def'`,"abc")); // incomplete bad

// More precise occurs

// test 2 occurrences
test( !parse(rule`'abc':2`,'')); // 0 occurrences bad
test( !parse(rule`'abc':2`,'abc')); // 1 occurrence bad
test(parse(rule`'abc':2`,'abcabc')); // 2 occurrences ok
test( !parse(rule`'abc':2`,'abcabcabc')); // 3 occurrences bad

// test 1..2 occurrences
test( !parse(rule`'abc':1..2`,'')); // 0 occurrences bad
test(parse(rule`'abc':1..2`,'abc')); // 1 occurrence ok
test(parse(rule`'abc':1..2`,'abcabc')); // 2 occurrences ok
test( !parse(rule`'abc':1..2`,'abcabcabc')); // 3 occurrences bad

// test up to 2 occurrences
test(parse(rule`'abc':..2`,'')); // 0 occurrences ok
test(parse(rule`'abc':..2`,'abc')); // 1 occurrence ok
test(parse(rule`'abc':..2`,'abcabc')); // 2 occurrences ok
test( !parse(rule`'abc':..2`,'abcabcabc')); // 3 occurrences bad

// test at least 2 occurrences
test( !parse(rule`'abc':2..`,'')); // 0 occurrences bad
test( !parse(rule`'abc':2..`,'abc')); // 1 occurrence bad
test(parse(rule`'abc':2..`,'abcabc')); // 2 occurrences ok
test(parse(rule`'abc':2..`,'abcabcabc')); // 3 occurrences ok

// test zero or more 
test(parse(rule`'abc':..`,'')); // 0 occurrences ok
test(parse(rule`'abc':..`,'abc')); // 1 occurrence ok
test(parse(rule`'abc':..`,'abcabc')); // 2 occurrences ok
test(parse(rule`'abc':..`,'abcabcabc')); // 3 occurrences ok

// test null match
test(parse(rule`""`,"")); // null match on nothing (double quotes) ok
test(parse(rule`''`,"")); // null match on nothing (single quotes) ok
test(parse(rule``,"")); // null match empty ok
test( !parse(rule`''`,"abc")); // null match on something bad
test(parse(rule`'''abc'`,"abc")); // null match combined with something ok

let empty;

flag="false";
empty=rule``.on(()=>flag="true1");
test(parse(rule`${empty}`,''));
test(flag,"true1");

flag="false";
empty=rule`''`.on(()=>flag="true2");
test(parse(rule`${empty}`,''));
test(flag,"true2");

flag="false";
empty=rule`""`.on(()=>flag="true3");
test(parse(rule`${empty}`,''));
test(flag,"true3");

// test some invalid rule sequences
// these should throw an exception
// because they are seriously wrong

flag=false;
try{ parse(rule`abc`,'abc') } // no quotes
catch(e){flag=e.text}
test(flag,"abc");

flag=false;
try{ parse(rule`"abc'`,'abc') } // mixed quotes
catch(e){flag=e.text}
test(flag,"abc");

flag=false;
try{ parse(rule`[{'abc']}`,'abc') } // messed up brackets 
catch(e){flag=e.text}
test(flag,"[{'abc']}");

// test actions

// run action 'on' embedded null match
let rule0=rule`''`.on(()=>flag='rule0');
test(parse(rule`${rule0}`,""));
test(flag==='rule0');

// run action 'ons' embedded sequence match
flag="";
let rule2=rule`'abc'`.ons(s=>flag=s+" ok");
test(parse(rule`${rule2}`,"abc"));
test(flag==='abc ok');

console.log("End test");
if(fails>0) console.log(`** There were ${fails} fail(s)`);