import {calc} from './calculator.js';

function setElement(element){
	element.oninput = (ev)=>{
		let nl = 
			(ev.inputType === 'insertLineBreak') ||
			(ev.inputType === 'insertText' && ev.data === null);

		if(nl){
			let elem = ev.target;
			let text = elem.value.split("\n")[0];
			let result = calc(text);
			if(result === false) result = "Cannot solve "+text;
			elem.value = text + '\n' + result;
		}
	}
}
export {setElement}
