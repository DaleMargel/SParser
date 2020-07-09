class Reader {
	constructor(text) {
		this.text = text;
		this.index = 0;
		this.length = text.length;
	}
	seek(to){
		const result = (to <= this.length);
		if(result) this.index = to;
		return result;
	}
	tell(){ return this.index; }
	step(n=1){ return this.seek(this.index + n) }
	end(){ return this.index >= this.length }
	peek(){ return this.end() ? null : this.text.charAt(this.index) }
	fetch(start){ return this.text.substring(start, this.index) }
	match(str){
		const len = str.length;
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
		const tell = reader.tell();
		if(this.rule.match(reader,actions)){
			const arg= this.dflt || reader.fetch(tell);
			actions.push(new Action(this.action,arg));
			return true;
		}
		return false;
	}
}
class Rule {
	match(reader, actions){ return false }
	ons(action){ return new ActionRule(this,action) }
	on(action){  return new ActionRule(this,action,'') }
}
class AllOf extends Rule {
	constructor(rules){ super(); this.rules=rules }
	match(reader, actions) {
		const tell = reader.tell();
		const acts = [];
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
		const tell = reader.tell();
		for(let rule of this.rules) {
			const acts = [];
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
		const c = reader.peek();
		return c && this.text.includes(c) && reader.step();
	}
}
class Range extends Rule {
	constructor(lo,hi){ super(); this.lo=lo; this.hi=hi }
	match(reader){
		const c = reader.peek();
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
		const start=reader.tell();
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
		const tell=reader.tell();
		const result = !this.rule.match(reader,[]);
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
const max = Number.MAX_SAFE_INTEGER;
function allof(rules){return new AllOf(rules)}
function anyof(rules){return new AnyOf(rules)}
function occurs(min,max,rule){return new Occurs(min,max,rule)}
function optional(rule){return occurs(0,1,rule)}
function oneormore(rule){return occurs(1,max,rule)}
function zerormore(rule){return occurs(0,max,rule)}

function charset(s){return new Charset(s)}
function range(lo,hi){return new Range(lo,hi)}
function match(s){return new Match(s)}
function until(rule){return new Until(rule)}
function not(rule){return new Not(rule)}
function step(n=1){return new Step(n)}
function defer(){return new Defer(null)}
function result(bool) {return new Result(bool)}

let stak=[];
let rules=[];

function getSyntax(){
	const Any=defer();

	const Hole=match('${}').on(() => 
		stak.push(rules.shift() ));

	const Space=match(' ').on(() =>
		stak.push(zerormore(charset(' \t'))));
	
	const Splat=match('*').on(() => stak.push(step()) );

	const NQuote=anyof([ match("''"),match('""') ]).on(() => 
		stak.push(result(true)));

	const SQuote=allof([ 
		match("'"),
		until(match("'")).ons(s => stak.push(match(s))),
		match("'") ]);

	const DQuote=allof([
		match('"'),
		until(match('"')).ons(s => stak.push(match(s))),
		match('"') ]);
	
	const Quote=anyof([ NQuote,SQuote,DQuote,Splat ]);
	
	const Char=step().ons(s => stak.push(s));

	const CRange=allof([ match('<'),Char,match('..'),Char,match('>') ]).ons(s=> {
		let [a,b]=stak.splice(-2);
		stak.push(range(a,b)) });
	
	const Charset=allof([
		match('<'),
		until(match('>')).ons(s => stak.push(charset(s)) ),
		match('>') ]);

	const Str=anyof([ Space,Hole,CRange,Charset,Quote ]);

	const Ops=defer();
	
	const MO=allof([ match('{['),Any,match(']}') ]).on(() => 
		stak.push( zerormore(stak.pop()) ));
		
	const OM=allof([ match('{['),Any,match(']}') ]).on(() => 
		stak.push( zerormore(stak.pop()) ));

	const Opt=allof([ match('['),Any,match(']') ]).on(() => 
		stak.push(optional(stak.pop()) ));

	const Many=allof([ match('{'),Any,match('}') ]).on(() => 
		stak.push(oneormore(stak.pop()) ));

	const Paren=allof([ match('('),Any,match(')') ]);

	const Not=allof([ match("!"),Ops.on(() => 
		stak.push(not(stak.pop())) )]);

	Ops.set(anyof([ Str,OM,MO,Opt,Many,Paren,Not ]));

	const Int=oneormore(range('0','9')).ons(s =>
		stak.push(parseInt(s) ));

	const Occur=allof([
		match(':'),
		anyof([ Int, result(true).on(() => stak.push(0)) ]),
		match('..'),
		anyof([ Int, result(true).on(() => stak.push(max)) ]) 
	]).on(() => {
		let [rule,min,max]=stak.splice(-3);
		stak.push(occurs(min,max,rule));
	});

	const Repeat=allof([ match(':'),Int ]).on(() => {
		let [rule,n] = stak.splice(-2);
		stak.push(occurs(n,n,rule)) });
	
	const Or=allof([ 
		match('|'), 
		Ops.on(() => 
			stak.push(anyof(stak.splice(-2))) )]);

	const Join=Ops.on(() => 
		stak.push(allof(stak.splice(-2))) );

	const And=allof([ match('&'),Join ]);
	
	const Bool=allof([ Ops,optional(oneormore(anyof([ Or,And,Occur,Repeat,Join ]))) ]);

	Any.set(Bool);
	return Any;
}
function parse(rule,text){
	const actions = [];
	const reader = new Reader(text);
	const result = rule.match(reader, actions) && reader.end();
	if(result) for(let action of actions) action.run();
	return result;
}
let syntax = null;
function rule(strings,...holes){
	rules.splice(0);
	rules.push(...holes);
	const text=strings.join('${}');

	if(!syntax) syntax=getSyntax();
	if(!parse(syntax,text)) throw {error: "syntax", text: text}
	if(stak.length != 1) throw {error: "semantic", text: text}
	return stak.pop();
}
export { rule, parse, defer };