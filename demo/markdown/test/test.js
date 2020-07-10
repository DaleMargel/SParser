import {read as md} from "../markdown.js";

let errs=0;
function sanitize(str){
	return str.replace(/\n/g,"\\n").replace(/\t/g,"\\t");
}
function test(result,expect){
	if(expect===result){
		console.log(`ok: ${sanitize(expect)}`);
	}
	else {
		errs++;
		result = (result) ? sanitize(result) : "false";
		expect = sanitize(expect);
		console.log(`error: expected ${expect} / got ${result}`);
	}	
}
console.log("Begin test");

// paragraph
test(md("abc"),'<p>abc</p>\n');
test(md("abc\n"),'<p>abc</p>\n');
test(md("a`b`c"),'<p>a<code>b</code>c</p>\n');
test(md("a*b*c"),'<p>a<i>b</i>c</p>\n');
test(md("a**b**c"),'<p>a<b>b</b>c</p>\n');
test(md("a~~b~~c"),'<p>a<s>b</s>c</p>\n');
test(md("[google](www.google.com)"),'<p><a href="www.google.com">google</a></p>\n');

test(md("**abc**"),'<p><b>abc</b></p>\n');
test(md("**`abc`**"),'<p><b><code>abc</code></b></p>\n');
//test(md("**a*b*c**"),"<b>a<i>b</i>c</b>"); // WRONG

test(md("**a_b_c**"),'<p><b>a<i>b</i>c</b></p>\n');
test(md("**a~~b~~c**"),'<p><b>a<s>b</s>c</b></p>\n');
test(md("**a**b**c**"),'<p><b>a</b>b<b>c</b></p>\n');
test(md("**a__b__c**"),'<p><b>a<b>b</b>c</b></p>\n');
test(md("**abc*"),'<p>*<i>abc</i></p>\n');
test(md("**abc"),'<p>**abc</p>\n');
test(md("**[google](www.google.com)**"),'<p><b><a href="www.google.com">google</a></b></p>\n');

test(md("__abc__"),'<p><b>abc</b></p>\n');
test(md("__`abc`_"),'<p>_<i><code>abc</code></i></p>\n');
test(md("__a*b*c__"),'<p><b>a<i>b</i>c</b></p>\n');
//test(md("__a_b_c__"),"<p><b>a<i>b</i>c</b></p>\n"); // WRONG
test(md("__a**b**c__"),"<p><b>a*<i>b</i>*c</b></p>\n");
test(md("__a__b__c__"),'<p><b>a<b>b</b>c</b></p>\n');
test(md("__abc__"),'<p><b>abc</b></p>\n');
test(md("__abc"),'<p>__abc</p>\n');
test(md("__[google](www.google.com)__"),'<p><b><a href="www.google.com">google</a></b></p>\n');

test(md("*abc*"),'<p><i>abc</i></p>\n');
test(md("*`abc`*"),'<p><i><code>abc</code></i></p>\n');
test(md("*a**b**c*"),'<p><i>a<b>b</b>c</i></p>\n');
test(md("*a__b__c*"),'<p><i>a<b>b</b>c</i></p>\n');
test(md("*a~~b~~c*"),'<p><i>a<s>b</s>c</i></p>\n');
test(md("*a*b*c*"),'<p><i>a</i>b<i>c</i></p>\n');
test(md("*a_b_c*"),'<p><i>a<i>b</i>c</i></p>\n');
test(md("*abc**"),'<p><i>abc</i>*</p>\n');
test(md("*abc"),'<p>*abc</p>\n');
test(md("*[google](www.google.com)*"),'<p><i><a href="www.google.com">google</a></i></p>\n');

test(md("_abc_"),'<p><i>abc</i></p>\n');
test(md("_`abc`_"),'<p><i><code>abc</code></i></p>\n');
test(md("_a**b**c_"),'<p><i>a<b>b</b>c</i></p>\n');
test(md("_a__b__c_"),'<p><i>a<b>b</b>c</i></p>\n');
test(md("_a~~b~~c_"),'<p><i>a<s>b</s>c</i></p>\n');
test(md("_a*b*c_"),'<p><i>a<i>b</i>c</i></p>\n');
test(md("_a_b_c_"),'<p><i>a</i>b<i>c</i></p>\n');
test(md("_abc__"),'<p><i>abc</i>_</p>\n');
test(md("_[google](www.google.com)_"),'<p><i><a href="www.google.com">google</a></i></p>\n');

test(md("~~abc~~"),'<p><s>abc</s></p>\n');
test(md("~~`abc`~~"),'<p><s><code>abc</code></s></p>\n');
test(md("~~a**b**c~~"),'<p><s>a<b>b</b>c</s></p>\n');
test(md("~~a__b__c~~"),'<p><s>a<b>b</b>c</s></p>\n');
test(md("~~a*b*c~~"),'<p><s>a<i>b</i>c</s></p>\n');
test(md("~~a_b_c~~"),'<p><s>a<i>b</i>c</s></p>\n');
test(md("~~a~~b~~c~~"),'<p><s>a</s>b<s>c</s></p>\n');
test(md("~~[google](www.google.com)~~"),'<p><s><a href="www.google.com">google</a></s></p>\n');

test(md("`abc`"),'<p><code>abc</code></p>\n');
test(md("`**abc**`"),'<p><code>**abc**</code></p>\n');
test(md("`__abc__`"),'<p><code>__abc__</code></p>\n');
test(md("`*abc*`"),'<p><code>*abc*</code></p>\n');
test(md("`_abc_`"),'<p><code>_abc_</code></p>\n');
test(md("`~~abc~~`"),'<p><code>~~abc~~</code></p>\n');
test(md("`a`b`c`"),'<p><code>a</code>b<code>c</code></p>\n');
test(md("`[google](www.google.com)`"),'<p><code>[google](www.google.com)</code></p>\n');

test(md('---\n'),'<hr>\n');
test(md('***\n'),'<hr>\n');
test(md('___\n'),'<hr>\n');
test(md('****\n'),'<hr>\n');
test(md('**\n'),"<p>**</p>\n");

test(md("[google](www.google.com)"),'<p><a href="www.google.com">google</a></p>\n');
test(md("[google](./localfile.txt)"),'<p><a href="./localfile.txt">google</a></p>\n');
test(md('[google](www.google.com "tip")'),'<p><a href="www.google.com" title="tip">google</a></p>\n');
test(md('[google](www.google.com"tip")'),'<p><a href="www.google.com" title="tip">google</a></p>\n');
test(md('[google](www.google.com     "tip")'),'<p><a href="www.google.com" title="tip">google</a></p>\n');

test(md('![google](www.google.com)'),'<p><img alt="google" src="www.google.com"></p>\n');
test(md('![google](www.google.com "some text")'),'<p><img alt="google" src="www.google.com" title="some text"></p>\n');

//setlink( {goog:{link:"www.google.com"}} );
//test(read("[google][goog]"),'<a href="www.google.com">google</a>');

//setlink( {goog:{link:"www.google.com",title:"some text"}} );
//test(read("[google][goog]"),'<a href="www.google.com" title="some text">google</a>');

//setlink( {} );
//test(read("[google][goog]"),'<a>google</a>');
//test(read(ref,`[goog]: www.google.com`),"goog");
//test(read("[google][goog]"),'<a href="www.google.com">google</a>');

//test(read(ref,`[goog]: www.google.com "some text"`),"goog");
//test(read("[google][goog]"),'<a href="www.google.com" title="some text">google</a>');

//test(read(ref,`[1]: www.google.com "some text"`),"1");
//test(read("[google][1]"),'<a href="www.google.com" title="some text">google</a>');

// line structures
test(md(">abc"),"<blockquote>abc</blockquote>\n");
test(md("> abc"),"<blockquote>abc</blockquote>\n");
test(md(">[google](www.google.com)"),'<blockquote><a href="www.google.com">google</a></blockquote>\n');

test(md("\tabc"),"<pre><code>abc</code></pre>\n");
test(md("    abc"),"<pre><code>abc</code></pre>\n");
test(md("\t\tabc"),"<pre><code>\tabc</code></pre>\n");
test(md("\t\t\tabc"),"<pre><code>\t\tabc</code></pre>\n");
test(md("     abc"),"<pre><code> abc</code></pre>\n");
test(md("        abc"),"<pre><code>    abc</code></pre>\n");
test(md("\tabc\n\tdef"),"<pre><code>abc\ndef</code></pre>\n");
test(md("\t[google](www.google.com)"),"<pre><code>[google](www.google.com)</code></pre>\n");

test(md("````\nabc\n````"),"<pre><code>abc\n</code></pre>\n");
test(md("````\nabc\ndef\n````"),"<pre><code>abc\ndef\n</code></pre>\n");

test(md("# abc"),"<h1>abc</h1>\n");
test(md("## abc"),"<h2>abc</h2>\n");
test(md("### abc"),"<h3>abc</h3>\n");
test(md("#### abc"),"<h4>abc</h4>\n");
test(md("##### abc"),"<h5>abc</h5>\n");
test(md("###### abc"),"<h6>abc</h6>\n");
test(md("####### abc"),"<p>####### abc</p>\n");
test(md("#     abc"),"<h1>abc</h1>\n");

test(md("# **abc**"),"<h1><b>abc</b></h1>\n");
test(md("# __abc__"),"<h1><b>abc</b></h1>\n");
test(md("# *abc*"),"<h1><i>abc</i></h1>\n");
test(md("# _abc_"),"<h1><i>abc</i></h1>\n");
test(md("# ~~abc~~"),"<h1><s>abc</s></h1>\n");

test(md("abc\n===\n"),"<h1>abc</h1>\n");
test(md("abc\n---\n"),"<h2>abc</h2>\n");

test(md("- abc"),"<ul>\n<li>abc</li>\n</ul>\n");
test(md("- abc\n- def"),"<ul>\n<li>abc</li>\n<li>def</li>\n</ul>\n");
test(md("1. abc"),"<ol>\n<li>abc</li>\n</ol>\n");
test(md("1. abc\n2. def"),"<ol>\n<li>abc</li>\n<li>def</li>\n</ol>\n");
test(md("1. abc\n22345. def"),"<ol>\n<li>abc</li>\n<li>def</li>\n</ol>\n");

test(md("| A | B |\n| --- | --- |\n| one | two |"),
	'<table>\n<tr>\n<th>A</th>\n<th>B</th>\n</tr>\n<tr>\n<td>one</td>\n<td>two</td>\n</tr>\n</table>\n');

test(md("| A | B |\n| ---:|:---:|\n| one | two |"),
	'<table>\n<tr>\n<th class="right">A</th>\n<th class="center">B</th>\n</tr>\n<tr>\n<td class="right">one</td>\n<td class="center">two</td>\n</tr>\n</table>\n');

//test(md("A | B\n--- | ---\none | two"),
//	'<table>\n<tr>\n<th>A</th>\n<th>B</th>\n</tr>\n<tr>\n<td>one</td>\n<td>two</td>\n</tr>\n</table>\n');

	console.log("End test");
if(errs) console.log(`There were ${errs} errors`)
else console.log('..Success')
