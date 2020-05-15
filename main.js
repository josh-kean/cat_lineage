const fs = require('fs');
let Web3 = require('web3');
let kitties_json = require('./kitties.json');

let web3 = new Web3(//removed infura key); 

let kitties = new web3.eth.Contract(JSON.parse(kitties_json.result), "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d");

const start_block = 6607985;
const end_block = 7028323;

let getBirths = async(start, end) => { //function checks for 'Birth' emitter and stores block numbers
	await kitties.getPastEvents('Birth', {
		fromBlock: start,
		toBlock: end
	}).then(result => {blocks = result});
	return blocks;
}

let getBirthBlocks = async(block_objects) => { //returns an array of all blocks between start and end block
	block_numbers = [];
	for (let x of block_objects) {
		block_numbers.push(x.blockNumber);
	}
	return block_numbers;
}

//assumption is there aren't millions of kitties, and kitties can be stored in a list of objects

let getAllBirthBlocks = async() => {
	fs.writeFileSync('birthBlocks.json', JSON.stringify([]));
	for (let block = start_block; block < end_block; block+=1000) {
		//open birthBlocks json file
		let birthBlocksString = fs.readFileSync('birthBlocks.json');
		//convery birthBlocks json file to json object using JSON.parse()
		let birthBlocksArray = JSON.parse(birthBlocksString);
		//append new blocks to json file array
		let end = block+1000 < end_block? block+1000 : end_block;
		let births = await getBirths(block, end);
		let birthBlocks = await getBirthBlocks(births);
		for (let x of birthBlocks) {
			birthBlocksArray.push(x);
		}
		//convery back to json string using JSON.stringify
		let birthBlocksJSON = JSON.stringify(birthBlocksArray)
		//overwrite json file
		fs.writeFileSync('birthBlocks.json', birthBlocksJSON)
	}
}

let new_kitty = (owner, kittyId, matronId, sireId, genes, births) => {
	return {
		owner: owner,
		kittyId: kittyId,
		matronId: matronId,
		sireId, sireId,
		genes: genes,
		births: births
	}
}

let scanBirthBlocks = async() => {
	let birthBlocks = fs.readFileSync('birthBlocks.json');
	let blocks = JSON.parse(birthBlocks); //convert to a string
	fs.writeFileSync('kitties_array.json', JSON.stringify([])); //create an empty string to save to

	//for (let block of blocks) { //for loop to read each block at a time
	for (let block = 0; block < blocks.length; block+=5000) { //for loop to read each block at a time
		let kittiesJSON = await fs.readFileSync('kitties_array.json');
		let kittiesArray = JSON.parse(kittiesJSON); //now have string of kitties
		let end = block+4999 < blocks.length? block+4999 : blocks.length-1;
		let block_events = await kitties.getPastEvents('Birth', {
			fromBlock: blocks[block],
			toBlock: blocks[end]
		}); //creates a promise containing all events from block
		for (let e of block_events) {
			//check to see if kitty address is already is kitties
			//if it is, increase their birth by one
			//if it is not, push new kitty object to kitties array

			if (e.event === "Birth") {
				let results = e.returnValues;
				if (kittiesArray.length === 0) {
					kittiesArray.push(new_kitty(
						results.owner, 
						results.kittyId, 
						results.matronId, 
						results.sireId, 
						results.genes, 
						0)
					);
				} else if (kittiesArray.map(cat => cat.kittyId).includes(results.matronId)) {
					let i = kittiesArray.map(cat => cat.kittyId).indexOf(results.matronId);
					kittiesArray[i].births++;
				} else {
					kittiesArray.push(new_kitty(
						results.owner, 
						results.kittyId, 
						results.matronId, 
						results.sireId, 
						results.genes, 
						0)
					);
				}
			}
		}
		let kittiesString = JSON.stringify(kittiesArray);
		fs.writeFileSync('kitties_array.json', kittiesString);
		console.log(blocks[block]);
	}
}

let getMaxBirths = () => {
	let birthsJSON = fs.readFileSync('kitties_array.json');
	let births = JSON.parse(birthsJSON);
	let birth_count = births.map(birth => birth.births);
	let max_birth = Math.max.apply(null, birth_count);
	let max_birth_index = births.map(birth => birth.births).indexOf(max_birth);
	console.log(max_birth);
	return births[max_birth_index];
}

let getKittyInfo = async() => {
	let max_cat = getMaxBirths();
	let cat_info = await kitties.methods.getKitty(max_cat.kittyId).call();

	//console.log(cat_info);
}



//getAllBirthBlocks() //this line is to collect all blocks with a kitty birth tx, do not uncomment
//scanBirthBlocks(); //this line collected all birth events. do not uncomment
//
//getMaxBirths();
getKittyInfo();

