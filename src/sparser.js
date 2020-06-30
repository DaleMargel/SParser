class Reader {
	constructor(text) {
		this.text = text;
		this.index = 0;
		this.length = text.length;
	}
	seek(to){
		let result = (to <= this.length);
		if(result) this.index = to;
		return result;
	}
	tell(){ return this.index; }
	step(n=1){ return this.seek(this.index + n) }
	end(){ return this.index >= this.length }
	peek(){ return this.end() ? null : this.text.charAt(this.index) }
	fetch(start){ return this.text.substring(start, this.index) }
	match(str){
		let len = str.length;
		return (this.index + len <= this.length) &&
			(this.text.substr(this.index,len)===str) &&
			this.step(len);
	}
}
class Action {
	constructor(action, text) { this.action=action; this.text=text }
	run() { this.action(this.text) }
}
class ActionRule {
	constructor(rule,action,dflt){ this.rule=rule; this.action=action, this.dflt=dflt }
	match(reader,actions){
		let tell = reader.tell();
		if(this.rule.match(reader,actions)){
			let arg= this.dflt || reader.fetch(tell);
			actions.push(new Action(this.action,arg));
			return true;
		}
		return false;
	}
}
class Rule {
	match(reader, actions){ return false }
	ons(action){ return new ActionRule(this,action) }
	onx(action){ return new ActionRule(this,action,'') }
}
class AllOf extends Rule {
	constructor(rules){ super(); this.rules=rules }
	match(reader, actions) {
		let tell = reader.tell();
		let acts = [];
		for(let rule of this.rules) {
			if (!rule.match(reader,acts)) {
				reader.seek(tell);
				return false;
			}
		}
		actions.push(...acts);
		return true;
	}
}
class AnyOf extends Rule {
	constructor(rules){ super(); this.rules=rules }
	match(reader, actions) {
		let tell = reader.tell();
		for(let rule of this.rules) {
			let acts = [];
			if (rule.match(reader, acts)) {
				actions.push(...acts);
				return true;
			}
			else reader.seek(tell);
		}
		return false;
	}
}
class Charset extends Rule {
	constructor(text){ super(); this.text=text }
	match(reader){ 
		let c = reader.peek();
		return c && this.text.includes(c) && reader.step();
	}
}
class Range extends Rule {
	constructor(lo,hi){ super(); this.lo=lo; this.hi=hi }
	match(reader){
		let c = reader.peek();
		return c && c >= this.lo && c <= this.hi && reader.step();
	}
}
class Match extends Rule {
	constructor(text){ super(); this.text=text }
	match(reader){ return reader.match(this.text) }
}
class Defer extends Rule {
	constructor(rule=null){ super(); this.rule=rule; }
	set(rule){ this.rule=rule }
	match(reader,actions){ return this.rule.match(reader,actions) }
}
class Until extends Rule {
	constructor(rule){ super(); this.rule=rule }
	match(reader,actions){
		let start=reader.tell();
		let tell=start;
		while(!reader.end() && !this.rule.match(reader,actions)){
			if(!reader.step()) break;
			tell=reader.tell();
		}
		reader.seek(tell);
		return tell>start;
	}
}
class Occurs extends Rule {
	constructor(min,max,rule){ super(); this.rule=rule; this.min=min; this.max=max }
	match(reader,actions){
		let tell=reader.tell();
		for(var i=0; i<this.max; i++) 
			if(!this.rule.match(reader,actions)) break;
		if(i<this.min){
			tell=reader.seek(tell);
			return false;
		}
		return true;
	}
}
class Not extends Rule {
	constructor(rule){ super(); this.rule=rule }
	match(reader){
		let tell=reader.tell();
		let result = !this.rule.match(reader,[]);
		reader.seek(tell);
		return result;
	}
}
class Step extends Rule {
	constructor(step=1){ super(); this.step=step }
	match(reader){ return reader.step(this.step) }
}
class Result extends Rule {
	constructor(bool){ super(); this.result=bool; }
	match(){ return this.result }
}
class End extends Rule {
	match(reader){ return reader.end() }
}
let max = Number.MAX_SAFE_INTEGER;
function allof(rules){return new AllOf(rules)}
function anyof(rules){return new AnyOf(rules)}
function optional(rule){return new Occurs(0,1,rule)}
function oneormore(rule){return new Occurs(1,max,rule)}
function zerormore(rule){return new Occurs(0,max,rule)}
function occurs(min,max,rule){return new Occurs(min,max,rule)}

function charset(s){return new Charset(s)}
function range(lo,hi){return new Range(lo,hi)}
function match(s){return new Match(s)}
function until(rule){return new Until(rule)}
function not(rule){return new Not(rule)}
function step(n=1){return new Step(n)}
function end(){return new End()}
function defer(){return new Defer(null)}
function wrap(rule){return new Defer(rule)}
function result(bool) {return new Result(bool)}

let stak=[];
let rules=[];

function getroot(){
	let ANY=defer();

	let Hole=match('`').onx(() => 
		stak.push(rules.shift() ));

	let Space=match(' ').onx(() =>
		stak.push(optional(oneormore(match(' ')))) );
	
	let Text=until(
		anyof([ end(),match('..'),charset(":[]{}()<>|`'!\"") ])).ons(s => 
			stak.push(match(s)) );

	let Delim1=match("'..'").onx(() => stak.push(allof([match("'"),until(match("'")),match("'")])) );
	let Delim2=match('".."').onx(() => stak.push(allof([match('"'),until(match('"')),match('"')])) );
	let Delim3=allof([ Text,match('..'),Text ]).onx(() => {
		let [a,b]=stak.splice(-2);
		stak.push(allof([ a,until(b),b ])) });

	let Quote1=allof([ 
		match("'"),// not('..'),
		until(match("'")).ons(s=> stak.push(match(s))),
		match("'") ]);

	let Quote2=allof([
		match('"'), //not('..'),
		until(match('"')).ons(s=> stak.push(match(s))),
		match('"') ]);

	let Range=allof([ 
		match('<'),step(),
		match('..'),step(),
		match('>') ]).ons(s=> 
			stak.push(range(s.charAt(1),s.charAt(4))) ); // TODO: fix for n>9
	
	let Charset=allof([
		match('<'),
		until(match('>')).ons(s=> stak.push(charset(s)) ),
		match('>') ]);

	let STR=anyof([ Space,Hole,Delim1,Delim2,Delim3,Quote1,Quote2,Range,Charset, Text ]);

	let OPS=defer();
	
	let MO=allof([ match('{['),ANY,match(']}') ]).onx(() => 
		stak.push( zerormore(stak.pop()) ));
		
	let OM=allof([ match('{['),ANY,match(']}') ]).onx(() => 
		stak.push( zerormore(stak.pop()) ));

	let Opt=allof([ match('['),ANY,match(']') ]).onx(() => 
		stak.push(optional(stak.pop()) ));

	let Many=allof([ match('{'),ANY,match('}') ]).onx(() => 
		stak.push(oneormore(stak.pop()) ));

	let Paren=allof([ match('('),ANY,match(')') ]);

	let Not=allof([ match("!"),wrap( OPS ).onx(() => 
		stak.push(not(stak.pop())) )]);

	OPS.set(anyof([ OM,MO,Opt,Many,Paren,Not,STR ]));

	let Int=oneormore(range('0','9')).ons(s =>
		stak.push(parseInt(s) ));

	let Rang=allof([ 
		anyof([ Int, result(true).onx(()=> stak.push(0)) ]),
		match('..'),
		anyof([ Int, result(true).onx(()=> stak.push(max)) ]),
	]).onx(() => {
		let [rule,min,max]=stak.splice(-3);
		stak.push(occurs(min,max,rule));
	});

	let Occur=allof([ 
		match(':'),anyof([ allof([match('('),Rang,match(')')]),Rang ]) ]);

	let Repeat=allof([ 
		match(':'),anyof([ allof([match('('),Int,match(')')]),Int ]).ons(()=> {
			let [rule,n] = stak.splice(-2);
			stak.push(occurs(n,n,rule)) }) 
		]);
	
	let Or=allof([ match('|'), wrap( OPS ).onx(() => 
		stak.push(anyof(stak.splice(-2))) ) ]);

	let Join=wrap( OPS ).onx(() => 
		stak.push(allof(stak.splice(-2))) );

	let And=allof([ match('&'),Join ]);
	
	let BOOL=allof([ OPS,optional(oneormore(anyof([ Or,And,Occur,Repeat,Join ]))) ]);

	ANY.set(BOOL);
	return ANY;
}
function parse(rule,text){
	let result=false;
	if(rule){
		let actions = [];
		let reader = new Reader(text);
		result = rule.match(reader, actions) && reader.end();
		if(result) for(let action of actions) action.run();
	}
	return result;
}
let root = null;
function rule(strings,...holes){
	rules.splice(0);
	rules.push(...holes);
	if(!root) root=getroot();
	parse(root,strings.join('`'));
	return stak.pop();
}
module.exports.rule = rule;
module.exports.parse = parse;
module.exports.defer = defer;
