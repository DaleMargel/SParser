# **SParser.js**
**A library that lets you to write a compiler with minimal mess, fuss and code.**

## Why?
Writing a compiler is hard to do. There are a lot of tools to help you do this, but most require you learn obscure scripts that are not always intuitive. The resulting code is big, opaque and difficult to understand or debug.

SParser takes a different tack. It starts by asking what is the minimum that a developer needs to write to describe a compiler.

- Rules are created using tagged template literals that can be nested inside of other rules.
- Rules are described using a sensible BNF-like syntax.
- An action can be attached to a rule to fire when the rule succeeds.

This allows the developer to write rules in a minimalistic fashion. The resulting code is light and quite fast.

Additional Sparser features:

- **Small:** it is a 7.2k zero-dependency library that minifies/zips to 1.6k.
- **Hackable:** the code is simple enough understand and change the parts that you don't like.
- **Powerful:** Sparser is written in (a lower level of) itself!

## Overview
Sparser.js exports the following symbols.

### Rule
The Rule function lets you define rules using tagged template literals. For instance, the following `number` rule will read a string, translate it to a float, then push it on to a stack.

```javascript
	// read one or more digits
	const digits=rule`{<0..9>}`;

	// read and parse float then push it to a stack
	const number=rule`['-']${digits}['.'${digits}]`.ons(s => stak.push(parseFloat(s)) );
```

When creating a rule, the construction will either return a rule or throw an exception. If a rule is badly formed, there is no point in proceeding and the developer should know this as soon as possible.

```javascript
	// this will throw an exception: {err: 'syntax' text: '['-'}${}['.'${}]'}
	const number=rule`['-'}${digits}['.'${digits}]`;
```

Each rule is applied in an all-or-none way. If any part of a rule fails, the entire rule will quit without side effects. When a rule suceeds, it will consume the matching text and optionally store an action to be run at a later time.

Actions are created by registering an arrow function with the rule. This is done by `rule.on(()=>...)` or `rule.ons(s=>..)`. The `ons()` method will provide the string that was parsed and let you run some code with it. If you do not need the string, then you can call `on()` which does not pass anything. This saves your code the overhead of having to extract the string prior to calling your handlers.

### Defer
The `rules` function works fine until you need to use a rule before it has been defined - that is, a rule that indirectly includes itself. Here we use `defer` as a placeholder then set it later.

```javascript
	// contrived example to show how to use defer()
	const expr = defer();
	const brule = rule`'B'[${expr}]`;
	const arule = rule`'A'[${brule}]`;
	expr.set(arule); // ABABABA...
```

### Parse
Once you have built the parse tree, you can pass it to a parser function with the text you need to parse. The parser will return true on success. Currently there is only coarse error detection, but I expect to change this sometime.

```javascript
	// example of using parse with expr from above
	parse(expr,"ABAB"); // returns true
	parse(expr,"ABBA"); // returns false
```

The parse function can reasonably fail and will return true or false. There is no elaborate error reporting at this time.

Internally, the parser will try to match the rule structure to the text provided. The parse is considered successful when a path through the rules can be found that consumes exactly the text provided to be parsed. For any rules that have actions, the actions are collected and executed once the parsing has successfully completed.

## Syntax
The rule syntax is a modified BNF that has been tweaked to make it easier to use. However, it can still get quite complicated. Generally speaking:

| Construct | Meaning |
| --------- | ------- |
| \< \> | Character set |
| [ ] | Optional |
| { } | One or more |
| ( ) | Parenthesis |
| .. | Range |
| : | Occurrences |
| ! | Not |
| \| | Or |
| & | And |
| " " | Text delimiting |
| ' ' | Text delimiting |
| * | Any character |

Here is how to use them:

| Example | Description | Notes |
| ------- | ----------- | ----- |
| \<a..z\> | match a character from `a` to `z` inclusive | |
| \<abc\> | match `a` or `b` or  `c` | |
| 'abc' | match the string `abc` | single and double quotes ok if not mixed |
| '' | null match | always succeeds, consumes no input |
| * | matches any character | |
| A B | match spaces/tabs between `A` and `B` | 0 or more spaces and tabs matched |
| {A} | match 1 or more occurences of `A` | |
| [A] | match 0 or 1 occurences of `A` | |
| [{A}] | match 0 or more occurrences of `A` | |
| {[A]} | match 0 or more occurrences of `A` | cast to [{A}] internally |
| A:3 | match 3 occurrences of `A` | |
| A:3..5 | match 3 to 5 occurrences of `A` | |
| A:3.. | match at least 3 occurrences of `A` | |
| A:..5 | match up to 5 occurrences of `A` | |
| A:.. | match 0 or more occurrences of `A` | |
| (A) | enforce order of operation | |
| !A | match non-existence of `A` | consumes no input |
| !!A | look ahead match `A` | consumes no input |
| A\|B\|C | match one of `A` or `B` or `C` | searched in list order, first found |
| A&B&C | match `A` then `B` then `C` | all required|
| ABC | match `A` then `B` then `C` | `&` symbols implied |
| ${A} | insertion of rule | string template literal |

Refer to demos and tests for more details.

### Why not use RegEx syntax?
I thought about using the RegEx syntax but decided not to. This is because we are doing something fundamentally different. Many of the RegEx flags and constructs make no sense here. Other features are awkward or missing. Rather than hack RegEx (and confuse everybody) I decided to go with BNF-esque syntax. This is simpler and is better suited to what we are doing anyhow. It has morphed a bit over time but still tries to remain as simple as possible.

### What's with the name SParser
I am not good at names or branding. This code is a 'String Parser' that I shortened to 'SParser'. Coincidentally, the word 'sparse' can imply something small and minimal. I like that. The basic parser engine is just over 7k (min/zips to less than 2k). That is small by any measure.

### Things to keep in mind:
- Each rule should try to consume at least one character.
- Handlers are called after all parsing has finished.
- Writing a compiler can be difficult. Take your time.